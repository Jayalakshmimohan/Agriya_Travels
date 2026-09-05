import { GoogleGenAI } from '@google/genai';

let client: GoogleGenAI | null = null;

/**
 * The model every AI service uses. Overridable without a code change:
 * set GEMINI_MODEL in .env.
 *
 * This exists because the model id used to be hardcoded in server.ts, and a
 * wrong value there failed silently — the endpoint just served its fallback
 * forever. One constant, one place to fix.
 */
export function geminiModel(): string {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

/**
 * Lazily constructed for the same reason as the Postgres pool: server.ts
 * calls dotenv.config() after its imports evaluate, so reading the key at
 * module load would see undefined.
 */
export function getGemini(): GoogleGenAI {
  if (client) return client;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  client = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });

  return client;
}

/** True when a plausibly real key is configured (not blank, not a placeholder). */
export function hasGeminiKey(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key.startsWith('AIza') && key.length > 30);
}
