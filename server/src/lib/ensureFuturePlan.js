import Meal from "../models/Meal.js";
import User from "../models/User.js";
import Groq from "groq-sdk";

let _groq;
function getGroq() {
  if (_groq) return _groq;
  const key = (process.env.GROQ_API_KEY || "").trim();
  _groq = new Groq({ apiKey: key });
  return _groq;
}

export async function ensureFuturePlan({ userId }) {
  const user = await User.findById(userId).select("caloriesTarget profile");
  if (!user?.profile?.isComplete) return;

  const latestMeal = await Meal.findOne({ userId }).sort({ eatenAt: -1 });
  const today = new Date(); today.setHours(0,0,0,0);

  // We want to keep at least next 7 days from today
  const wantedUntil = new Date(today); wantedUntil.setDate(wantedUntil.getDate() + 6);

  const hasEnough = await Meal.exists({
    userId,
    eatenAt: { $gte: today, $lte: wantedUntil }
  });

  if (hasEnough) return;

  // Base is the day after the latest scheduled (or today if none)
  const base = new Date(latestMeal?.eatenAt || today);
  base.setDate(base.getDate() + 1);
  base.setHours(0,0,0,0);

  // Build same prompt as /profile/generate
  const prompt = `
You are a fitness & nutrition coach. Create a concise one-week plan.

Return VALID JSON ONLY with this exact schema:
{
  "workouts": [
    {"title":"...", "type":"Strength|Cardio|Flexibility|Other", "durationMin": 20, "dayOffset": 0, "time":"07:00"}
  ],
  "meals": [
    {"name":"...", "description":"...", "calories": 300, "dayOffset": 0, "time":"08:00"}
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
- Provide 4–6 meals per day for 7 days (use snacks when needed).
- Keep each day’s total within ±8% of the daily target (do not undershoot).
- Each meal MUST include a short "description".
- Use dayOffset 0..6 (0=base day).
- Use 24h times.
- Respect preferences/allergies; keep meals simple and affordable.
`.trim();

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
  const plan = JSON.parse(content);

  // Insert for the next 7 days starting from 'base'
  const mealsToCreate = (plan.meals || []).map((m) => {
    const d = new Date(base); d.setDate(d.getDate() + (m.dayOffset || 0));
    const [h, min] = String(m.time || "08:00").split(":").map((n) => parseInt(n));
    d.setHours(h || 8, min || 0, 0, 0);
    return {
      userId,
      name: String(m.name || "Meal"),
      description: String(m.description || ""),
      calories: Math.max(0, Math.round(Number(m.calories) || 0)),
      eatenAt: d
    };
  });

  if (mealsToCreate.length) await Meal.insertMany(mealsToCreate);
}
