import { z } from 'zod';

/**
 * Server-side validation for every enquiry form.
 *
 * The rules here are deliberately the same ones the components already
 * enforce in the browser (see ContactForm.validateField). Client-side checks
 * are a courtesy — anyone can POST straight to the API and skip them — so
 * this is where they actually hold.
 */

// Mirrors the regexes used in ContactForm / QuickQuoteModal / AITripPlanner.
const NAME_RE = /^[a-zA-Z\s'-]{2,50}$/;
const PHONE_CHARS_RE = /^\+?[0-9\s\-()]+$/;
const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PLACE_RE = /^[a-zA-Z0-9\s,.'()/-]+$/;

const text = z.string().trim();

const nameField = text.regex(
  NAME_RE,
  'Name must be 2-50 characters: letters, spaces, hyphens or apostrophes only'
);

const phoneField = text
  .regex(PHONE_CHARS_RE, 'Phone may contain only digits, spaces, hyphens, parentheses or +')
  .refine((v) => {
    const digits = v.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
  }, 'Phone must contain between 10 and 15 digits');

const emailField = text.regex(EMAIL_RE, 'Invalid email address');

const placeField = text
  .max(120, 'Must be 120 characters or fewer')
  .regex(PLACE_RE, 'Contains invalid characters');

const travelDateField = text
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date')
  .refine((v) => {
    const chosen = new Date(v);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return chosen >= today;
  }, 'Travel date cannot be in the past');

/**
 * The forms submit empty strings for untouched optional fields. Treat those
 * as "not provided" rather than running them through the format checks.
 */
function optional<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess(
    (v) => (v === '' || v === null ? undefined : v),
    schema.optional()
  );
}

export const leadInputSchema = z
  .object({
    source: z.enum(['contact_form', 'quick_quote', 'trip_planner', 'inspiration']),
    focus: z.enum(['general', 'rentals', 'corporate']).optional(),
    pagePath: optional(text.max(200)),

    name: optional(nameField),
    phone: optional(phoneField),
    email: optional(emailField),

    destination: optional(placeField),
    startingCity: optional(placeField),
    travelDate: optional(travelDateField),
    travellers: optional(z.coerce.number().int().min(1).max(500)),
    durationDays: optional(z.coerce.number().int().min(1).max(30)),
    budget: optional(text.max(50)),
    travelType: optional(text.max(50)),
    hotelPreference: optional(text.max(50)),

    vehicleType: optional(text.max(100)),
    tripType: optional(text.max(100)),
    pickupLocation: optional(placeField),
    pickupTime: optional(text.max(60)),

    message: optional(text.max(1000, 'Message must be 1000 characters or fewer')),
  })
  .superRefine((data, ctx) => {
    const require = (field: string, value: unknown, message: string) => {
      if (!value) ctx.addIssue({ code: 'custom', path: [field], message });
    };

    // Only the two contact-style forms collect a name. The trip planner and
    // inspiration hub submit anonymously — they are demand signals, not
    // callable leads, which is why name/phone stay nullable in the schema.
    if (data.source === 'contact_form' || data.source === 'quick_quote') {
      require('name', data.name, 'Name is required');
    }

    if (data.source === 'contact_form') {
      require('phone', data.phone, 'Mobile number is required');

      if (data.focus === 'rentals') {
        require('pickupLocation', data.pickupLocation, 'Pickup location is required');
        require('destination', data.destination, 'Drop location is required');
        require('travelDate', data.travelDate, 'Travel date is required');
      }
    }

    if (data.source === 'quick_quote') {
      require('destination', data.destination, 'Destination is required');
    }

    if (data.source === 'trip_planner') {
      require('destination', data.destination, 'Destination is required');
      require('startingCity', data.startingCity, 'Starting city is required');
    }
  });

export type LeadInput = z.infer<typeof leadInputSchema>;
