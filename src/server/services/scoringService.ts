import { Type } from '@google/genai';
import { getGemini, geminiModel, hasGeminiKey } from '../ai/gemini';
import { updateLeadScore, type LeadRow } from '../db/repositories/leadRepo';
import { appendEvent } from '../db/repositories/eventRepo';

export interface ScoreComponent {
  factor: string;
  points: number;
  max: number;
  reason: string;
}

export interface ScoreBreakdown {
  base: number;
  components: ScoreComponent[];
  aiAdjustment?: number;
  aiSignals?: Record<string, unknown>;
  total: number;
}

/**
 * Deterministic score, 0-100.
 *
 * Kept rule-based and stored component-by-component so any score can be
 * explained to the agency. "Why is this lead a 78?" must have an answer that
 * isn't "the model said so" — otherwise nobody trusts the call list.
 */
export function scoreLeadRules(lead: LeadRow): ScoreBreakdown {
  const components: ScoreComponent[] = [];

  // 1. Can we actually reach them? Worthless lead otherwise.
  let contact = 0;
  let contactReason = 'No contact details — anonymous demand signal only';
  if (lead.phone && lead.email) {
    contact = 20;
    contactReason = 'Phone and email provided';
  } else if (lead.phone) {
    contact = 15;
    contactReason = 'Phone provided';
  } else if (lead.email) {
    contact = 8;
    contactReason = 'Email only';
  }
  components.push({ factor: 'Contactability', points: contact, max: 20, reason: contactReason });

  // 2. Budget tier.
  const budget = (lead.budget ?? '').toLowerCase();
  let budgetPoints = 5;
  let budgetReason = 'Budget not specified';
  if (budget.includes('luxury')) {
    budgetPoints = 20;
    budgetReason = 'Luxury budget';
  } else if (budget.includes('premium')) {
    budgetPoints = 15;
    budgetReason = 'Premium budget';
  } else if (budget.includes('moderate') || budget.includes('standard')) {
    budgetPoints = 10;
    budgetReason = 'Moderate budget';
  } else if (budget.includes('budget')) {
    budgetPoints = 5;
    budgetReason = 'Budget-conscious';
  }
  components.push({ factor: 'Budget tier', points: budgetPoints, max: 20, reason: budgetReason });

  // 3. Party size — bigger groups are worth more per booking.
  const pax = lead.travellers ?? 0;
  let paxPoints = 5;
  let paxReason = 'Party size unknown';
  if (pax >= 11) {
    paxPoints = 20;
    paxReason = `Large group (${pax} travellers)`;
  } else if (pax >= 6) {
    paxPoints = 15;
    paxReason = `Group of ${pax}`;
  } else if (pax >= 3) {
    paxPoints = 10;
    paxReason = `Family-sized party (${pax})`;
  } else if (pax >= 1) {
    paxPoints = 5;
    paxReason = `${pax} traveller${pax > 1 ? 's' : ''}`;
  }
  components.push({ factor: 'Party size', points: paxPoints, max: 20, reason: paxReason });

  // 4. How soon are they travelling? Imminent trips convert fastest.
  let urgency = 5;
  let urgencyReason = 'No travel date given';
  if (lead.travel_date) {
    const days = Math.round(
      (new Date(lead.travel_date).getTime() - Date.now()) / 86_400_000
    );
    if (days < 0) {
      urgency = 2;
      urgencyReason = 'Travel date has passed';
    } else if (days <= 30) {
      urgency = 20;
      urgencyReason = `Travelling in ${days} days — call today`;
    } else if (days <= 90) {
      urgency = 15;
      urgencyReason = `Travelling in about ${Math.round(days / 7)} weeks`;
    } else if (days <= 180) {
      urgency = 8;
      urgencyReason = `Travelling in about ${Math.round(days / 30)} months`;
    } else {
      urgency = 4;
      urgencyReason = 'Travelling more than 6 months out';
    }
  }
  components.push({ factor: 'Travel urgency', points: urgency, max: 20, reason: urgencyReason });

  // 5. Which form they used says a lot about intent.
  const intentBySource: Record<string, [number, string]> = {
    contact_form: [15, 'Used the full enquiry form'],
    trip_planner: [12, 'Built a custom itinerary'],
    quick_quote: [8, 'Quick quote request'],
    inspiration: [5, 'Browsing for inspiration'],
  };
  const [intentPoints, intentReason] = intentBySource[lead.source] ?? [5, 'Unknown source'];
  components.push({ factor: 'Intent signal', points: intentPoints, max: 15, reason: intentReason });

  // 6. Did they bother to write something?
  const wroteMessage = Boolean(lead.message && lead.message.trim().length > 20);
  components.push({
    factor: 'Engagement',
    points: wroteMessage ? 5 : 0,
    max: 5,
    reason: wroteMessage ? 'Wrote a detailed message' : 'No message provided',
  });

  const base = components.reduce((sum, c) => sum + c.points, 0);
  return { base, components, total: base };
}

