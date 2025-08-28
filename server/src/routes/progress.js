import express from "express";
import { z } from "zod";
import auth from "../middleware/auth.js";
import Progress from "../models/Progress.js";
import WeightLog from "../models/WeightLog.js";

const router = express.Router();

const progressSchema = z.object({
  date: z.string().datetime(),
  weightKg: z.number().nonnegative().optional(),
  steps: z.number().int().nonnegative().optional(),
  caloriesBurned: z.number().int().nonnegative().optional()
});

router.get("/", auth, async (req, res) => {
  const items = await Progress.find({ userId: req.user.sub }).sort({ date: 1 });
  res.json(items);
});

router.post("/", auth, async (req, res) => {
  const parse = progressSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid body" });
  const item = await Progress.create({ ...parse.data, userId: req.user.sub });
  res.status(201).json(item);
});

router.get("/weights", auth, async (req, res) => {
  const days = Math.max(1, Math.min(365, parseInt(req.query.days || "60")));
  const from = new Date(Date.now() - days * 86400000);
  const logs = await WeightLog.find({ userId: req.user.sub, date: { $gte: from } })
    .sort({ date: 1 })
    .select("date weightKg bmi bmiCategory");
  res.json({ logs });
});

// GET /api/progress/summary
router.get("/summary", auth, async (req, res) => {
  const logs = await WeightLog.find({ userId: req.user.sub }).sort({ date: 1 }).limit(500);
  const start = logs[0];
  const latest = logs[logs.length - 1];
  const delta = (start && latest) ? +(latest.weightKg - start.weightKg).toFixed(1) : 0;
  res.json({
    startWeightKg: start?.weightKg ?? null,
    latestWeightKg: latest?.weightKg ?? null,
    deltaKg: delta,
    lastUpdate: latest?.date ?? null,
    bmi: latest?.bmi ?? null,
    bmiCategory: latest?.bmiCategory ?? null
  });
});

export default router;
