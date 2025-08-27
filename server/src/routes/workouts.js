import express from "express";
import auth from "../middleware/auth.js";
import Workout from "../models/Workout.js";

const router = express.Router();

// GET /api/workouts?from=ISO&to=ISO  (defaults: today .. +7d)
router.get("/", auth, async (req, res) => {
  const from = req.query.from ? new Date(req.query.from) : new Date();
  const to = req.query.to ? new Date(req.query.to) : new Date(Date.now() + 7 * 86400000);
  const workouts = await Workout
    .find({ userId: req.user.sub, scheduledAt: { $gte: from, $lte: to } })
    .sort({ scheduledAt: 1 })
    .select("title type durationMin scheduledAt");
  res.json({ workouts });
});

export default router;