const AI_SIGNAL_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    urgency: { type: Type.STRING, description: 'high, medium or low' },
    decisiveness: { type: Type.STRING, description: 'high, medium or low' },
    priceSensitivity: { type: Type.STRING, description: 'high, medium or low' },
    redFlags: {
      type: Type.ARRAY,
      description: 'Concerns such as vagueness, unrealistic budget, or a possible spam entry. Empty if none.',
      items: { type: Type.STRING },
    },
    adjustment: {
      type: Type.INTEGER,
      description: 'Score adjustment from -15 to +15 based on how serious this enquiry reads.',
    },
    summary: {
      type: Type.STRING,
      description: 'One sentence a salesperson can read before picking up the phone.',
    },
  },
  required: ['urgency', 'decisiveness', 'priceSensitivity', 'redFlags', 'adjustment', 'summary'],
};

/**
 * Reads the free-text message for intent the rules cannot see.
 * Returns null whenever there is nothing to read or no key configured —
 * scoring must work without Gemini.
 */
async function scoreLeadWithAI(lead: LeadRow) {
  if (!hasGeminiKey()) return null;
  const message = lead.message?.trim();
  if (!message || message.length < 20) return null;

  const response = await getGemini().models.generateContent({
    model: geminiModel(),
    contents: `You are triaging enquiries for Agriya Travels, a Chennai travel agency.

Enquiry:
- Destination: ${lead.destination ?? 'not specified'}
- Travellers: ${lead.travellers ?? 'not specified'}
- Budget: ${lead.budget ?? 'not specified'}
- Travel date: ${lead.travel_date ? new Date(lead.travel_date).toDateString() : 'not specified'}
- Their message: "${message}"

Judge how serious and ready-to-book this person is. Be sceptical: vague
enquiries and unrealistic budgets should score negatively.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: AI_SIGNAL_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) return null;

  const signals = JSON.parse(text) as {
    adjustment: number;
    summary: string;
    [k: string]: unknown;
  };

  // Never let the model move the score more than the rules intended.
  const adjustment = Math.max(-15, Math.min(15, Math.round(signals.adjustment ?? 0)));
  return { signals, adjustment, summary: signals.summary };
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/**
 * Scores a lead and writes the result. Safe to call in the background —
 * every failure is swallowed, because a scoring problem must never affect
 * whether the enquiry itself was captured.
 */
export async function scoreLead(lead: LeadRow): Promise<void> {
  try {
    const breakdown = scoreLeadRules(lead);
    let summary: string | null = null;

    try {
      const ai = await scoreLeadWithAI(lead);
      if (ai) {
        breakdown.aiAdjustment = ai.adjustment;
        breakdown.aiSignals = ai.signals;
        breakdown.total = clamp(breakdown.base + ai.adjustment);
        summary = ai.summary;
      }
    } catch (err) {
      // Rules-only score still stands.
      console.warn('AI lead scoring unavailable, using rules only:', (err as Error).message);
    }

    breakdown.total = clamp(breakdown.total);

    await updateLeadScore(lead.id, breakdown.total, breakdown, summary);
    await appendEvent(lead.id, 'scored', {
      score: breakdown.total,
      base: breakdown.base,
      aiAdjustment: breakdown.aiAdjustment ?? null,
    });
  } catch (err) {
    console.error('Lead scoring failed for lead', lead.id, err);
  }
}
