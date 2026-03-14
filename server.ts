import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import jwt from "jsonwebtoken";
import admin from "firebase-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase Configuration (Same as client)
const firebaseConfig = {
  apiKey: "AIzaSyBfkYYde6dPYdT-Wo6nCnOiOKIaGO0tRXc",
  authDomain: "parikshai-harxshit.firebaseapp.com",
  projectId: "parikshai-harxshit",
  storageBucket: "parikshai-harxshit.firebasestorage.app",
  messagingSenderId: "88815516499",
  appId: "1:88815516499:web:ddf0fde4c41df8a0bbbfa6"
};

// Initialize Firebase for Server
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Initialize Firebase Admin for minting custom tokens
try {
  admin.initializeApp({
    projectId: "parikshai-harxshit",
  });
} catch (e) {
  console.error("Firebase Admin initialization error:", e);
}

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-prod";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic security middleware
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // Rate limiting to prevent abuse
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Reduced limit for API protection
    message: "Too many requests from this IP, please try again later."
  });
  app.use('/api/', limiter);

  // Helper to get API keys from env
  const getApiKeys = () => {
    const keys: string[] = [];
    for (let i = 1; i <= 15; i++) {
      const key = process.env[`GEMINI_API_KEY_${i}`];
      if (key && key.trim()) {
        keys.push(key.trim());
      }
    }
    // Fallback to GEMINI_API_KEY if no numbered keys found
    if (keys.length === 0 && process.env.GEMINI_API_KEY) {
      keys.push(process.env.GEMINI_API_KEY);
    }
    return keys;
  };

const PREMIUM_FEATURES = [
  'PDF_TO_CBT',
  'AI_TUTOR',
  'AI_SUMMARY',
  'PARIKSHAI'
];

  // Credit management middleware (Firestore)
  const checkCredits = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { feature } = req.body;
    
    // If feature is not premium, skip credit check
    if (feature && !PREMIUM_FEATURES.includes(feature)) {
      return next();
    }

    const ip = (req.headers['x-forwarded-for'] as string || req.ip || req.socket.remoteAddress || "unknown").split(',')[0].trim();
    const sanitizedIp = ip.replace(/[.#$[\]]/g, '_'); // Firestore keys can't have certain chars
    
    // Reset credits daily
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    try {
      const userRef = doc(db, "user_credits", sanitizedIp);
      const userSnap = await getDoc(userRef);
      
      let userData: any;
      
      if (!userSnap.exists()) {
        userData = { credits: 5, last_reset: today };
        await setDoc(userRef, userData);
      } else {
        userData = userSnap.data();
        if (userData.last_reset !== today) {
          userData.credits = 5;
          userData.last_reset = today;
          await updateDoc(userRef, { credits: 5, last_reset: today });
        }
      }

      if (userData.credits <= 0) {
        return res.status(403).json({ error: "Daily credit limit reached (5/5). Please try again tomorrow." });
      }

      (req as any).userCredits = userData.credits;
      (req as any).userIp = sanitizedIp;
      next();
    } catch (error) {
      console.error("Credit check error:", error);
      next(); // Fallback: allow request if DB fails (or handle as error)
    }
  };

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "ExamPrep CBT Server is running" });
  });

  app.get("/api/user-credits", async (req, res) => {
    const ip = (req.headers['x-forwarded-for'] as string || req.ip || req.socket.remoteAddress || "unknown").split(',')[0].trim();
    const sanitizedIp = ip.replace(/[.#$[\]]/g, '_');
    
    try {
      const userRef = doc(db, "user_credits", sanitizedIp);
      const userSnap = await getDoc(userRef);
      res.json({ credits: userSnap.exists() ? userSnap.data().credits : 5 });
    } catch (error) {
      res.json({ credits: 5 });
    }
  });

  // AI Proxy with Key Rotation and Credit Deduction
  app.post("/api/gemini-proxy", checkCredits, async (req, res) => {
    const { contents, model, systemInstruction, config, feature } = req.body;
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const keys = getApiKeys();

    const isPremium = !feature || PREMIUM_FEATURES.includes(feature);

    if (keys.length === 0) {
      return res.status(500).json({ error: "No API keys configured on server." });
    }

    let lastError: any = null;
    
    // Try keys one by one if they fail with rate limit
    for (const key of keys) {
      try {
        const body: any = { contents };
        if (systemInstruction) {
          body.systemInstruction = { parts: [{ text: systemInstruction }] };
        }
        if (config) {
          Object.assign(body, config);
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );

        const data = await response.json();

        if (response.ok) {
          // Deduct credit on success (Firestore) only for premium features
          const userIp = (req as any).userIp;
          if (userIp && isPremium) {
            const userRef = doc(db, "user_credits", userIp);
            updateDoc(userRef, { credits: increment(-1) }).catch(e => console.error("Credit deduction failed:", e));
          }
          return res.json(data);
        }

        // If rate limited or quota exhausted, try next key
        if (response.status === 429 || (data.error && data.error.message.includes('quota'))) {
          console.warn(`API Key exhausted, trying next...`);
          lastError = data.error || { message: "Rate limit reached" };
          continue;
        }

        // Other errors
        return res.status(response.status).json(data);
      } catch (error) {
        lastError = error;
        console.error("Proxy error:", error);
      }
    }

    res.status(429).json({ 
      error: "All server API keys are currently exhausted. Please try again later.",
      details: lastError
    });
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
