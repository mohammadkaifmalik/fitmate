// server/src/index.js
import 'dotenv/config';
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";

// Routes
import authRoutes from "./routes/auth.js";
import workoutRoutes from "./routes/workouts.js";
import mealRoutes from "./routes/meals.js";
import progressRoutes from "./routes/progress.js";
import profileRoutes from "./routes/profile.js";
import debugRoutes from "./routes/debug.js";
import planRoutes from "./routes/plan.js";

const app = express();

/* ---------- Core middleware ---------- */
app.use(express.json());
app.use(helmet());

// Only verbose logs in dev
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

/* ---------- CORS ---------- */
// Allow your Vercel app + local dev
const allowedOrigins = [
  "https://fitmate-rho.vercel.app/", // TODO: replace with real domain
  "http://localhost:5173"
];

app.use(
  cors({
    origin(origin, cb) {
      // Allow non-browser tools (curl/Postman) with no origin
      if (!origin) return cb(null, true);
      const ok = allowedOrigins.some((o) => o === origin);
      return cb(ok ? null : new Error("Not allowed by CORS"), ok);
    },
    credentials: false, // set to true ONLY if you use cookies for auth
  })
);

/* ---------- Health check ---------- */
app.get("/health", (_req, res) =>
  res.json({ ok: true, service: "fitmate-api", ts: Date.now() })
);

/* ---------- Base route ---------- */
app.get("/", (_req, res) => res.json({ ok: true, service: "fitmate-api" }));

/* ---------- API routes ---------- */
app.use("/api/auth", authRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/debug", debugRoutes);
app.use("/api/plan", planRoutes);

/* ---------- Startup ---------- */
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is not set. Add it in Render → Environment.");
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
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
