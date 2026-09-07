import { Router } from 'express';
import { z } from 'zod';
import { findLeadById } from '../db/repositories/leadRepo';
import { recommendForLead } from '../services/recommendationService';

const router = Router();

const querySchema = z.object({
  leadId: z.union([z.string(), z.number()]).optional(),
  destination: z.string().max(120).optional(),
  budget: z.string().max(50).optional(),
  travellers: z.coerce.number().int().min(1).max(500).optional(),
  travelType: z.string().max(50).optional(),
  durationDays: z.coerce.number().int().min(1).max(30).optional(),
  limit: z.coerce.number().int().min(1).max(10).optional(),
});

/**
 * GET /api/recommendations
 *
 * Public: it only ever returns packages the site already displays, so there
 * is nothing here a visitor cannot see anyway. Passing leadId resolves the
 * criteria from a stored enquiry; otherwise pass them directly.
 */
router.get('/', async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: 'Invalid parameters' });
  }

  const { leadId, limit, ...criteria } = parsed.data;

  try {
    let target = {
      destination: criteria.destination ?? null,
      budget: criteria.budget ?? null,
      travellers: criteria.travellers ?? null,
      travel_type: criteria.travelType ?? null,
      duration_days: criteria.durationDays ?? null,
    };

    if (leadId) {
      const lead = await findLeadById(leadId);
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found' });
      }
      target = {
        destination: lead.destination,
        budget: lead.budget,
        travellers: lead.travellers,
        travel_type: lead.travel_type,
        duration_days: lead.duration_days,
      };
    }

    if (!target.destination) {
      return res.status(400).json({
        success: false,
        message: 'A destination (or a leadId that has one) is required.',
      });
    }

    const recommendations = await recommendForLead(target, limit ?? 3);
    return res.json({ success: true, data: recommendations });
  } catch (err) {
    console.error('Recommendation lookup failed:', err);
    return res.status(500).json({ success: false, message: 'Could not build recommendations.' });
  }
});

export default router;
