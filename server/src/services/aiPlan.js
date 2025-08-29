// server/src/services/aiPlan.js
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Generates a structured fitness + diet plan as JSON.
 * input = { gender, heightCm, weightKg, goal, activityLevel, preferences }
 */
export async function generatePlanWithGroq(input) {
  const sys = `
You are Fitmate's planning engine. Output STRICT JSON matching this schema:
{
  "tdee": number, // kcal/day
  "targetCalories": number, // kcal/day
  "macros": {"protein_g": number, "carbs_g": number, "fat_g": number},
  "workout": {
    "split": "full-body|push-pull-legs|upper-lower|beginner",
    "daysPerWeek": number,
    "weeklyPlan": [
      {"day":"Mon","focus":"...", "exercises":[{"name":"...","sets":3,"reps":"8-12"}]}
    ]
  },
  "mealPlan": {
    "notes": ["..."],
    "days":[
      {"day":"Mon","meals":[{"name":"Breakfast","items":[{"food":"...","qty":"...","kcal":...}]}]}
    ]
  },
  "shoppingList": ["..."],
  "disclaimers": ["This is educational, not medical advice."]
}
Use metric units. Consider cultural & dietary preferences if provided.
`;
  const user = `
USER_PROFILE:
${JSON.stringify(input)}

INSTRUCTIONS:
1) Estimate TDEE using Mifflin-St Jeor (assume age 23 if unknown; adjust for activity).
2) Set target calories for goal ("lose": -15%, "gain": +15%, "maintain": 0%).
3) Macros: protein 1.6–2.2 g/kg, fat 0.8–1.0 g/kg, rest carbs.
4) 7-day workout + 7-day meal plan with simple, affordable options.
5) Respect preferences (e.g., vegetarian/no eggs/nut allergy).
6) Keep days balanced; avoid repeating same lunch >2×/week.
`;

  const completion = await groq.chat.completions.create({
    // Fast + high quality; you can swap to 8B for lower latency:
    model: "llama-3.3-70b-versatile",
    response_format: { type: "json_object" }, // JSON mode supported on this model
    messages: [
      { role: "system", content: sys },
      { role: "user", content: user }
    ],
    temperature: 0.3,
  });

  const raw = completion.choices?.[0]?.message?.content || "{}";
  return JSON.parse(raw);
}
