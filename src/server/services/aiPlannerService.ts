import { Type } from '@google/genai';
import { generateWithFallback } from '../ai/gemini';
import { allPackages, type PackageRow } from '../db/repositories/packageRepo';
import { insertTripPlan } from '../db/repositories/planRepo';
import { appendEvent } from '../db/repositories/eventRepo';
import { tripPlanModelOutputSchema, type TripPlan, type TripPlanRequest } from '../schemas/tripPlan';
import { getGlobalFees } from '../db/repositories/travelRepo';
import { calculateCost, type CostInput, type FeeRule, type CostBreakdown } from './costEstimationService';

export interface GeneratedPlan {
  plan: TripPlan;
  groundedPackageIds: string[];
  model: string;
  /** Itemised, computed in code. The model never sees or produces this. */
  costBreakdown: CostBreakdown;
  costBasis: 'package' | 'day_rate';
}

export interface CandidateSelection {
  packages: PackageRow[];
  /** False when nothing matched the destination and we fell back to a sample. */
  destinationMatched: boolean;
}

/**
 * Picks the packages worth showing the model.
 *
 * Relevance is decided by the DESTINATION alone. travelType is only ever a
 * tie-breaker between destination matches — never a reason to include a
 * package on its own. Without that rule a request for Munnar pulls in the
 * Dubai and Singapore packages purely because both are tagged "Family", and
 * the prompt then tells the model they are related when they are not.
 */
function selectCandidatePackages(
  packages: PackageRow[],
  request: TripPlanRequest,
  limit = 6
): CandidateSelection {
  const needle = request.destination.toLowerCase().trim();
  const words = needle.split(/[\s,]+/).filter((w) => w.length > 3);

  const scored = packages.map((pkg) => {
    const haystack =
      `${pkg.title} ${pkg.description ?? ''} ${pkg.best_for ?? ''}`.toLowerCase();

    let score = 0;
    if (needle && haystack.includes(needle)) score += 10;
    for (const word of words) {
      if (haystack.includes(word)) score += 3;
    }

    // Tie-breaker only — applied after a destination match already exists.
    if (
      score > 0 &&
      request.travelType &&
      (pkg.best_for ?? '').toLowerCase().includes(request.travelType.toLowerCase())
    ) {
      score += 1;
    }

    return { pkg, score };
  });

  const matched = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.pkg);

  if (matched.length > 0) {
    return { packages: matched, destinationMatched: true };
  }

  // No package covers this destination. Still show a sample so the model knows
  // what kind of operator this is — but the prompt must not claim they relate.
  return { packages: packages.slice(0, limit), destinationMatched: false };
}

function buildPrompt(
  request: TripPlanRequest,
  selection: CandidateSelection
): string {
  const inventory = selection.packages
    .map(
      (p) =>
        `- ${p.title} (${p.category}, ${p.duration ?? 'flexible'}, from ${p.starting_price ?? 'custom quote'})` +
        `${p.best_for ? ` — best for ${p.best_for}` : ''}`
    )
    .join('\n');

  const inventoryHeading = selection.destinationMatched
    ? `Packages Agriya Travels currently sells that relate to this request — use their pricing as your anchor:`
    : `Agriya Travels has no existing package for this destination. These are unrelated examples, shown only to convey the operator's style and price level. Do NOT treat them as relevant to this trip, and price this itinerary on its own merits:`;

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

${inventoryHeading}
${inventory}

Requirements:
1. Name real places, landmarks, and experiences at the destination. Never write filler like "guided tour of iconic spots" — be concrete about which spots.
2. Write one itinerary entry per day, up to a maximum of 7 entries. If the trip is longer than 7 days, group the later days sensibly.
3. Do NOT mention prices, costs or rupee figures anywhere. Our system calculates the price separately and will attach it.
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
    note: {
      type: Type.STRING,
      description: 'One or two sentences of practical, destination-specific advice.',
    },
  },
  required: ['title', 'highlights', 'itinerary', 'note'],
};

/**
 * Generates an itinerary with Gemini, grounded in the agency's real catalogue,
 * and persists it. Throws if the model is unavailable or returns an
 * unparseable plan — the route turns that into a non-200 so the client can
 * fall back to its local template.
 */
/** Per-person, per-day rates used only when no real package price applies. */
const DAY_RATE_BY_BUDGET: Record<string, number> = {
  'budget-friendly': 2500,
  moderate: 4500,
  premium: 7500,
  luxury: 12000,
};

