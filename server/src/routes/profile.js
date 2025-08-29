// server/src/routes/profile.js
import express from "express";
import { z } from "zod";
import auth from "../middleware/auth.js";
import User from "../models/User.js";
import Meal from "../models/Meal.js";
import Workout from "../models/Workout.js";
import WeightLog from "../models/WeightLog.js";
import Groq from "groq-sdk";

const router = express.Router();

/* ------------------------- Schemas ------------------------- */
const profileSchema = z.object({
  gender: z.enum(["Male", "Female", "Other"]),
  heightCm: z.number().positive(),
  weightKg: z.number().positive(),
  goal: z.enum(["lose", "gain", "maintain"]),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "athlete"]),
  preferences: z.array(z.string()).optional().default([]),
  allergies: z.array(z.string()).optional().default([]),
});

const goalSchema = z.object({
  goal: z.enum(["lose", "gain", "maintain"]),
  regenerate: z.boolean().optional().default(false),
});

/* ------------------------- Helpers ------------------------- */
function bmiAndCategory(heightCm, weightKg) {
  const h = (heightCm || 0) / 100;
  const bmi = h > 0 ? +(weightKg / (h * h)).toFixed(1) : 0;
  let cat = "Normal";
  if (bmi < 18.5) cat = "Underweight";
  else if (bmi >= 25 && bmi < 30) cat = "Overweight";
  else if (bmi >= 30) cat = "Obese";
  return { bmi, cat };
}

function calcCaloriesTarget({ gender, heightCm, weightKg, activityLevel, goal, bmiCategory }) {
  const factor = { sedentary:1.2, light:1.375, moderate:1.55, active:1.725, athlete:1.9 }[activityLevel];
  const bmr = gender === "Male"
    ? 10*weightKg + 6.25*heightCm - 5*25 + 5
    : 10*weightKg + 6.25*heightCm - 5*25 - 161;

  let target = Math.round(bmr * factor);
  if (goal === "lose") target -= (bmiCategory === "Overweight" || bmiCategory === "Obese") ? 500 : 300;
  if (goal === "gain") target += (bmiCategory === "Underweight") ? 400 : 250;
  return target;
}

/* ------------------------- Groq client (lazy) ------------------------- */
let _groq;
function getGroq() {
  if (_groq) return _groq;
  const key = (process.env.GROQ_API_KEY || "").trim();
  if (!key) {
    // Make this crystal clear in logs and response
    throw new Error("GROQ_API_KEY is missing. Add it to server/.env and ensure dotenv is loaded in src/index.js");
  }
  _groq = new Groq({ apiKey: key });
  return _groq;
}

/* ------------------------- Routes ------------------------- */

// Get current profile
router.get("/", auth, async (req, res) => {
  const user = await User.findById(req.user.sub).select("profile caloriesTarget");
  res.json({ profile: user?.profile, caloriesTarget: user?.caloriesTarget });
});

// Save/update full profile (onboarding) & compute BMI + calories
router.post("/", auth, async (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid profile" });

  const data = parsed.data;
  const { bmi, cat } = bmiAndCategory(data.heightCm, data.weightKg);
  const target = calcCaloriesTarget({
    gender: data.gender,
    heightCm: data.heightCm,
    weightKg: data.weightKg,
    activityLevel: data.activityLevel,
    goal: data.goal,
    bmiCategory: cat,
  });

  const user = await User.findByIdAndUpdate(
    req.user.sub,
    { $set: { profile: { ...data, isComplete: true, bmi, bmiCategory: cat }, caloriesTarget: target } },
    { new: true, projection: "name email caloriesTarget profile" }
  );

  res.json({ user });
});

