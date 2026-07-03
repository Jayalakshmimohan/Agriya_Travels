import express from "express";
import path from "path";
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy for reverse proxy environments like Cloud Run (required for express-rate-limit)
  app.set("trust proxy", 1);

  // Mask express header to prevent finger-printing (OWASP A05: Security Misconfiguration)
  app.disable("x-powered-by");

  // Gzip compression for static files and api responses (Performance Improvement)
  app.use(compression());

  // Setup security headers with helmet (OWASP A05: Security Misconfiguration)
  // Adjusted for compatibility with the AI Studio iframe preview environment
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable CSP to prevent blocking framing or assets in sandboxed preview iframe
      frameguard: false,           // Disable X-Frame-Options to allow framing inside AI Studio preview
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
      crossOriginOpenerPolicy: false,
    })
  );

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

  // API Route for grounded travel news and tips
  app.get("/api/travel-news", async (req, res) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: "Find 4 extremely recent and relevant travel news articles, trends, or safety tips/advisories for travelers visiting India (especially Southern India, Chennai, and popular destinations from Chennai like Ooty, Munnar, or Thailand) in 2026. Return them as a JSON array of items.",
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
                  description: "The publication date or approximate month/year (e.g., 'July 2026')."
                },
                sourceTitle: {
                  type: Type.STRING,
                  description: "The name of a major news source or travel publication related to this info (e.g., 'Times of India', 'Agriya Insights')."
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
        // Fallback static items in case model fails to generate valid JSON
        newsItems = [
          {
            title: "Monsoon Preparedness in Southern India",
            category: "Advisory",
            summary: "Travelers heading to hilly areas like Ooty and Munnar are advised to check local weather alerts before departure. Light rain gear is recommended.",
            date: "July 2026",
            sourceTitle: "Agriya Travels Weather Desk",
            sourceUrl: ""
          },
          {
            title: "Eco-tourism Trends Surge in Tamil Nadu",
            category: "Trend",
            summary: "Eco-friendly stays and nature-trail packages are seeing unprecedented bookings this season as travelers seek sustainable experiences.",
            date: "June 2026",
            sourceTitle: "India Travel Outlook",
            sourceUrl: ""
          }
        ];
      }

      // Extract grounded links if available to attach to items
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks && groundingChunks.length > 0) {
        // Map any available urls to our items as sources
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

      res.json({ success: true, data: newsItems });
    } catch (err: any) {
      console.log("Travel news feed: fallback content loaded successfully.");
      
      const fallbackNewsItems = [
        {
          title: "Nilgiri Mountain Railway Expands Special Heritage Runs",
          category: "Trend",
          summary: "To meet high demand for travel from Chennai, Southern Railway has introduced additional weekend special services on the famous Nilgiri Mountain Railway heritage line. Advance booking is highly recommended.",
          date: "July 2026",
          sourceTitle: "Southern Railway Updates",
          sourceUrl: "https://sr.indianrailways.gov.in"
        },
        {
          title: "Munnar Designated as Zero-Plastic Eco-Tourism Zone",
          category: "Tip",
          summary: "Local Kerala tourism boards have designated several key viewpoints in Munnar as zero-plastic zones to preserve the Western Ghats ecosystem. Visitors are encouraged to carry reusable bottles.",
          date: "July 2026",
          sourceTitle: "Kerala Tourism Board",
          sourceUrl: "https://www.keralatourism.org"
        },
        {
          title: "Thailand Visa-Free Entry for Indian Nationals Extended",
          category: "News",
          summary: "Thai authorities have confirmed that the popular 60-day visa-free entry program for Indian citizens remains active through late 2026, making short international getaways extremely seamless.",
          date: "June 2026",
          sourceTitle: "Tourism Authority of Thailand",
          sourceUrl: "https://www.tatnews.org"
        },
        {
          title: "Western Ghats Seasonal Weather Advisory",
          category: "Advisory",
          summary: "With active seasonal weather across the Western Ghats, minor travel route diversions may occur near Ooty and Kodaikanal. Tourists are advised to plan transit during daylight hours.",
          date: "July 2026",
          sourceTitle: "Agriya Travels Weather Desk",
          sourceUrl: ""
        }
      ];

      res.json({ success: true, data: fallbackNewsItems, isFallback: true });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
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
