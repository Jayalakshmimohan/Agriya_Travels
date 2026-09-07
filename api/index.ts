import 'dotenv/config';
import { createApiApp } from '../src/server/app';

/**
 * Vercel serverless entry for every /api/* request.
 *
 * Vercel serves the static Vite build from its CDN, so this handler carries
 * only the API — no Vite, no MPA routing, no static files. The Express app
 * itself is shared with server.ts rather than redefined, so the two
 * environments cannot drift apart.
 *
 * Express instances are safe to reuse across invocations on a warm container,
 * and creating one at module scope means the cost is paid once per cold start
 * rather than per request.
 */
export default createApiApp();