/* ------------------------- Generate weekly plan (Groq) ------------------------- */
// Replaces the old HuggingFace-based route
router.post("/generate", auth, async (req, res) => {
  const user = await User.findById(req.user.sub).select("name email caloriesTarget profile");
  if (!user?.profile?.isComplete) return res.status(400).json({ error: "Complete profile first" });

  // Helper to insert the returned plan into DB
  async function insertPlan(plan) {
    const now = new Date();
    const end = new Date(now); end.setDate(end.getDate() + 7);

    await Meal.deleteMany({ userId: user.id, eatenAt: { $gte: now, $lte: end } });
    await Workout.deleteMany({ userId: user.id, scheduledAt: { $gte: now, $lte: end } });

    const mealsToCreate = (plan.meals || []).slice(0, 28).map((m) => {
      const d = new Date(now); d.setDate(d.getDate() + (m.dayOffset || 0));
      const [h, min] = String(m.time || "08:00").split(":").map((n) => parseInt(n));
      d.setHours(h || 8, min || 0, 0, 0);
      return {
        userId: user.id,
        name: String(m.name || "Meal"),
        calories: Math.max(0, Math.round(Number(m.calories) || 0)),
        eatenAt: d
      };
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
    return { mealsCreated: insertedMeals.length, workoutsCreated: insertedWorkouts.length };
  }

  // Build a **simple** schema prompt so it matches your existing DB logic
  const prompt = `
You are a fitness & nutrition coach. Create a concise one-week plan.

Return VALID JSON ONLY with this exact schema:
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

Rules:
- Provide 5–7 workouts over the week (mix types; durations 20–60 min).
- Provide ~3–4 meals per day for 7 days (keep near target calories overall).
- Use dayOffset 0..6 (0=Today).
- Use 24h times like "07:00" / "19:30".
- Respect preferences/allergies; keep meals simple/affordable.
`.trim();

  try {
    const groq = getGroq();
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.3,
      messages: [
        { role: "system", content: "You are Fitmate’s planning engine. Output STRICT JSON only." },
        { role: "user", content: prompt }
      ]
    });

    const content = completion.choices?.[0]?.message?.content || "{}";
    let plan;
    try {
      plan = JSON.parse(content);
    } catch {
      // As a fallback, extract the first JSON object if any wrapping happened
      const match = content.match(/\{[\s\S]*\}/);
      plan = JSON.parse(match ? match[0] : "{}");
    }

    if (!Array.isArray(plan.meals) || !Array.isArray(plan.workouts)) {
      return res.status(422).json({ error: "Model output invalid", detail: "Missing 'meals' or 'workouts' arrays" });
    }

    const totals = await insertPlan(plan);
    return res.json({ ok: true, via: "groq", ...totals });
  } catch (e) {
    console.error("Generate (groq) error:", e.stack || e.message);
    if (String(e.message || "").includes("GROQ_API_KEY")) {
      return res.status(500).json({ error: "GROQ_API_KEY missing", detail: "Add GROQ_API_KEY to server/.env and ensure dotenv is loaded (import 'dotenv/config') in src/index.js" });
    }
    return res.status(500).json({ error: "Failed to generate plan", detail: e.message });
  }
});

// Update goal + (optional) weight; recompute BMI & calories; log weight
router.patch("/goal", auth, async (req, res) => {
  const parsed = goalSchema.extend({
    currentWeightKg: z.number().positive().optional(),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const { goal, regenerate, currentWeightKg } = parsed.data;

  const u = await User.findById(req.user.sub).select("profile caloriesTarget");
  if (!u?.profile?.isComplete) return res.status(400).json({ error: "Complete profile first" });

  const heightCm = u.profile.heightCm;
  const weightNow = currentWeightKg ?? u.profile.weightKg;

  const { bmi, cat } = bmiAndCategory(heightCm, weightNow);
  const target = calcCaloriesTarget({
    gender: u.profile.gender,
    heightCm,
    weightKg: weightNow,
    activityLevel: u.profile.activityLevel,
    goal,
    bmiCategory: cat,
  });

  const updated = await User.findByIdAndUpdate(
    req.user.sub,
    {
      $set: {
        "profile.goal": goal,
        "profile.weightKg": weightNow,
        "profile.bmi": bmi,
        "profile.bmiCategory": cat,
        caloriesTarget: target,
      },
    },
    { new: true, projection: "name email caloriesTarget profile" }
  );

  if (!updated) return res.status(404).json({ error: "User not found" });

  if (typeof currentWeightKg === "number") {
    await WeightLog.create({ userId: updated._id, weightKg: weightNow, bmi, bmiCategory: cat });
  }

  res.json({ user: updated, preview: { bmi, bmiCategory: cat, caloriesTarget: target }, needsRegen: regenerate === true });
});

export default router;
