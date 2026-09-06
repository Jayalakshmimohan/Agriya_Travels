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

/**
 * Models to try, in order.
 *
 * Google returns 503 "experiencing high demand" for structured-output calls
 * far more often than for plain ones, and it flaps between models minute to
 * minute — one is overloaded while another answers instantly. Retrying the
 * same model harder does not help; moving to another one does.
 *
 * Override with GEMINI_MODELS (comma-separated) to pin the order.
 */
export function geminiModels(): string[] {
  const configured = process.env.GEMINI_MODELS?.split(',').map((m) => m.trim()).filter(Boolean);
  if (configured?.length) return configured;

  const primary = geminiModel();
  const fallbacks = ['gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'];
  return [primary, ...fallbacks.filter((m) => m !== primary)];
}

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

function isRetryable(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  return typeof status === 'number' && RETRYABLE_STATUSES.has(status);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface GenerateResult {
  text: string;
  model: string;
  usageMetadata: unknown;
  /** Raw response, for callers that need grounding metadata. */
  raw: Awaited<ReturnType<GoogleGenAI['models']['generateContent']>>;
}

/**
 * One generateContent call with retries and model fallback.
 *
 * Every AI service goes through here so the resilience logic lives in one
 * place rather than being reimplemented, slightly differently, five times.
 * Non-retryable errors (a bad key, an invalid schema) throw immediately —
 * cycling models would only turn a clear error into a slow one.
 */
export async function generateWithFallback(args: {
  contents: string;
  config?: Record<string, unknown>;
  /** Attempts per model before moving on. */
  attemptsPerModel?: number;
}): Promise<GenerateResult> {
  const models = geminiModels();
  const attempts = args.attemptsPerModel ?? 2;
  let lastErr: unknown;

  for (const model of models) {
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const raw = await getGemini().models.generateContent({
          model,
          contents: args.contents,
          ...(args.config ? { config: args.config } : {}),
        });

        const text = raw.text;
        if (!text) throw new Error('Gemini returned an empty response');

        if (model !== models[0]) {
          console.warn(`Gemini: ${models[0]} unavailable, answered with ${model}`);
        }
        return { text, model, usageMetadata: raw.usageMetadata ?? null, raw };
      } catch (err) {
        lastErr = err;
        if (!isRetryable(err)) throw err;
        if (attempt < attempts - 1) await sleep(700 * (attempt + 1));
      }
    }
  }

  throw lastErr ?? new Error('Gemini request failed across all models');
}
