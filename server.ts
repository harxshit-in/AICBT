import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBfkYYde6dPYdT-Wo6nCnOiOKIaGO0tRXc",
  authDomain: "parikshai-harxshit.firebaseapp.com",
  projectId: "parikshai-harxshit",
  storageBucket: "parikshai-harxshit.firebasestorage.app",
  messagingSenderId: "88815516499",
  appId: "1:88815516499:web:ddf0fde4c41df8a0bbbfa6"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

try {
  admin.initializeApp({
    projectId: "parikshai-harxshit",
  });
} catch (e) {
  console.error("Firebase Admin initialization error:", e);
}

const app = express();

// Trust the proxy (required for Vercel/Cloud Run to correctly identify client IPs)
app.set('trust proxy', 1);

// Basic security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later."
});
app.use('/api/', limiter);

const getApiKeys = () => {
  const keys: string[] = [];
  for (let i = 1; i <= 15; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key && key.trim()) {
      keys.push(key.trim());
    }
  }
  if (keys.length === 0 && process.env.GEMINI_API_KEY) {
    keys.push(process.env.GEMINI_API_KEY);
  }
  return keys;
};

const PREMIUM_FEATURES = ['PDF_TO_CBT', 'AI_TUTOR', 'AI_SUMMARY', 'PARIKSHAI'];

const checkCredits = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { feature } = req.body;
  if (feature && !PREMIUM_FEATURES.includes(feature)) return next();
  const ip = (req.headers['x-forwarded-for'] as string || req.ip || "").split(',')[0].trim();
  const sanitizedIp = ip.replace(/[.#$[\]]/g, '_');
  const today = new Date().toISOString().split('T')[0];
  
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
    if (userData.credits <= 0) return res.status(403).json({ error: "Daily credit limit reached." });
    (req as any).userCredits = userData.credits;
    (req as any).userIp = sanitizedIp;
    next();
  } catch (error) { next(); }
};

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.post("/api/gemini-proxy", checkCredits, async (req, res) => {
  const { contents, model, systemInstruction, config, feature } = req.body;
  const keys = getApiKeys();
  const isPremium = !feature || PREMIUM_FEATURES.includes(feature);

  if (keys.length === 0) {
    console.error("No API keys found in environment variables.");
    return res.status(500).json({ error: "No API keys configured." });
  }

  for (const key of keys) {
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      
      const isImageModel = model.includes('image');
      const isTtsModel = model.includes('tts');
      
      const genConfig = { ...config };
      if (systemInstruction && !isImageModel && !isTtsModel) {
        genConfig.systemInstruction = systemInstruction;
      }
      
      console.log(`Sending request to Gemini API via SDK (Model: ${model})...`);
      
      const response = await ai.models.generateContent({
        model,
        contents,
        config: Object.keys(genConfig).length > 0 ? genConfig : undefined
      });
      
      const userIp = (req as any).userIp;
      if (userIp && isPremium) updateDoc(doc(db, "user_credits", userIp), { credits: increment(-1) }).catch(console.error);
      
      // The SDK returns a GenerateContentResponse object.
      // We can serialize it to JSON.
      // The frontend expects { candidates: [...], usageMetadata: ... }
      // The SDK response has .candidates, .usageMetadata, etc.
      return res.json({
        candidates: response.candidates,
        usageMetadata: response.usageMetadata
      });
      
    } catch (error: any) {
      console.error(`Gemini API Error:`, error);
      
      // The SDK throws errors with .status and .message
      const status = error.status || 500;
      const message = error.message || "An internal error occurred";
      
      if (status === 429 || message.includes('quota')) continue;
      
      // If it's a 400 error, return it immediately so we can see what's wrong
      return res.status(status).json({ error: message });
    }
  }
  res.status(429).json({ error: "All API keys exhausted." });
});

// Vite middleware for development only
if (process.env.NODE_ENV !== "production") {
  import("vite").then(({ createServer: createViteServer }) => {
    createViteServer({ server: { middlewareMode: true }, appType: "spa" }).then(vite => {
      app.use(vite.middlewares);
    });
  });
}

// Export the app for Vercel
export default app;

// Start server only if run directly (local development)
// In ESM, we check import.meta.url to see if this is the entry module
if (import.meta.url === `file://${process.cwd()}/server.ts`) {
  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://localhost:${PORT}`));
}
