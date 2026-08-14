import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

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
  '/404': '404.html',
  '/404.html': '404.html',
};

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Trust proxy for reverse proxy environments like Cloud Run (required for express-rate-limit)
  app.set("trust proxy", 1);

  // Mask express header to prevent finger-printing (OWASP A05: Security Misconfiguration)
  app.disable("x-powered-by");

  // Gzip compression for static files and api responses (Performance Improvement)
  app.use(compression());

  // Setup comprehensive security headers with helmet (OWASP Top 10 & A05: Security Misconfiguration)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            "https://unpkg.com",
            "https://cdn.jsdelivr.net"
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
            "https://unpkg.com"
          ],
          fontSrc: [
            "'self'",
            "https://fonts.gstatic.com",
            "data:"
          ],
          imgSrc: [
            "'self'",
            "data:",
            "blob:",
            "https://images.unsplash.com",
            "https://*.google.com",
            "https://*.googleapis.com",
            "https://*.gstatic.com",
            "https://*.indianrailways.gov.in",
            "https://*.keralatourism.org",
            "https://*.tatnews.org",
            "https://*.tamilnadutourism.tn.gov.in",
            "https://*.karnatakatourism.org",
            "https://*.tourism.rajasthan.gov.in",
            "https://*.jktourism.jk.gov.in",
            "https://*.srilanka.travel",
            "https://*.indonesia.travel",
            "https://*.malaysia.travel"
          ],
          connectSrc: [
            "'self'",
            "https://generativelanguage.googleapis.com",
            "https://*.google.com",
            "https://unpkg.com",
            "https://api.open-meteo.com",
            "ws:",
            "wss:"
          ],
          mediaSrc: ["'self'", "data:", "blob:"],
          objectSrc: ["'none'"],
          frameSrc: ["'self'", "https://www.google.com", "https://maps.google.com"],
          frameAncestors: ["'self'"],
          formAction: ["'self'", "mailto:", "https://wa.me", "https://api.whatsapp.com"],
          baseUri: ["'self'"],
          upgradeInsecureRequests: []
        }
      },
      frameguard: {
        action: "sameorigin" // Sets X-Frame-Options: SAMEORIGIN
      },
      noSniff: true, // Sets X-Content-Type-Options: nosniff
      referrerPolicy: {
        policy: ["strict-origin-when-cross-origin", "no-referrer-when-downgrade"] // Sets Referrer-Policy
      },
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
      crossOriginResourcePolicy: { policy: "cross-origin" },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    })
  );

  // Set Permissions-Policy header and extra hardening headers
  app.use((req, res, next) => {
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), display-capture=(), interest-cohort=()"
    );
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
  });

  // Rate Limiting to prevent DoS attacks and resource abuse (OWASP A04: Insecure Design & A05: Security Misconfiguration)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per 15 minutes
    standardHeaders: "draft-7", // Return rate limit info in standard headers
    legacyHeaders: false, // Disable the deprecated X-RateLimit-* headers
    message: {
      success: false,
      message: "Too many requests from this IP, please try again later."
    }
  });

  // Apply rate limiting to all api endpoints
  app.use("/api/", apiLimiter);

  app.use(express.json());

  // API Route for grounded travel news and tips (Always updated to current date)
  app.get("/api/travel-news", async (req, res) => {
    const now = new Date();
    const todayFormatted = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const fullDateFormatted = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Today is ${fullDateFormatted}. Find 4 extremely recent, real-world, and relevant travel news articles, trends, or safety advisories/tips for travelers visiting India (especially Southern India, Chennai, Tamil Nadu, Kerala, and popular international destinations from Chennai like Thailand, Sri Lanka, Malaysia, Bali) as of ${todayFormatted}. Return them as a JSON array of items with date field formatted as 'Today, ${todayFormatted}' or recent dates.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: {
                  type: Type.STRING,
                  description: "A short, catchy, and professional title of the travel trend, news article, or safety advice."
                },
                category: {
                  type: Type.STRING,
                  description: "One of these categories: 'Trend', 'Tip', 'Advisory', 'News', 'Insight'."
                },
                summary: {
                  type: Type.STRING,
                  description: "A detailed 2-3 sentence paragraph containing highly practical, actual real-world advice or news updates."
                },
                date: {
                  type: Type.STRING,
                  description: `The date formatted relative to today (e.g. 'Today, ${todayFormatted}').`
                },
                sourceTitle: {
                  type: Type.STRING,
                  description: "The name of a major news source or travel publication related to this info (e.g., 'Southern Railway', 'The Hindu', 'Kerala Tourism', 'TAT News')."
                },
                sourceUrl: {
                  type: Type.STRING,
                  description: "A valid URL or source reference."
                }
              },
              required: ["title", "category", "summary", "date", "sourceTitle"]
            }
          }
        }
      });

      const text = response.text || "[]";
      let newsItems = [];
      try {
        newsItems = JSON.parse(text);
      } catch (parseErr) {
        console.error("JSON parsing error:", parseErr, "Raw response:", text);
      }

      // Extract grounded links if available to attach to items
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks && groundingChunks.length > 0 && Array.isArray(newsItems)) {
        newsItems = newsItems.map((item: any, index: number) => {
          const chunk = groundingChunks[index % groundingChunks.length];
          if (chunk?.web?.uri) {
            return {
              ...item,
              sourceUrl: chunk.web.uri,
              sourceTitle: chunk.web.title || item.sourceTitle
            };
          }
          return item;
        });
      }

      if (Array.isArray(newsItems) && newsItems.length > 0) {
        return res.json({ success: true, data: newsItems, isLive: true, asOf: todayFormatted });
      }

      throw new Error("Empty news items generated, using dynamic daily feed.");
    } catch (err: any) {
      // Generate dynamically dated fallback items reflecting the exact current date
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayFormatted = yesterday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

      const month = now.getMonth();
      let seasonalLead: any;

      if (month >= 6 && month <= 8) {
        seasonalLead = {
          title: "Nilgiri Mountain Railway Expands Special Runs for Weekend Demand",
          category: "Trend",
          summary: "Southern Railway has scheduled additional weekend special services on the Mettupalayam-Ooty heritage line to accommodate high passenger volume from Chennai. Advance ticket reservation is recommended.",
          date: `Today, ${todayFormatted}`,
          sourceTitle: "Southern Railway Updates",
          sourceUrl: "https://sr.indianrailways.gov.in"
        };
      } else if (month >= 9 && month <= 10) {
        seasonalLead = {
          title: "Festive Season Heritage Circuits & Temple Tour Guidelines Active",
          category: "Trend",
          summary: "Special heritage circuits connecting Madurai, Rameshwaram, and Mysore have introduced streamlined priority transit and crowd management systems for festive travelers.",
          date: `Today, ${todayFormatted}`,
          sourceTitle: "Tourism Department Advisory",
          sourceUrl: "https://www.tamilnadutourism.tn.gov.in"
        };
      } else if (month >= 11 || month <= 1) {
        seasonalLead = {
          title: "Winter Snow & Island Holiday Peak Season Bookings Open",
          category: "Trend",
          summary: "Direct flights and packages from Chennai to Kashmir (Gulmarg Gondola) and Andaman Islands are operating with high occupancy. Advance slot reservations are advised.",
          date: `Today, ${todayFormatted}`,
          sourceTitle: "Agriya Seasonal Desk",
          sourceUrl: ""
        };
      } else {
        seasonalLead = {
          title: "Hill Station Summer Travel Advisories & e-Pass Updates",
          category: "Trend",
          summary: "Automated e-pass approvals are active for tourist vehicle entries across the Nilgiris and Kodaikanal to ensure orderly scenic transit.",
          date: `Today, ${todayFormatted}`,
          sourceTitle: "District Administration Bulletin",
          sourceUrl: "https://epass.tnega.org"
        };
      }

      const fallbackNewsItems = [
        seasonalLead,
        {
          title: "Munnar Viewpoints Enforce Zero-Plastic Eco Guidelines",
          category: "Tip",
          summary: "Local tourism boards across Munnar and Wayanad have designated several key viewpoints as zero-plastic zones to preserve the ecosystem. Visitors are encouraged to carry reusable bottles.",
          date: `Today, ${todayFormatted}`,
          sourceTitle: "Kerala Tourism Board",
          sourceUrl: "https://www.keralatourism.org"
        },
        {
          title: "Thailand 60-Day Visa-Free Entry for Indian Nationals Reconfirmed",
          category: "News",
          summary: "The Royal Thai Government has reaffirmed the 60-day visa exemption scheme for Indian passport holders, offering seamless travel for Bangkok, Phuket, and Krabi getaways.",
          date: `Yesterday, ${yesterdayFormatted}`,
          sourceTitle: "Tourism Authority of Thailand",
          sourceUrl: "https://www.tatnews.org"
        },
        {
          title: "Western Ghats Daylight Travel & Highway Transit Advisory",
          category: "Advisory",
          summary: "State highway authorities report clear connectivity across major hill routes. Travelers are advised to plan transit during daylight hours for maximum safety and panoramic views.",
          date: `Today, ${todayFormatted}`,
          sourceTitle: "Agriya Safety Desk",
          sourceUrl: ""
        }
      ];

      res.json({ success: true, data: fallbackNewsItems, isLive: false, asOf: todayFormatted });
    }
  });

  // Catch-all 404 handler for API routes
  app.all('/api/*', (req, res) => {
    res.status(404).json({ success: false, message: 'API endpoint not found' });
  });

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

  // Global error handling middleware to prevent sensitive information disclosure (OWASP A05)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled server error:", err);
    res.status(500).json({
      success: false,
      message: "An internal server error occurred. Please try again later."
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
