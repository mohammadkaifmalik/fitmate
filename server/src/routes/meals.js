import express from "express";
import auth from "../middleware/auth.js";
import Meal from "../models/Meal.js";
import { ensureFuturePlan } from "../lib/ensureFuturePlan.js";

const router = express.Router();

/**
 * GET /api/meals?from=ISO&to=ISO
 * Default range: yesterday .. +14d
 * Ensures the user always has at least the next 7 days planned.
 */
router.get("/", auth, async (req, res) => {
  await ensureFuturePlan({ userId: req.user.sub });

  const from = req.query.from ? new Date(req.query.from) : new Date();
  from.setDate(from.getDate() - 1); // include yesterday
  const to = req.query.to ? new Date(req.query.to) : new Date(Date.now() + 14 * 86400000);

  const meals = await Meal
    .find({ userId: req.user.sub, eatenAt: { $gte: from, $lte: to } })
    .sort({ eatenAt: 1 })
    .select("name description calories eatenAt consumed consumedAt");

  res.json({ meals });
});

/**
 * PATCH /api/meals/:id/consumed
 * Body: { consumed: true|false }
 */
router.patch("/:id/consumed", auth, async (req, res) => {
  const meal = await Meal.findOne({ _id: req.params.id, userId: req.user.sub });
  if (!meal) return res.status(404).json({ error: "Meal not found" });

  const next = !!req.body.consumed;
  meal.consumed = next;
  meal.consumedAt = next ? new Date() : undefined;
  await meal.save();

  res.json({
    ok: true,
    meal: {
      id: meal.id,
      name: meal.name,
      consumed: meal.consumed,
      consumedAt: meal.consumedAt,
    }
  });
});

export default router;
