import { api } from "../lib/api";

// GET /api/profile
export async function getProfile() {
  const res = await api.get("/profile", {
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  });
  return res.data; // { profile, caloriesTarget }
}

// POST /api/profile  (expects the full profile payload)
export async function saveFullProfile(payload) {
  const res = await api.post("/profile", payload);
  return res.data; 
}

// PATCH /api/profile/goal
export async function updateGoal(payload) {
  const res = await api.patch("/profile/goal", payload);
  return res.data; // { user, preview, needsRegen }
}

// POST /api/profile/generate
export async function generatePlan() {
  const res = await api.post("/profile/generate");
  if (!res.data?.ok) throw new Error(res.data?.error || "Failed to generate plan");
  return res.data; // { ok:true, via:"groq", mealsCreated, workoutsCreated }
}
