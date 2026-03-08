import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic security middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled for Vite HMR and inline scripts
    crossOriginEmbedderPolicy: false,
  }));
  app.use(cors());
  app.use(express.json({ limit: '50mb' })); // Limit payload size to prevent DOS

  // Rate limiting to prevent abuse
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: "Too many requests from this IP, please try again later."
  });
  app.use('/api/', limiter);

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "ExamPrep CBT Server is running" });
  });

  // Fallback Gemini API proxy if needed (though browser-side is preferred)
  app.post("/api/gemini-proxy", async (req, res) => {
    const { contents, model, apiKey } = req.body;
    const key = apiKey || process.env.GEMINI_API_KEY;
    
    if (!key) {
      return res.status(400).json({ error: "API Key is required" });
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents }),
        }
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to proxy request to Gemini" });
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
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
