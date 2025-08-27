// server/src/routes/profile.js
import express from "express";
import { z } from "zod";
import auth from "../middleware/auth.js";
import User from "../models/User.js";
import Meal from "../models/Meal.js";
import Workout from "../models/Workout.js";

const router = express.Router();

const profileSchema = z.object({
  gender: z.enum(["Male", "Female", "Other"]),
  heightCm: z.number().positive(),
  weightKg: z.number().positive(),
  goal: z.enum(["lose", "gain", "maintain"]),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "athlete"]),
  preferences: z.array(z.string()).optional().default([]),
  allergies: z.array(z.string()).optional().default([]),
});

// Get current profile
router.get("/", auth, async (req, res) => {
  const user = await User.findById(req.user.sub).select("profile caloriesTarget");
  res.json({ profile: user?.profile, caloriesTarget: user?.caloriesTarget });
});

// Save/update profile & compute calories target
router.post("/", auth, async (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid profile" });

  const { gender, heightCm, weightKg, activityLevel, goal } = parsed.data;
  const activityFactor = { sedentary:1.2, light:1.375, moderate:1.55, active:1.725, athlete:1.9 }[activityLevel];
  const bmr = gender === "Male"
    ? 10 * weightKg + 6.25 * heightCm - 5 * 25 + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * 25 - 161;
  let target = Math.round(bmr * activityFactor);
  if (goal === "lose") target -= 400;
  if (goal === "gain") target += 300;

  const user = await User.findByIdAndUpdate(
    req.user.sub,
    { $set: { profile: { ...parsed.data, isComplete: true }, caloriesTarget: target } },
    { new: true, projection: "name email caloriesTarget profile" }
  );

  res.json({ user });
});

