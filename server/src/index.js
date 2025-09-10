// server/src/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';

// Routes
import authRoutes from './routes/auth.js';
import workoutRoutes from './routes/workouts.js';
import mealRoutes from './routes/meals.js';
import progressRoutes from './routes/progress.js';
import profileRoutes from './routes/profile.js';
import debugRoutes from './routes/debug.js';
import planRoutes from './routes/plan.js';

const app = express();

/* ---------- Core middleware ---------- */
app.use(express.json({ limit: '1mb' }));
app.use(helmet());

// Verbose logs only in dev
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

/* ---------- CORS (Vercel frontend + local dev + optional previews) ---------- */
const allowedOrigins = [
  'https://fitmate-rho.vercel.app',            // ✅ your production frontend (no trailing slash)
  'http://localhost:5173',                      // local Vite dev
  /^https:\/\/[a-z0-9-]+--fitmate-rho\.vercel\.app$/i // optional: Vercel preview URLs for this project
];

const corsOptions = {
  origin(origin, cb) {
    // Allow tools like curl/Postman (no Origin header)
    if (!origin) return cb(null, true);
    const ok = allowedOrigins.some(rule =>
      typeof rule === 'string' ? rule === origin : rule.test?.(origin)
    );
    // When `ok` is false, CORS headers are omitted (browser blocks) but we don't 500
    return cb(null, ok);
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,            // set to true ONLY if you use cookies for auth
  optionsSuccessStatus: 204
};

// Help caches vary by Origin properly
app.use((req, res, next) => {
  res.header('Vary', 'Origin');
  next();
});

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // ✅ handle preflight cleanly

/* ---------- Health check ---------- */
app.get('/health', (_req, res) =>
  res.json({ ok: true, service: 'fitmate-api', ts: Date.now() })
);

/* ---------- Base route ---------- */
app.get('/', (_req, res) => res.json({ ok: true, service: 'fitmate-api' }));

/* ---------- API routes (note the /api prefix) ---------- */
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/plan', planRoutes);

/* ---------- Startup ---------- */
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not set. Add it in Render → Environment.');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ FitMate API running on :${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err?.message || err);
    process.exit(1);
  });
