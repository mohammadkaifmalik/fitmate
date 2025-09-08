// server/src/routes/progress.js
import express from "express";
import { z } from "zod";
import auth from "../middleware/auth.js";
import WeightLog from "../models/WeightLog.js";
import User from "../models/User.js";

const router = express.Router();

// helper: compute BMI + category
function bmiAndCategory(heightCm, weightKg) {
  const h = (heightCm || 0) / 100;
  const bmi = h > 0 ? +(weightKg / (h * h)).toFixed(1) : 0;
  let cat = "Normal";
  if (bmi < 18.5) cat = "Underweight";
  else if (bmi >= 25 && bmi < 30) cat = "Overweight";
  else if (bmi >= 30) cat = "Obese";
  return { bmi, cat };
}

const upsertSchema = z.object({
  date: z.string().min(8),        // "2025-09-01" or ISO string
  weightKg: z.number().positive(),
});

// ✅ 1) Upsert a weight entry for a specific date
router.post("/weights/upsert", auth, async (req, res) => {
  const parsed = upsertSchema.safeParse({
    date: req.body.date,
    weightKg: Number(req.body.weightKg),
  });
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid date/weight" });
  }

  const { date, weightKg } = parsed.data;

  const day = new Date(date);
  if (isNaN(day.getTime())) return res.status(400).json({ error: "Invalid date" });

  const start = new Date(day); start.setHours(0, 0, 0, 0);
  const end   = new Date(day); end.setHours(23, 59, 59, 999);

  const user = await User.findById(req.user.sub).select("profile.heightCm");
  const heightCm = user?.profile?.heightCm || 0;
  const { bmi, cat } = bmiAndCategory(heightCm, weightKg);

  let doc = await WeightLog.findOne({
    userId: req.user.sub,
    createdAt: { $gte: start, $lte: end },
  });

  if (doc) {
    doc.weightKg = weightKg;
    doc.bmi = bmi;
    doc.bmiCategory = cat;
    await doc.save();
  } else {
    const createdAt = new Date(start); createdAt.setHours(9, 0, 0, 0);
    doc = await WeightLog.create({
      userId: req.user.sub,
      weightKg,
      bmi,
      bmiCategory: cat,
      createdAt,
    });
  }

  return res.json({
    ok: true,
    log: { id: doc._id, date: doc.createdAt, weightKg: doc.weightKg, bmi: doc.bmi, bmiCategory: doc.bmiCategory }
  });
});

// ✅ 2) Get weight logs (e.g. last 90 days)
router.get("/weights", auth, async (req, res) => {
  const days = parseInt(req.query.days || "90", 10);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const logs = await WeightLog.find({
    userId: req.user.sub,
    createdAt: { $gte: since },
  }).sort({ createdAt: 1 });

  res.json({ logs });
});

// ✅ 3) Get summary (start, latest, delta, BMI)
router.get("/summary", auth, async (req, res) => {
  const logs = await WeightLog.find({ userId: req.user.sub }).sort({ createdAt: 1 });
  if (!logs.length) return res.json({});

  const start = logs[0];
  const latest = logs[logs.length - 1];
  const delta = +(latest.weightKg - start.weightKg).toFixed(1);

  res.json({
    startWeightKg: start.weightKg,
    latestWeightKg: latest.weightKg,
    deltaKg: delta,
    bmi: latest.bmi,
    bmiCategory: latest.bmiCategory,
  });
});

export default router;
