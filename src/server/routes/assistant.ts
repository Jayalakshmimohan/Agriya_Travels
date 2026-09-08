import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { handleMessage } from '../services/travelAssistantService';
import { hasGeminiKey } from '../ai/gemini';
import { ASSISTANT_NAME } from '../../data';

const router = Router();

// Each turn costs two Gemini calls (extraction + explanation), so this is
// tighter than the site-wide limiter.
const assistantLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again in a few minutes.',
  },
});

const requestSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(1500),
  conversationId: z.string().uuid().optional(),
  sessionId: z.string().max(120).optional(),
});

router.post('/', assistantLimiter, async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request',
      errors: parsed.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      })),
    });
  }

  if (!hasGeminiKey()) {
    return res.status(503).json({
      success: false,
      reason: 'no_api_key',
      message: `${ASSISTANT_NAME} is not configured on this server.`,
    });
  }

  try {
    const reply = await handleMessage({
      message: parsed.data.message,
      conversationId: parsed.data.conversationId ?? null,
      sessionId: parsed.data.sessionId ?? null,
    });
    return res.json({ success: true, data: reply });
  } catch (err) {
    console.error('Travel assistant failed:', err);
    return res.status(502).json({
      success: false,
      reason: 'assistant_failed',
      message: 'Sorry — something went wrong working that out. Please try again.',
    });
  }
});

export default router;
