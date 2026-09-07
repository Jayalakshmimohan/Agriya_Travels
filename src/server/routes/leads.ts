import { Router } from 'express';
import { leadInputSchema } from '../schemas/lead';
import { createLead } from '../services/leadService';

const router = Router();

/**
 * POST /api/leads
 *
 * Called fire-and-forget by every enquiry form just before it hands off to
 * WhatsApp or the visitor's mail client, so the response body is only useful
 * for debugging — the browser is usually navigating away by the time it lands.
 */
router.post('/', async (req, res) => {
  const parsed = leadInputSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid enquiry data',
      errors: parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  try {
    const lead = await createLead(parsed.data);
    return res.status(201).json({ success: true, id: lead.id });
  } catch (err) {
    // Never surface driver internals to the browser (OWASP A05).
    console.error('Failed to record lead:', err);
    return res.status(500).json({
      success: false,
      message: 'Could not record the enquiry. Please try again later.',
    });
  }
});

export default router;
