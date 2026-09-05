import { GoogleGenAI } from '@google/genai';

let client: GoogleGenAI | null = null;

/**
 * The model every AI service uses. Overridable without a code change:
 * set GEMINI_MODEL in .env.
 *
 * Centralised because the id was previously hardcoded in server.ts. A wrong
 * value there fails silently — generateContent throws and the endpoint serves
 * its fallback forever — so it is worth having exactly one place to change
 * and one place to check.
 */
export function geminiModel(): string {
  return process.env.GEMINI_MODEL || 'gemini-3.5-flash';
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

/**
 * True when a plausibly real key is configured.
 *
 * Deliberately does not check the prefix: Google issues both "AIza..." keys
 * and "AQ..." keys, so pattern-matching the format would reject valid keys.
 * Length plus a placeholder check is all we can safely assert — anything
 * stricter is Google's job to reject.
 */
export function hasGeminiKey(): boolean {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key || key.length < 20) return false;
  return !/^(your|my|test|placeholder|changeme)/i.test(key);
}
