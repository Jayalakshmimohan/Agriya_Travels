import { totalTravellers, type TravelRequirement } from '../schemas/travelRequirement';

/**
 * Notifies the agency's own team on WhatsApp when a lead arrives.
 *
 * This is deliberately only the team-facing half of the WhatsApp Business
 * Platform. Messaging *travellers* proactively requires documented opt-in
 * under both Meta's policy and the DPDP Act, and this site collects phone
 * numbers with no privacy notice and no consent record yet, so that path is
 * not built rather than built and left to be misused.
 *
 * Click-to-chat stays exactly as it was. This runs *beside* the deep link,
 * never instead of it: the traveller still gets a pre-filled WhatsApp message
 * to send, and the team additionally gets a push. A failure here must never
 * cost us the lead, so every error is swallowed and reported, never thrown.
 *
 * Disabled until configured. With no credentials it is inert and says so,
 * which keeps this deployable before Meta onboarding is finished.
 */

export type NotifyOutcome =
  | { sent: true; recipients: number }
  | { sent: false; reason: 'not_configured' | 'no_recipients' | 'failed'; detail?: string };

interface Config {
  token: string;
  phoneNumberId: string;
  templateName: string;
  templateLanguage: string;
  recipients: string[];
  apiVersion: string;
}

/**
 * Read at call time, not at module load. The Vercel function imports this
 * graph before dotenv has populated process.env, and reading early would
 * cache an empty config for the life of the container.
 */
function readConfig(): Config | null {
  const token = process.env.WHATSAPP_API_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME?.trim();

  if (!token || !phoneNumberId || !templateName) return null;

  return {
    token,
    phoneNumberId,
    templateName,
    templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE?.trim() || 'en',
    recipients: parseRecipients(process.env.WHATSAPP_TEAM_NUMBERS),
    // Pinned by configuration rather than hardcoded, because Meta retires
    // Graph API versions on a schedule and a stale literal fails at runtime.
    apiVersion: process.env.WHATSAPP_API_VERSION?.trim() || 'v21.0',
  };
}

/** Comma-separated E.164 digits, e.g. "919380054540,919941938222". */
export function parseRecipients(raw: string | undefined): string[] {
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(',')
        .map((n) => n.replace(/[^\d]/g, ''))
        // 10 digits is a bare Indian mobile with the country code missing —
        // Meta would accept it and deliver nowhere, so reject it here.
        .filter((n) => n.length >= 11 && n.length <= 15)
    )
  );
}

/**
 * Meta rejects a template parameter containing a newline, a tab, or four or
 * more consecutive spaces, and truncates past 1024 characters.
 *
 * This is why the team notification cannot simply carry curateSummary() —
 * that summary is multi-line by design. Each field is flattened to one line
 * here and the full enquiry stays in /admin, which the template links to.
 */
export function templateParam(value: unknown, fallback = 'Not specified'): string {
  if (value === null || value === undefined || value === '') return fallback;
  const flat = String(value).replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  if (flat === '') return fallback;
  return flat.length > 1024 ? `${flat.slice(0, 1021)}...` : flat;
}

/**
 * The template's body variables, in order.
 *
 * Register the matching template with Meta as, for example:
 *   "New enquiry {{1}} — {{2}} to {{3}} on {{4}}, {{5}} traveller(s),
 *    budget {{6}}. Contact {{7}}. Full detail: {{8}}"
 */
export function buildParams(args: {
  requirement: TravelRequirement;
  leadId: string;
  adminUrl: string;
}): string[] {
  const { requirement: req, leadId, adminUrl } = args;
  const pax = totalTravellers(req);

  const budget =
    req.budget.amount === null
      ? 'Not specified'
      : `₹${req.budget.amount.toLocaleString('en-IN')} ${
          req.budget.basis === 'per_person' ? 'per person'
          : req.budget.basis === 'total' ? 'total'
          : '(basis unclear)'
        }`;

  const contact = req.contact.phone
    ? `${templateParam(req.contact.name, 'Name not given')} on ${req.contact.phone}`
    : 'NO PHONE GIVEN — cannot call back';

  return [
    templateParam(`#${leadId}`),
    templateParam(req.origin, 'Origin not given'),
    templateParam(req.destination, 'Open to suggestions'),
    templateParam(req.travelDate, 'Flexible'),
    templateParam(pax),
    templateParam(budget),
    templateParam(contact),
    templateParam(adminUrl),
  ];
}

async function sendOne(cfg: Config, to: string, params: string[]): Promise<void> {
  const res = await fetch(
    `https://graph.facebook.com/${cfg.apiVersion}/${cfg.phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        'Content-Type': 'application/json',
      },
      // A hanging Graph API must not eat the function's 60s budget; the lead
      // is already saved by this point and the deep link works regardless.
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: cfg.templateName,
          language: { code: cfg.templateLanguage },
          components: [
            { type: 'body', parameters: params.map((text) => ({ type: 'text', text })) },
          ],
        },
      }),
    }
  );

  if (!res.ok) {
    // Meta returns the useful part in a JSON error envelope; keep it short so
    // a token never ends up in a log line.
    const body = await res.text().catch(() => '');
    throw new Error(`Graph API ${res.status}: ${body.slice(0, 300)}`);
  }
}

/**
 * Fire-and-forget by contract: resolves with an outcome, never rejects.
 */
export async function notifyTeamOfLead(args: {
  requirement: TravelRequirement;
  leadId: string;
}): Promise<NotifyOutcome> {
  const cfg = readConfig();
  if (!cfg) return { sent: false, reason: 'not_configured' };
  if (cfg.recipients.length === 0) return { sent: false, reason: 'no_recipients' };

  const adminUrl = `${(process.env.APP_URL || '').replace(/\/+$/, '')}/admin`;
  const params = buildParams({ requirement: args.requirement, leadId: args.leadId, adminUrl });

  const results = await Promise.allSettled(
    cfg.recipients.map((to) => sendOne(cfg, to, params))
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected');

  if (failed.length > 0) {
    console.error(
      `[whatsapp] ${failed.length}/${cfg.recipients.length} team notifications failed:`,
      failed.map((f) => (f as PromiseRejectedResult).reason?.message ?? 'unknown').join('; ')
    );
  }

  return sent > 0
    ? { sent: true, recipients: sent }
    : { sent: false, reason: 'failed', detail: `${failed.length} recipient(s) failed` };
}
