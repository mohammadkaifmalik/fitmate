import express from "express";
import { z } from "zod";
import auth from "../middleware/auth.js";
import Progress from "../models/Progress.js";

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

export default router;
