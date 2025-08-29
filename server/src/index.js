import 'dotenv/config';
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.js";
import workoutRoutes from "./routes/workouts.js";
import mealRoutes from "./routes/meals.js";
import progressRoutes from "./routes/progress.js";
import profileRoutes from "./routes/profile.js";
import debugRoutes from "./routes/debug.js";
import planRoutes from "./routes/plan.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.get("/", (_, res) => res.json({ ok: true, service: "fitmate-api" }));

app.use("/api/auth", authRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/debug", debugRoutes);
app.use("/api/plan", planRoutes);



const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`FitMate API running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
