import express from "express";
import { z } from "zod";
import auth from "../middleware/auth.js";
import { generatePlanWithGroq } from "../services/aiPlan.js";

const router = express.Router();

const planInputSchema = z.object({
  gender: z.enum(["Male", "Female", "Other"]),
  heightCm: z.number().positive(),
  weightKg: z.number().positive(),
  goal: z.enum(["lose", "gain", "maintain"]),
  activityLevel: z.enum(["sedentary","light","moderate","active","athlete"]),
  preferences: z.array(z.string()).optional().default([])
});

router.post("/generate-plan", auth, async (req, res) => {
  try {
    const input = planInputSchema.parse(req.body);
    const plan = await generatePlanWithGroq(input);
    return res.json({ ok: true, plan });
  } catch (err) {
    console.error("Plan error:", err);
    return res.status(400).json({ ok: false, error: err.message });
  }
});

export default router;
