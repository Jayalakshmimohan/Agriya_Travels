import { Router } from 'express';
import { z } from 'zod';
import { adminAuth } from '../middleware/adminAuth';
import {
  listLeads,
  findLeadById,
  updateLeadStatus,
  type LeadStatus,
} from '../db/repositories/leadRepo';
import { listEventsForLead, appendEvent } from '../db/repositories/eventRepo';
import { listPlansForLead } from '../db/repositories/planRepo';
import { collectInsights, narrateInsights } from '../services/insightsService';
import { recommendForLead, coBookedDestinations } from '../services/recommendationService';

const router = Router();

// Everything below requires the bearer token.
router.use(adminAuth);

const listQuerySchema = z.object({
  status: z.enum(['new', 'contacted', 'quoted', 'won', 'lost']).optional(),
  source: z.string().max(40).optional(),
  destination: z.string().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

/** GET /api/admin/leads — the prioritised call list. */
router.get('/leads', async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: 'Invalid filters' });
  }

  try {
    const leads = await listLeads(parsed.data);
    return res.json({ success: true, data: leads });
  } catch (err) {
    console.error('Failed to list leads:', err);
    return res.status(500).json({ success: false, message: 'Could not load leads.' });
  }
});

/** GET /api/admin/leads/:id — detail, timeline, itineraries, recommendations. */
router.get('/leads/:id', async (req, res) => {
  try {
    const lead = await findLeadById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const [events, plans, recommendations, alsoBooked] = await Promise.all([
      listEventsForLead(lead.id),
      listPlansForLead(lead.id),
      recommendForLead(lead),
      lead.destination ? coBookedDestinations(lead.destination) : Promise.resolve([]),
    ]);

    return res.json({
      success: true,
      data: { lead, events, plans, recommendations, alsoBooked },
    });
  } catch (err) {
    console.error('Failed to load lead:', err);
    return res.status(500).json({ success: false, message: 'Could not load the lead.' });
  }
});

const patchSchema = z.object({
  status: z.enum(['new', 'contacted', 'quoted', 'won', 'lost']),
  note: z.string().max(500).optional(),
});

/** PATCH /api/admin/leads/:id — move a lead through the pipeline. */
router.patch('/leads/:id', async (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status',
      errors: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }

  try {
    const before = await findLeadById(req.params.id);
    if (!before) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const updated = await updateLeadStatus(req.params.id, parsed.data.status as LeadStatus);
    await appendEvent(req.params.id, 'status_changed', {
      from: before.status,
      to: parsed.data.status,
      note: parsed.data.note ?? null,
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Failed to update lead:', err);
    return res.status(500).json({ success: false, message: 'Could not update the lead.' });
  }
});

/** GET /api/admin/insights — aggregates plus a plain-English narration. */
router.get('/insights', async (_req, res) => {
  try {
    const data = await collectInsights();
    const narration = await narrateInsights(data);
    return res.json({ success: true, data, narration });
  } catch (err) {
    console.error('Failed to build insights:', err);
    return res.status(500).json({ success: false, message: 'Could not build insights.' });
  }
});

export default router;
