import 'dotenv/config';
import type { Express } from 'express';

/**
 * Vercel serverless entry for every /api/* request.
 *
 * Vercel serves the static Vite build from its CDN, so this handler carries
 * only the API — no Vite, no MPA routing, no static files.
 *
 * It requires a *bundle* rather than importing ../src/server/app directly,
 * and the reason is Node's module classification. The root package.json
 * declares "type": "module", so every emitted src/server/*.js is treated as
 * ESM, while api/package.json declares this directory CommonJS. Requiring
 * across that line fails with ERR_REQUIRE_ESM in production. Going the other
 * way — making api/ ESM too — fails differently, because strict ESM needs file
 * extensions and every import in src/server is extensionless.
 *
 * A .cjs file is unconditionally CommonJS whatever the nearest package.json
 * says, and the bundle is self-contained, so there is no second module to
 * classify and no extensionless path left to resolve. server.ts is already
 * built this way; this is the same trick applied to the function.
 *
 * Express instances are safe to reuse across invocations on a warm container,
 * and building one at module scope means the cost is paid once per cold start.
 */
const { createApiApp } = require('../server-build/server.cjs') as {
  createApiApp: () => Express;
};

export default createApiApp();
