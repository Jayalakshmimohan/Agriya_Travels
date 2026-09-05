import { z } from 'zod';

/** What the AITripPlanner form sends. */
export const tripPlanRequestSchema = z.object({
  destination: z.string().trim().min(1).max(100),
  startingCity: z.string().trim().min(1).max(100),
  travelDate: z.string().trim().max(60).optional(),
  days: z.coerce.number().int().min(1).max(30),
  travellers: z.coerce.number().int().min(1).max(500),
  travelType: z.string().trim().max(50).optional(),
  budget: z.string().trim().max(50).optional(),
  hotelPreference: z.string().trim().max(50).optional(),
  vehicleRequirement: z.string().trim().max(50).optional(),
  specialNeeds: z.string().trim().max(1000).optional(),
  leadId: z.union([z.string(), z.number()]).optional(),
});

export type TripPlanRequest = z.infer<typeof tripPlanRequestSchema>;

/**
 * The exact shape AITripPlanner already renders and the PDF export already
 * reads. Keeping it identical is why the component needs no markup changes.
 */
export const tripPlanSchema = z.object({
  title: z.string(),
  highlights: z.array(z.string()),
  itinerary: z.array(
    z.object({
      day: z.number(),
      title: z.string(),
      desc: z.string(),
    })
  ),
  cost: z.string(),
  note: z.string(),
});

export type TripPlan = z.infer<typeof tripPlanSchema>;
