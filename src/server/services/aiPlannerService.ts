import { Type } from '@google/genai';
import { getGemini, geminiModel } from '../ai/gemini';
import { allPackages, type PackageRow } from '../db/repositories/packageRepo';
import { insertTripPlan } from '../db/repositories/planRepo';
import { appendEvent } from '../db/repositories/eventRepo';
import { tripPlanSchema, type TripPlan, type TripPlanRequest } from '../schemas/tripPlan';

export interface GeneratedPlan {
  plan: TripPlan;
  groundedPackageIds: string[];
  model: string;
}

/**
 * Picks the packages worth showing the model.
 *
 * Scored rather than filtered: a destination the agency has no package for
 * (say "Iceland") should still produce a plan, grounded in whatever is
 * closest, instead of an empty prompt.
 */
function selectCandidatePackages(
  packages: PackageRow[],
  request: TripPlanRequest,
  limit = 6
): PackageRow[] {
  const needle = request.destination.toLowerCase();
  const words = needle.split(/[\s,]+/).filter((w) => w.length > 3);

  const scored = packages.map((pkg) => {
    const haystack = `${pkg.title} ${pkg.description ?? ''} ${pkg.best_for ?? ''}`.toLowerCase();
    let score = 0;

    if (haystack.includes(needle)) score += 10;
    for (const word of words) {
      if (haystack.includes(word)) score += 3;
    }
    if (request.travelType && (pkg.best_for ?? '').toLowerCase().includes(request.travelType.toLowerCase())) {
      score += 2;
    }

    return { pkg, score };
  });

  const matched = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  const chosen = matched.slice(0, limit).map((s) => s.pkg);

  // Nothing matched: fall back to a spread of the catalogue so the model still
  // knows what this agency actually sells.
  if (chosen.length === 0) {
    return packages.slice(0, limit);
  }
  return chosen;
}

function buildPrompt(request: TripPlanRequest, candidates: PackageRow[]): string {
  const inventory = candidates
    .map(
      (p) =>
        `- ${p.title} (${p.category}, ${p.duration ?? 'flexible'}, from ${p.starting_price ?? 'custom quote'})` +
        `${p.best_for ? ` — best for ${p.best_for}` : ''}`
    )
    .join('\n');

  return `You are a senior travel consultant at Agriya Travels, a premium tour operator based in Chennai, India.

Design a realistic, specific day-by-day itinerary for this client:
- Destination: ${request.destination}
- Departing from: ${request.startingCity}
- Duration: ${request.days} days
- Travellers: ${request.travellers}
- Travel style: ${request.travelType || 'not specified'}
- Budget tier: ${request.budget || 'Moderate'}
- Hotel preference: ${request.hotelPreference || 'not specified'}
- Vehicle preference: ${request.vehicleRequirement || 'not specified'}
- Planned travel date: ${request.travelDate || 'flexible'}
- Special requirements: ${request.specialNeeds || 'none'}

Packages Agriya Travels currently sells that relate to this request:
${inventory}

Requirements:
1. Name real places, landmarks, and experiences at the destination. Never write filler like "guided tour of iconic spots" — be concrete about which spots.
2. Write one itinerary entry per day, up to a maximum of 7 entries. If the trip is longer than 7 days, group the later days sensibly.
3. Base the cost estimate on the package prices listed above where they are relevant, scaled for ${request.travellers} travellers and ${request.days} days. Express it as an Indian Rupee range, e.g. "₹45,000 - ₹58,500".
4. Write the "note" as one or two sentences of genuinely useful practical advice for this specific destination and season — best time to visit, permits needed, weather warnings, or local customs.
5. Keep the tone warm and professional. This is shown directly to a paying customer.`;
}

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'A short, appealing title for the trip, e.g. "6-Day Family Escape to Munnar".',
    },
    highlights: {
      type: Type.ARRAY,
      description: 'Four short selling points for this specific trip.',
      items: { type: Type.STRING },
    },
    itinerary: {
      type: Type.ARRAY,
      description: 'Day-by-day plan, maximum 7 entries.',
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.INTEGER, description: 'Day number, starting at 1.' },
          title: { type: Type.STRING, description: 'Short title for the day.' },
          desc: { type: Type.STRING, description: 'Two or three sentences naming real places and activities.' },
        },
        required: ['day', 'title', 'desc'],
      },
    },
    cost: {
      type: Type.STRING,
      description: 'Total estimated cost range in INR for the whole party, e.g. "₹45,000 - ₹58,500".',
    },
    note: {
      type: Type.STRING,
      description: 'One or two sentences of practical, destination-specific advice.',
    },
  },
  required: ['title', 'highlights', 'itinerary', 'cost', 'note'],
};

/**
 * Generates an itinerary with Gemini, grounded in the agency's real catalogue,
 * and persists it. Throws if the model is unavailable or returns an
 * unparseable plan — the route turns that into a non-200 so the client can
 * fall back to its local template.
 */
export async function generatePlan(
  request: TripPlanRequest
): Promise<GeneratedPlan> {
  const packages = await allPackages();
  const candidates = selectCandidatePackages(packages, request);
  const model = geminiModel();

  const response = await getGemini().models.generateContent({
    model,
    contents: buildPrompt(request, candidates),
    config: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Gemini returned an empty response');
  }

  const parsed = tripPlanSchema.safeParse(JSON.parse(text));
  if (!parsed.success) {
    throw new Error(
      `Gemini response did not match the expected plan shape: ${parsed.error.issues
        .map((i) => i.path.join('.'))
        .join(', ')}`
    );
  }

  const plan = parsed.data;
  const groundedPackageIds = candidates.map((p) => p.id);

  const saved = await insertTripPlan({
    leadId: request.leadId ?? null,
    request,
    plan,
    model,
    groundedPackageIds,
    tokenUsage: response.usageMetadata ?? null,
    isFallback: false,
  });

  if (request.leadId) {
    await appendEvent(request.leadId, 'plan_generated', {
      planId: saved.id,
      destination: request.destination,
    });
  }

  return { plan, groundedPackageIds, model };
}
