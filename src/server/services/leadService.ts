import { withTransaction } from '../db/client';
import { insertLead, type LeadRow } from '../db/repositories/leadRepo';
import { appendEvent } from '../db/repositories/eventRepo';
import type { LeadInput } from '../schemas/lead';

/**
 * Persists an enquiry and opens its event timeline.
 *
 * The lead and its 'created' event are written in one transaction so a lead
 * can never exist without a history — the dashboard and follow-up queries
 * both assume every lead has at least one event.
 */
export async function createLead(input: LeadInput): Promise<LeadRow> {
  const lead = await withTransaction(async (client) => {
    const row = await insertLead(input, client);
    await appendEvent(row.id, 'created', { source: input.source }, client);
    return row;
  });

  // Phase 3 hooks in here: score the lead asynchronously so that capture
  // never blocks on a Gemini round-trip.
  // void scoreLeadInBackground(lead);

  return lead;
}
