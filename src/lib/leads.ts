export type LeadSource =
  | 'contact_form'
  | 'quick_quote'
  | 'trip_planner'
  | 'inspiration';

export interface LeadPayload {
  source: LeadSource;
  focus?: 'general' | 'rentals' | 'corporate';
  name?: string;
  phone?: string;
  email?: string;
  destination?: string;
  startingCity?: string;
  travelDate?: string;
  travellers?: string | number;
  durationDays?: string | number;
  budget?: string;
  travelType?: string;
  hotelPreference?: string;
  vehicleType?: string;
  tripType?: string;
  pickupLocation?: string;
  pickupTime?: string;
  message?: string;
}

/**
 * Records an enquiry, fire-and-forget.
 *
 * Deliberately NOT awaited. The forms hand off to WhatsApp or the visitor's
 * mail client in the same user-event tick — awaiting a request first gets
 * that navigation blocked by the browser. `keepalive` lets the POST outlive
 * the page, and every failure is swallowed: recording a lead must never be
 * able to break the enquiry the customer is actually trying to send.
 */
export function recordLead(payload: LeadPayload): void {
  void postLead(payload).catch(() => {
    /* offline or blocked — the WhatsApp/email handoff still happens */
  });
}

/**
 * Same call, but resolves with the new lead's id (or null on any failure).
 *
 * Only for forms that do NOT navigate away on submit — the trip planner uses
 * it so the itinerary it then generates can be linked back to the enquiry.
 */
export async function postLead(payload: LeadPayload): Promise<string | null> {
  try {
    const body = JSON.stringify({
      ...payload,
      pagePath:
        typeof window !== 'undefined' ? window.location.pathname : undefined,
    });

    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json?.id ?? null;
  } catch {
    return null;
  }
}
