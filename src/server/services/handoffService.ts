import { WHATSAPP_NUMBER } from '../../data';
import { createLead } from './leadService';
import { linkLead } from '../db/repositories/conversationRepo';
import { totalTravellers, type TravelRequirement } from '../schemas/travelRequirement';
import type { LeadInput } from '../schemas/lead';

/**
 * Hands a conversation to the agency.
 *
 * The assistant was already offering to "pass your requirements on" with
 * nothing behind it. This is the something: a scored lead in the dashboard,
 * plus a pre-filled WhatsApp message the traveller sends with one tap.
 *
 * On why the traveller sends it rather than the server: a server-initiated
 * WhatsApp message needs the WhatsApp Business API — Meta verification, an
 * approved template and a provider. Click-to-chat needs none of that, works
 * today, and is the pattern every other form on this site already uses. It
 * also means the agency gets a real conversation thread with the customer
 * rather than a one-way notification.
 */

export interface HandoffResult {
  leadId: string;
  /** Curated summary — also stored as the lead's message. */
  summary: string;
  /** Deep link that opens WhatsApp with the summary pre-filled. */
  whatsappUrl: string;
  /** True when we could not reach them back, so the lead is a dead end. */
  contactMissing: boolean;
}

const shown = (v: unknown, fallback = 'Not specified') =>
  v === null || v === undefined || v === '' ? fallback : String(v);

/**
 * Everything gathered, in the order an agent would want to read it.
 *
 * Written for a person glancing at a phone, not for a database: the
 * destination and the callback number come first, and anything unknown says so
 * rather than being quietly omitted.
 */
export function curateSummary(req: TravelRequirement): string {
  const pax = totalTravellers(req);
  const prefs = req.preferences;
  const lines: string[] = [];

  lines.push('*New enquiry from the website assistant*');
  lines.push('');

  lines.push(`*Traveller:* ${shown(req.contact.name, 'Name not given')}`);
  lines.push(`*Mobile:* ${shown(req.contact.phone, 'NOT GIVEN — cannot call back')}`);
  if (req.contact.email) lines.push(`*Email:* ${req.contact.email}`);
  lines.push('');

  lines.push('*Trip*');
  lines.push(`• Destination: ${shown(req.destination, 'Open to suggestions')}`);
  if (req.origin) lines.push(`• Departing from: ${req.origin}`);
  lines.push(`• Travel date: ${shown(req.travelDate, 'Flexible')}`);
  if (req.returnDate) lines.push(`• Return: ${req.returnDate}`);
  lines.push(`• Travellers: ${pax === null ? 'Not specified' : pax}`);

  if (req.budget.amount !== null) {
    const basis =
      req.budget.basis === 'per_person' ? 'per person'
      : req.budget.basis === 'total' ? 'total'
      : 'basis unclear';
    lines.push(`• Budget: ₹${req.budget.amount.toLocaleString('en-IN')} (${basis})`);
  }

  if (req.transport.mode || req.transport.preference) {
    lines.push(
      `• Transport: ${[req.transport.preference, req.transport.mode].filter(Boolean).join(' / ')}`
    );
  }

  if (req.needs.length > 0) lines.push(`• Needs: ${req.needs.join(', ')}`);
  if (req.optionalNeeds.length > 0) lines.push(`• Nice to have: ${req.optionalNeeds.join(', ')}`);
  if (req.dietaryPreference) lines.push(`• Diet: ${req.dietaryPreference.replace('_', '-')}`);
  if (req.accommodationPreference) lines.push(`• Stay: ${req.accommodationPreference}`);

  // The qualitative half. This is often the most useful part for a salesperson
  // and it is exactly what a plain form would have thrown away.
  const described = [
    prefs.vibe.length ? `feel: ${prefs.vibe.join(', ')}` : null,
    prefs.landscape.length ? `scenery: ${prefs.landscape.join(', ')}` : null,
    prefs.settlement ? `place: ${prefs.settlement.replace('_', ' ')}` : null,
    prefs.climate ? `climate: ${prefs.climate}` : null,
    prefs.pace ? `pace: ${prefs.pace}` : null,
    prefs.interests.length ? `wants to: ${prefs.interests.join(', ')}` : null,
  ].filter(Boolean);

  if (described.length > 0) {
    lines.push('');
    lines.push('*How they described it*');
    for (const d of described) lines.push(`• ${d}`);
  }

  if (req.travellerExperience === 'first_time') {
    lines.push('');
    lines.push('_First-time traveller — may need more hand-holding._');
  }

  if (req.specialNeeds) {
    lines.push('');
    lines.push(`*Notes:* ${req.specialNeeds}`);
  }

  return lines.join('\n');
}

/** Maps the requirement onto the lead columns the dashboard already reads. */
function toLeadInput(req: TravelRequirement, summary: string): LeadInput {
  const pax = totalTravellers(req);
  const prefs = req.preferences;

  // Destination is nullable in a discovery conversation, so record what they
  // described instead of leaving the row blank and unsearchable.
  const destination =
    req.destination ??
    ([...prefs.landscape, ...prefs.vibe].slice(0, 3).join(', ') || null);

  return {
    source: 'assistant',
    focus: 'general',
    name: req.contact.name ?? undefined,
    phone: req.contact.phone ?? undefined,
    email: req.contact.email ?? undefined,
    destination: destination ?? undefined,
    startingCity: req.origin ?? undefined,
    travelDate: req.travelDate ?? undefined,
    travellers: pax ?? undefined,
    budget: req.budget.amount !== null ? String(req.budget.amount) : undefined,
    travelType: prefs.vibe[0] ?? undefined,
    message: summary,
    pagePath: '/assistant',
  };
}

export async function handOffToTeam(args: {
  requirement: TravelRequirement;
  conversationId: string;
}): Promise<HandoffResult> {
  const summary = curateSummary(args.requirement);

  const lead = await createLead(toLeadInput(args.requirement, summary));
  await linkLead(args.conversationId, lead.id);

  // Reference lets the agent find the conversation from the message alone.
  const text = `${summary}\n\n_Ref: enquiry #${lead.id}_`;

  return {
    leadId: String(lead.id),
    summary,
    whatsappUrl: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`,
    contactMissing: !args.requirement.contact.phone,
  };
}
