import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Bearer-token gate for the admin API.
 *
 * Right-sized for an agency with one or two staff. If they later want
 * per-user accounts, this is the only file that changes — the data model
 * already carries everything a real auth system would need.
 */
export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.ADMIN_API_TOKEN;

  // Refuse to run open rather than silently exposing customer PII.
  if (!expected || expected.length < 16) {
    console.error('ADMIN_API_TOKEN is not set (or is too short) — admin API disabled.');
    return res.status(503).json({
      success: false,
      message: 'Admin API is not configured.',
    });
  }

  const header = req.get('authorization') ?? '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!provided || !safeEqual(provided, expected)) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  next();
}

/** Constant-time compare so the token can't be guessed by timing. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
