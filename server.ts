import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import admin from "firebase-admin";

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

  if (keys.length === 0) return res.status(500).json({ error: "No API keys configured." });

  for (const key of keys) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents, systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined, ...config }),
      });
      const data = await response.json();
      if (response.ok) {
        const userIp = (req as any).userIp;
        if (userIp && isPremium) updateDoc(doc(db, "user_credits", userIp), { credits: increment(-1) }).catch(console.error);
        return res.json(data);
      }
      if (response.status === 429 || (data.error && data.error.message.includes('quota'))) continue;
      return res.status(response.status).json(data);
    } catch (error) { console.error(error); }
  }
  res.status(429).json({ error: "All API keys exhausted." });
});

// Vite middleware for development only
if (process.env.NODE_ENV !== "production") {
  createViteServer({ server: { middlewareMode: true }, appType: "spa" }).then(vite => {
    app.use(vite.middlewares);
  });
}

// Export the app for Vercel
export default app;

// Start server only if run directly (local development)
if (require.main === module) {
  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://localhost:${PORT}`));
}
