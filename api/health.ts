import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Dependency-free probe, to isolate a boot failure from a code failure.
 *
 * Every /api route was returning FUNCTION_INVOCATION_FAILED, including a
 * plain 404 that touches no database, no Gemini and no environment variable —
 * which says the function never boots rather than that any route is wrong.
 * This handler imports nothing but a type, so:
 *
 *   /api/health works, /api/* does not  -> our module graph fails to load
 *   both fail                           -> functions are broken project-wide
 *
 * Kept afterwards as an uptime check.
 */
export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(
    JSON.stringify({
      ok: true,
      runtime: process.version,
      // Presence only — never the values.
      env: {
        DATABASE_URL: Boolean(process.env.DATABASE_URL),
        GEMINI_API_KEY: Boolean(process.env.GEMINI_API_KEY),
        GEMINI_MODEL: process.env.GEMINI_MODEL ?? null,
        ADMIN_API_TOKEN: Boolean(process.env.ADMIN_API_TOKEN),
      },
    })
  );
}
