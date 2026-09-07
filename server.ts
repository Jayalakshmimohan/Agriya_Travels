import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import { spawn } from "child_process";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { createApiApp } from "./src/server/app";

dotenv.config();

const MPA_PAGE_MAP: Record<string, string> = {
  '/': 'index.html',
  '/about': 'about/index.html',
  '/india-tours': 'india-tours/index.html',
  '/international-tours': 'international-tours/index.html',
  '/theme-tours': 'theme-tours/index.html',
  '/rentals': 'rentals/index.html',
  '/corporate': 'corporate/index.html',
  '/gallery': 'gallery/index.html',
  '/testimonials': 'testimonials/index.html',
  '/ai-planner': 'ai-planner/index.html',
  '/contact': 'contact/index.html',
  '/admin': 'admin/index.html',
  '/404': '404.html',
  '/404.html': '404.html',
};

/**
 * Local dev and self-hosted production.
 *
 * The API lives in src/server/app.ts and is shared with the Vercel handler.
 * Everything here is the part Vercel does for us: serving the built pages and
 * holding a port open.
 */
async function startServer() {
  const app = createApiApp();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Multi-Page Application (MPA) Routing
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });

    // Handle known MPA HTML routes BEFORE vite middleware
    app.use(async (req, res, next) => {
      // Pass static assets and vite internal requests directly to vite
      if (
        req.path.startsWith('/@') || 
        req.path.startsWith('/src/') ||
        req.path.startsWith('/node_modules/') ||
        req.path.includes('.')
      ) {
        return next();
      }

      const cleanPath = req.path.replace(/\/$/, '') || '/';
      const matchedPage = MPA_PAGE_MAP[cleanPath];

      if (matchedPage) {
        try {
          const filePath = path.resolve(process.cwd(), matchedPage);
          if (fs.existsSync(filePath)) {
            let template = await fs.promises.readFile(filePath, 'utf-8');
            template = await vite.transformIndexHtml(req.originalUrl, template);
            return res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
          }
        } catch (e) {
          return next(e);
        }
      }

      next();
    });

    // Vite internal middleware for modules, CSS, HMR, assets
    app.use(vite.middlewares);

    // Development 404 handler for any unhandled routes
    app.use(async (req, res, next) => {
      // Don't intercept static assets or vite requests that errored
      if (req.path.startsWith('/@') || req.path.startsWith('/src/') || req.path.includes('.')) {
        return next();
      }

      try {
        const notFoundPath = path.resolve(process.cwd(), '404.html');
        if (fs.existsSync(notFoundPath)) {
          let template = await fs.promises.readFile(notFoundPath, 'utf-8');
          template = await vite.transformIndexHtml(req.originalUrl, template);
          return res.status(404).set({ 'Content-Type': 'text/html' }).end(template);
        }
      } catch (e) {
        console.error("Error serving dev 404:", e);
      }

      res.status(404).send("404 Not Found");
    });
  } else {
    // Production MPA Static File & Route Serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));

    app.get('*', (req, res) => {
      const cleanPath = req.path.replace(/\/$/, '') || '/';
      const matchedPage = MPA_PAGE_MAP[cleanPath];

      if (matchedPage) {
        const filePath = path.join(distPath, matchedPage);
        if (fs.existsSync(filePath)) {
          return res.sendFile(filePath);
        }
      }

      // 404 Not Found response
      const notFoundPath = path.join(distPath, '404.html');
      if (fs.existsSync(notFoundPath)) {
        return res.status(404).sendFile(notFoundPath);
      }

      res.status(404).send("404 Not Found");
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    openInBrowser(PORT);
  });
}

/**
 * Opens the site on startup in development.
 *
 * Vite normally does this, but it runs here in middlewareMode inside Express,
 * so it never owns the HTTP server and its `server.open` option is ignored.
 *
 * Deliberately narrow: production is excluded so this can never fire on Cloud
 * Run, and OPEN_BROWSER=false turns it off for anyone who finds it annoying.
 */
function openInBrowser(port: number) {
  if (process.env.NODE_ENV === "production") return;
  if (process.env.OPEN_BROWSER === "false") return;

  // Under `tsx watch` this function runs again on every restart, and opening a
  // fresh tab each time you save a file is intolerable. The watch supervisor's
  // pid stays constant across restarts, so a marker holding it distinguishes
  // "restarted" from "started fresh".
  const marker = path.join(os.tmpdir(), `agriya-dev-${port}.pid`);
  try {
    if (fs.readFileSync(marker, "utf8").trim() === String(process.ppid)) return;
  } catch {
    /* no marker yet — this is a fresh start */
  }
  try {
    fs.writeFileSync(marker, String(process.ppid));
  } catch {
    /* a read-only temp dir just means we may open an extra tab */
  }

  const url = process.env.OPEN_BROWSER_URL || `http://localhost:${port}`;

  // Only ever a fixed command with the URL as a separate argument — never an
  // interpolated shell string, which env-supplied values could break out of.
  const [command, args]: [string, string[]] =
    process.platform === "win32"
      ? ["cmd", ["/c", "start", "", url]]
      : process.platform === "darwin"
        ? ["open", [url]]
        : ["xdg-open", [url]];

  try {
    const child = spawn(command, args, { stdio: "ignore", detached: true });
    // Failing to open a browser must never take the server down — a headless
    // machine has no xdg-open and that is fine.
    child.on("error", () => {});
    child.unref();
  } catch {
    /* not worth reporting */
  }
}

startServer();
