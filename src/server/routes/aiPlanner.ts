import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { tripPlanRequestSchema } from '../schemas/tripPlan';
import { generatePlan } from '../services/aiPlannerService';
import { hasGeminiKey } from '../ai/gemini';

const router = Router();

/**
 * Tighter than the site-wide limiter: each call costs a paid Gemini
 * generation and the endpoint is unauthenticated.
 */
const plannerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many itinerary requests. Please try again in a few minutes.',
  },
});

router.post('/plan-trip', plannerLimiter, async (req, res) => {
  const parsed = tripPlanRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid trip request',
      errors: parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  // Fail fast and clearly rather than burning a round-trip on a bad key.
  if (!hasGeminiKey()) {
    return res.status(503).json({
      success: false,
      reason: 'no_api_key',
      message: 'AI planning is not configured on this server.',
    });
  }

  try {
    const result = await generatePlan(parsed.data);
    return res.json({
      success: true,
      data: result.plan,
      model: result.model,
      groundedPackageIds: result.groundedPackageIds,
    });
  } catch (err) {
    // The client falls back to its local template on any non-200, so this is
    // a degraded experience rather than a broken one.
    console.error('AI trip planning failed:', err);
    return res.status(502).json({
      success: false,
      reason: 'generation_failed',
      message: 'Could not generate an itinerary right now.',
    });
  }
});

export default router;