/** '5 Nights / 6 Days' -> 6 */
function packageDays(duration: string | null): number | null {
  const nights = duration?.match(/(\d+)\s*Night/i);
  if (nights) return parseInt(nights[1], 10) + 1;
  const days = duration?.match(/(\d+)\s*Day/i);
  return days ? parseInt(days[1], 10) : null;
}

/**
 * Prices the trip in TypeScript, never in the model.
 *
 * Anchored on a real package price where one covers the destination, so the
 * quote reflects what Agriya actually charges; otherwise it falls back to a
 * declared day rate. Either way the figure is computed, itemised and auditable
 * rather than produced by a language model.
 */
function priceTrip(
  request: TripPlanRequest,
  candidates: CandidateSelection,
  fees: FeeRule[]
): { breakdown: CostBreakdown; basis: 'package' | 'day_rate' } {
  const travellers = request.travellers;
  const days = request.days;

  const anchor = candidates.destinationMatched
    ? candidates.packages
        .filter((p) => p.price_inr !== null)
        .sort((a, b) => (a.price_inr ?? 0) - (b.price_inr ?? 0))[0]
    : undefined;

  const inputs: CostInput[] = [];
  let basis: 'package' | 'day_rate' = 'day_rate';

  if (anchor?.price_inr) {
    // Scale the package's own price by how much longer or shorter this trip is.
    const anchorDays = packageDays(anchor.duration) ?? days;
    const ratio = anchorDays > 0 ? days / anchorDays : 1;
    const perPerson = Math.round(anchor.price_inr * Math.max(0.5, ratio));

    inputs.push({
      type: 'activity',
      label: `${anchor.title} (scaled to ${days} day${days > 1 ? 's' : ''})`,
      detail: `Based on our published price of ₹${anchor.price_inr.toLocaleString('en-IN')} for ${anchor.duration ?? 'this package'}`,
      unitPrice: perPerson,
      quantity: travellers,
      unit: 'per_person',
      dataSource: 'CLIENT_PROVIDED',
      confidence: 'INDICATIVE',
    });
    basis = 'package';
  } else {
    const rate =
      DAY_RATE_BY_BUDGET[(request.budget ?? 'moderate').toLowerCase()] ??
      DAY_RATE_BY_BUDGET.moderate;

    inputs.push({
      type: 'activity',
      label: `${request.budget ?? 'Moderate'} day rate — ${days} day${days > 1 ? 's' : ''}`,
      detail: 'Estimate: we have no published package covering this destination',
      unitPrice: rate * days,
      quantity: travellers,
      unit: 'per_person',
      dataSource: 'SYNTHETIC',
      confidence: 'ILLUSTRATIVE',
    });
  }

  return { breakdown: calculateCost(inputs, fees), basis };
}

export async function generatePlan(
  request: TripPlanRequest
): Promise<GeneratedPlan> {
  const packages = await allPackages();
  const candidates = selectCandidatePackages(packages, request);
  const prompt = buildPrompt(request, candidates);

  const { text, model, usageMetadata } = await generateWithFallback({
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  const parsed = tripPlanModelOutputSchema.safeParse(JSON.parse(text));
  if (!parsed.success) {
    throw new Error(
      `Gemini response did not match the expected plan shape: ${parsed.error.issues
        .map((i) => i.path.join('.'))
        .join(', ')}`
    );
  }

  // Price it here, not in the model. calculateCost is pure and unit-tested;
  // a rupee figure a language model produced is a number nobody calculated.
  const fees = await getGlobalFees();
  const { breakdown, basis } = priceTrip(
    request,
    candidates,
    fees.map((f) => ({
      kind: f.kind as FeeRule['kind'],
      label: f.label,
      amountInr: f.amount_inr,
      percent: f.percent,
    }))
  );

  const plan: TripPlan = {
    ...parsed.data,
    cost: `₹${breakdown.totalInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
  };

  // Only record packages that genuinely matched — an unmatched sample was
  // context for tone, not grounding, and storing it would overstate the link.
  const groundedPackageIds = candidates.destinationMatched
    ? candidates.packages.map((p) => p.id)
    : [];

  const saved = await insertTripPlan({
    leadId: request.leadId ?? null,
    request,
    plan: { ...plan, costBreakdown: breakdown, costBasis: basis },
    model,
    groundedPackageIds,
    tokenUsage: usageMetadata,
    isFallback: false,
  });

  if (request.leadId) {
    await appendEvent(request.leadId, 'plan_generated', {
      planId: saved.id,
      destination: request.destination,
    });
  }

  return { plan, groundedPackageIds, model, costBreakdown: breakdown, costBasis: basis };
}
