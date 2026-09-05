import { z } from 'zod';

/**
 * The structured shape we extract from a free-text travel request.
 *
 * Every field is nullable on purpose. The assistant's job when something is
 * missing is to ask, not to guess — a guessed traveller count or budget basis
 * produces a wrong quote, which is worse than a question.
 */
export const travelRequirementSchema = z.object({
  origin: z.string().max(120).nullable(),
  destination: z.string().max(120).nullable(),
  travelDate: z.string().max(40).nullable(),
  returnDate: z.string().max(40).nullable(),
  isRoundTrip: z.boolean().nullable(),

  transport: z.object({
    mode: z.enum(['train', 'flight', 'bus', 'cab', 'private_vehicle']).nullable(),
    preference: z.string().max(80).nullable(),
    classPreference: z.string().max(40).nullable(),
  }),

  budget: z.object({
    amount: z.number().nullable(),
    currency: z.string().max(8).default('INR'),
    // "My budget is Rs.2,000" is genuinely ambiguous for a group. Never assume.
    basis: z.enum(['total', 'per_person', 'unknown']).default('unknown'),
  }),

  travellers: z.object({
    adults: z.number().int().min(0).max(500).nullable(),
    children: z.number().int().min(0).max(500).nullable(),
    seniors: z.number().int().min(0).max(500).nullable(),
  }),

  needs: z.array(
    z.enum(['food', 'darshan', 'accommodation', 'transport', 'guide', 'transfer'])
  ).default([]),
  optionalNeeds: z.array(z.string().max(40)).default([]),

  dietaryPreference: z.enum(['veg', 'non_veg', 'jain', 'vegan', 'satvik']).nullable(),
  accommodationPreference: z.string().max(80).nullable(),
  specialNeeds: z.string().max(600).nullable(),
  travellerExperience: z.enum(['first_time', 'experienced']).nullable(),
});

export type TravelRequirement = z.infer<typeof travelRequirementSchema>;

/** Gemini responseSchema mirroring the above. */
export const REQUIREMENT_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    origin: { type: 'STRING', description: 'City the traveller departs from, or empty if not stated.' },
    destination: { type: 'STRING', description: 'City or place they want to reach, or empty.' },
    travelDate: { type: 'STRING', description: 'Outbound date as YYYY-MM-DD if determinable, else empty.' },
    returnDate: { type: 'STRING', description: 'Return date as YYYY-MM-DD, or empty.' },
    isRoundTrip: { type: 'STRING', description: '"true", "false", or empty if not stated.' },
    transportMode: { type: 'STRING', description: 'One of train, flight, bus, cab, private_vehicle, or empty.' },
    transportPreference: { type: 'STRING', description: 'Named service if mentioned, e.g. "Vande Bharat". Empty otherwise.' },
    transportClass: { type: 'STRING', description: 'Class preference if stated, e.g. "AC chair car". Empty otherwise.' },
    budgetAmount: { type: 'STRING', description: 'Numeric budget with no symbols or commas, e.g. "2000". Empty if not stated.' },
    budgetCurrency: { type: 'STRING', description: 'Currency code, default INR.' },
    budgetBasis: { type: 'STRING', description: 'total, per_person, or unknown. Use unknown unless the traveller was explicit.' },
    adults: { type: 'STRING', description: 'Number of adults as a plain number, or empty if not stated. Do not assume 1.' },
    children: { type: 'STRING', description: 'Number of children, or empty.' },
    seniors: { type: 'STRING', description: 'Number of senior citizens, or empty.' },
    needs: {
      type: 'ARRAY',
      description: 'Things explicitly required: food, darshan, accommodation, transport, guide, transfer.',
      items: { type: 'STRING' },
    },
    optionalNeeds: {
      type: 'ARRAY',
      description: 'Things mentioned as optional or "if possible", e.g. accommodation.',
      items: { type: 'STRING' },
    },
    dietaryPreference: { type: 'STRING', description: 'veg, non_veg, jain, vegan, satvik, or empty.' },
    accommodationPreference: { type: 'STRING', description: 'Any hotel preference stated, or empty.' },
    specialNeeds: { type: 'STRING', description: 'Any other requirement, or empty.' },
    travellerExperience: { type: 'STRING', description: 'first_time if they say they are new to travelling, else empty.' },
  },
  required: ['origin', 'destination', 'travelDate', 'needs'],
};

/** A question the assistant must ask before it can quote responsibly. */
export interface ClarifyingQuestion {
  field: string;
  question: string;
  /** Blocking questions stop the quote; non-blocking merely improve it. */
  blocking: boolean;
}

export function totalTravellers(req: TravelRequirement): number | null {
  const { adults, children, seniors } = req.travellers;
  if (adults === null && children === null && seniors === null) return null;
  return (adults ?? 0) + (children ?? 0) + (seniors ?? 0);
}

/**
 * Decides what still has to be asked.
 *
 * Only two things genuinely block a quote: who is travelling, and what the
 * budget figure refers to. Everything else can be defaulted or offered as
 * alternatives without misleading anyone.
 */
export function findMissingRequirements(req: TravelRequirement): ClarifyingQuestion[] {
  const questions: ClarifyingQuestion[] = [];

  if (!req.destination) {
    questions.push({
      field: 'destination',
      question: 'Where would you like to travel to?',
      blocking: true,
    });
  }

  if (!req.origin) {
    questions.push({
      field: 'origin',
      question: 'Which city will you be starting from?',
      blocking: true,
    });
  }

  if (!req.travelDate) {
    questions.push({
      field: 'travelDate',
      question: 'What date are you planning to travel?',
      blocking: true,
    });
  }

  const pax = totalTravellers(req);
  if (pax === null || pax === 0) {
    questions.push({
      field: 'travellers',
      question: 'How many people are travelling?',
      blocking: true,
    });
  }

  // A budget without a basis cannot be checked against a total for a group.
  if (req.budget.amount !== null && req.budget.basis === 'unknown' && (pax === null || pax > 1)) {
    questions.push({
      field: 'budget.basis',
      question: 'Is that budget the total for everyone, or per person?',
      blocking: true,
    });
  }

  if (req.needs.includes('food') && !req.dietaryPreference) {
    questions.push({
      field: 'dietaryPreference',
      question: 'Any dietary preference for meals — vegetarian, non-vegetarian, Jain or satvik?',
      blocking: false,
    });
  }

  return questions;
}
