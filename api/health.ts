import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Dependency-free probe, to isolate a boot failure from a code failure.
 *
 * Two bugs were stacked here. First, the root tsconfig.json is the Vite
 * client config (noEmit, bundler resolution, DOM, JSX) and Vercel's Node
 * builder reads the nearest tsconfig when it compiles api/*.ts, so every
 * function compiled to nothing -- this handler included. api/tsconfig.json
 * fixed that and this route started answering 200.
 *
 * Underneath it, api/index.ts still fails to load: a request that should get
 * an Express 404 gets FUNCTION_INVOCATION_FAILED instead, so the failure is
 * at module load, not per-route. Nothing in the graph throws at module scope
 * and every environment variable is present, which points at resolution of
 * the extensionless `../src/server/app` rather than at our code.
 *
 * `?probe=app` attempts that exact require and reports why it fails, because
 * from outside the function a MODULE_NOT_FOUND and a thrown constructor look
 * identical. It returns error identity only -- never an environment value.
 */
export default function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;

  const base = {
    ok: true,
    runtime: process.version,
    // Presence only — never the values.
    env: {
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
      GEMINI_API_KEY: Boolean(process.env.GEMINI_API_KEY),
      GEMINI_MODEL: process.env.GEMINI_MODEL ?? null,
      ADMIN_API_TOKEN: Boolean(process.env.ADMIN_API_TOKEN),
    },
  };

  if (!(req.url ?? '').includes('probe=app')) {
    res.end(JSON.stringify(base));
    return;
  }

  let appProbe: Record<string, unknown>;
  try {
    const mod = require('../src/server/app') as Record<string, unknown>;
    appProbe = { loaded: true, exports: Object.keys(mod) };
  } catch (err) {
    const e = err as { name?: string; code?: string; message?: string; stack?: string };
    appProbe = {
      loaded: false,
      name: e.name ?? null,
      code: e.code ?? null,
      message: e.message ?? String(err),
      stack: (e.stack ?? '').split('\n').slice(1, 6).map((l) => l.trim()),
    };
  }

  res.end(JSON.stringify({ ...base, appProbe }));
}