// Generate plans via Hugging Face (with optional fallback)
router.post("/generate", auth, async (req, res) => {
  const user = await User.findById(req.user.sub).select("name email caloriesTarget profile");
  if (!user?.profile?.isComplete) return res.status(400).json({ error: "Complete profile first" });

  const model = (process.env.HUGGINGFACE_MODEL || "").trim();
  const key = (process.env.HUGGINGFACE_API_KEY || "").trim();
  const useFallback = process.env.HUGGINGFACE_FALLBACK === "1" || req.query.debug === "1";

  function makeFallbackPlan() {
    const workouts = [];
    const meals = [];
    const types = ["Strength", "Cardio", "Flexibility"];
    for (let d = 0; d < 7; d++) {
      workouts.push({
        title: d % 2 === 0 ? "Full Body Circuit" : "Run/Walk",
        type: types[d % types.length],
        durationMin: d % 2 === 0 ? 45 : 30,
        dayOffset: d,
        time: "07:00",
      });
      meals.push({ name: "Oats & Berries", calories: 380, dayOffset: d, time: "08:00" });
      meals.push({ name: "Chicken/Tofu Salad", calories: 520, dayOffset: d, time: "13:00" });
      meals.push({ name: "Greek Yogurt / Fruit", calories: 200, dayOffset: d, time: "16:00" });
      meals.push({ name: "Fish/Paneer + Veg", calories: 600, dayOffset: d, time: "20:00" });
    }
    return { workouts, meals };
  }

  async function insertPlan(plan) {
    const now = new Date();
    const end = new Date(now); end.setDate(end.getDate() + 7);

    await Meal.deleteMany({ userId: user.id, eatenAt: { $gte: now, $lte: end } });
    await Workout.deleteMany({ userId: user.id, scheduledAt: { $gte: now, $lte: end } });

    const mealsToCreate = (plan.meals || []).slice(0, 28).map((m) => {
      const d = new Date(now); d.setDate(d.getDate() + (m.dayOffset || 0));
      const [h, min] = String(m.time || "08:00").split(":").map((n) => parseInt(n));
      d.setHours(h || 8, min || 0, 0, 0);
      return { userId: user.id, name: String(m.name || "Meal"), calories: Math.max(0, Math.round(Number(m.calories) || 0)), eatenAt: d };
    });

    const workoutsToCreate = (plan.workouts || []).slice(0, 14).map((w) => {
      const d = new Date(now); d.setDate(d.getDate() + (w.dayOffset || 0));
      const [h, min] = String(w.time || "07:00").split(":").map((n) => parseInt(n));
      d.setHours(h || 7, min || 0, 0, 0);
      const type = ["Strength","Cardio","Flexibility","Other"].includes(w.type) ? w.type : "Other";
      const duration = Math.max(10, Math.min(120, parseInt(w.durationMin) || 45));
      return { userId: user.id, title: String(w.title || "Workout"), durationMin: duration, type, scheduledAt: d };
    });

    const insertedMeals = mealsToCreate.length ? await Meal.insertMany(mealsToCreate) : [];
    const insertedWorkouts = workoutsToCreate.length ? await Workout.insertMany(workoutsToCreate) : [];
    return { mealsCreated: insertedMeals.length, workoutsCreated: insertedWorkouts.length, preview: { firstMeal: insertedMeals[0], firstWorkout: insertedWorkouts[0] } };
  }

  if (useFallback) {
    const plan = makeFallbackPlan();
    const totals = await insertPlan(plan);
    return res.json({ ok: true, via: "fallback", ...totals });
  }

  if (!key) return res.status(500).json({ error: "HUGGINGFACE_API_KEY is not set" });
  if (!model) return res.status(500).json({ error: "HUGGINGFACE_MODEL is not set" });

  const prompt = `
You are a fitness & nutrition coach. Create a concise JSON plan for one week.
Output VALID JSON ONLY with this schema:
{
  "workouts": [
    {"title":"...", "type":"Strength|Cardio|Flexibility|Other", "durationMin": 20, "dayOffset": 0, "time":"07:00"}
  ],
  "meals": [
    {"name":"...", "calories": 300, "dayOffset": 0, "time":"08:00"}
  ]
}
User:
- Gender: ${user.profile.gender}
- Height(cm): ${user.profile.heightCm}
- Weight(kg): ${user.profile.weightKg}
- Goal: ${user.profile.goal}
- Activity: ${user.profile.activityLevel}
- Preferences: ${user.profile.preferences?.join(", ") || "none"}
- Allergies: ${user.profile.allergies?.join(", ") || "none"}
Daily calories target: ${user.caloriesTarget}
Keep daily calories near target. Provide 5–7 workouts and ~3–4 meals per day for 7 days.
  `.trim();

  const url = `https://api-inference.huggingface.co/models/${encodeURIComponent(model)}`;
  const payload = { inputs: prompt, parameters: { max_new_tokens: 1100, temperature: 0.7, return_full_text: false } };

  async function callHF() {
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await r.text();
    return { ok: r.ok, status: r.status, text };
  }

  try {
    let { ok, status, text } = await callHF();
    if (status === 503 && /loading/i.test(text)) {
      await new Promise(r => setTimeout(r, 6000));
      ({ ok, status, text } = await callHF());
    }

    if (!ok) {
      console.error("HF error:", status, text.slice(0, 800));
      if (process.env.HUGGINGFACE_FALLBACK === "1") {
        const plan = makeFallbackPlan();
        const totals = await insertPlan(plan);
        return res.json({ ok: true, via: "fallback_after_error", hfStatus: status, ...totals });
      }
      return res.status(502).json({ error: "HF request failed", status, detail: text.slice(0, 2000) });
    }

    let jsonStr;
    try {
      const maybe = JSON.parse(text);
      jsonStr = Array.isArray(maybe) && maybe[0]?.generated_text ? maybe[0].generated_text : (maybe.generated_text || text);
    } catch {
      jsonStr = text;
    }

    const match = jsonStr.match(/\{[\s\S]*\}/);
    const plan = JSON.parse(match ? match[0] : jsonStr);

    if (!Array.isArray(plan.meals) || !Array.isArray(plan.workouts)) {
      throw new Error("Model output missing 'meals' or 'workouts' arrays.");
    }

    const totals = await insertPlan(plan);
    return res.json({ ok: true, via: "huggingface", ...totals });
  } catch (e) {
    console.error("Generate error:", e.stack || e.message);
    if (process.env.HUGGINGFACE_FALLBACK === "1") {
      const plan = makeFallbackPlan();
      const totals = await insertPlan(plan);
      return res.json({ ok: true, via: "fallback_after_exception", error: e.message, ...totals });
    }
    return res.status(500).json({ error: "Failed to generate plan", detail: e.message });
  }
});

export default router;
