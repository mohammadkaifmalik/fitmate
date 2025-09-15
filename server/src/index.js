// server/src/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.js';
import workoutRoutes from './routes/workouts.js';
import mealRoutes from './routes/meals.js';
import progressRoutes from './routes/progress.js';
import profileRoutes from './routes/profile.js';
import debugRoutes from './routes/debug.js';
import planRoutes from './routes/plan.js';

const app = express();

/* Core middleware */
app.use(express.json({ limit: '1mb' }));
app.use(helmet());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

/* CORS */
const allowedOrigins = [
  'https://fitmate-rho.vercel.app',
  'http://localhost:5173',
  /^https:\/\/[a-z0-9-]+--fitmate-rho\.vercel\.app$/i, // Vercel previews
];

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // non-browser tools (no Origin)
    const ok = allowedOrigins.some(rule =>
      typeof rule === 'string' ? rule === origin : rule.test?.(origin)
    );
    cb(null, ok);
  },
  credentials: false, // set true only if using cookie auth
  optionsSuccessStatus: 204,
};

// ensure caches vary by Origin/requested headers
app.use((req, res, next) => {
  res.header('Vary', 'Origin, Access-Control-Request-Headers');
  next();
});

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

/* Health & base */
app.get('/health', (_req, res) =>
  res.json({ ok: true, service: 'fitmate-api', ts: Date.now() })
);
app.get('/', (_req, res) => res.json({ ok: true, service: 'fitmate-api' }));

/* API routes (prefixed) */
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/plan', planRoutes);

/* Legacy path kept temporarily */
app.use('/auth', authRoutes);

/* Startup */
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI is not set.');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`FitMate API running on :${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err?.message || err);
    process.exit(1);
  });
