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
  try {
    const body = JSON.stringify({
      ...payload,
      pagePath:
        typeof window !== 'undefined' ? window.location.pathname : undefined,
    });

    void fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {
      /* offline or blocked — the WhatsApp/email handoff still happens */
    });
  } catch {
    /* never let analytics break a submission */
  }
}
