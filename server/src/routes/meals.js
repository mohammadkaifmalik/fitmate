import express from "express";
import auth from "../middleware/auth.js";
import Meal from "../models/Meal.js";

const router = express.Router();

// GET /api/meals?from=ISO&to=ISO  (defaults: today .. +7d)
router.get("/", auth, async (req, res) => {
  const from = req.query.from ? new Date(req.query.from) : new Date();
  const to = req.query.to ? new Date(req.query.to) : new Date(Date.now() + 7 * 86400000);
  const meals = await Meal
    .find({ userId: req.user.sub, eatenAt: { $gte: from, $lte: to } })
    .sort({ eatenAt: 1 })
    .select("name calories eatenAt");
  res.json({ meals });
});

export default router;
