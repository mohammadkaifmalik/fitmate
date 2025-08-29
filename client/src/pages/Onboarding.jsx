// client/src/pages/Onboarding.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";

export default function Onboarding() {
  const { setUser } = useAuth();
  const nav = useNavigate();

  const [form, setForm] = React.useState({
    gender: "Other",
    heightCm: "",
    weightKg: "",
    goal: "maintain",
    activityLevel: "moderate",
    preferences: [],
    allergies: [],
  });
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  function toggleInArray(key, val) {
    setForm((f) => {
      const set = new Set(f[key]);
      set.has(val) ? set.delete(val) : set.add(val);
      return { ...f, [key]: Array.from(set) };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("Saving profile…");
    try {
      // Save profile → server returns updated user with profile.isComplete=true
      const saveRes = await api.post("/profile", {
        ...form,
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
      });
      setUser(saveRes.data.user);

      // Mark as completed (fallback in case /auth/me is slow later)
      localStorage.setItem("fitmate_onboarded", "1");

      // Generate plans (HF or fallback)
      setMsg("Generating your plans with AI… (10–30s)");
      await api.post("/profile/generate");

      setMsg("Done! Redirecting…");
      nav("/", { replace: true });
    } catch (err) {
        const detail = err?.response?.data?.detail;
        const status = err?.response?.status;
        setMsg(
          detail ? detail.slice(0,200) :
          status === 404 ? "HF model not available to your account. Pick a different model (see README)."
          : err?.response?.data?.error || "Generation failed"
        );
      }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h2 className="text-2xl font-semibold">Let’s personalize FitMate</h2>
      <p className="text-slate-600">A few quick questions to tailor your workout & meal plan.</p>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="font-medium">Your goal</label>
            <div className="mt-2 grid grid-cols-3 gap-2 max-sm:grid-cols-1">
              {["lose", "maintain", "gain"].map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setForm((f) => ({ ...f, goal: g }))}
                  className={`px-3 py-2 rounded-xl border ${
                    form.goal === g ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200"
                  }`}
                >
                  {g === "lose" ? "Lose weight" : g === "gain" ? "Gain weight" : "Maintain"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="font-medium">Gender</label>
              <select
                className="mt-2 w-full border rounded-xl px-3 py-2"
                value={form.gender}
                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="font-medium">Height (cm)</label>
              <input
                className="mt-2 w-full border rounded-xl px-3 py-2"
                type="number"
                min="100" max="250"
                value={form.heightCm}
                onChange={(e) => setForm((f) => ({ ...f, heightCm: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="font-medium">Weight (kg)</label>
              <input
                className="mt-2 w-full border rounded-xl px-3 py-2"
                type="number"
                min="30" max="250"
                value={form.weightKg}
                onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label className="font-medium">Activity level</label>
            <select
              className="mt-2 w-full border rounded-xl px-3 py-2"
              value={form.activityLevel}
              onChange={(e) => setForm((f) => ({ ...f, activityLevel: e.target.value }))}
            >
              <option value="sedentary">Sedentary</option>
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="active">Active</option>
              <option value="athlete">Athlete</option>
            </select>
          </div>

          <div>
            <label className="font-medium">Dietary preferences (optional)</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {["vegetarian","vegan","halal","kosher","dairy-free","gluten-free"].map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => toggleInArray("preferences", p)}
                  className={`px-3 py-2 rounded-xl border ${
                    form.preferences.includes(p) ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-medium">Allergies (optional)</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {["peanuts","tree nuts","eggs","fish","shellfish","soy","wheat","lactose"].map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => toggleInArray("allergies", p)}
                  className={`px-3 py-2 rounded-xl border ${
                    form.allergies.includes(p) ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button disabled={busy} className="px-4 py-3 rounded-xl bg-slate-900 text-white disabled:opacity-60">
              {busy ? "Working…" : "Save & Generate Plan"}
            </button>
            <div className="text-sm text-slate-600">{msg}</div>
          </div>
        </form>
      </Card>
    </div>
  );
}
