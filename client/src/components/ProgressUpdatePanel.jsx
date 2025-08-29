// client/src/components/ProgressUpdatePanel.jsx
import { useEffect, useMemo, useState } from "react";
import { getProfile, saveFullProfile, updateGoal, generatePlan } from "../api/profile";

const BUTTONS = ["Goal", "Weight", "Activity Level", "Dietary Preference", "Allergies"];

export default function ProgressUpdatePanel({ onRefreshAll }) {
  const [open, setOpen] = useState("Goal");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(null);
  const [err, setErr] = useState("");

  const [profile, setProfile] = useState(null);
  const [goal, setGoal] = useState("maintain");
  const [newWeight, setNewWeight] = useState("");
  const [activity, setActivity] = useState("moderate");
  const [prefs, setPrefs] = useState("");
  const [allergies, setAllergies] = useState("");

  useEffect(() => {
    setLoading(true);
    getProfile()
      .then((data) => {
        const p = data?.profile;
        if (p) {
          setProfile(p);
          setGoal(p.goal || "maintain");
          setActivity(p.activityLevel || "moderate");
          setNewWeight(p.weightKg ?? "");
          setPrefs((p.preferences || []).join(", "));
          setAllergies((p.allergies || []).join(", "));
        }
      })
      .catch((e) => setErr(e.message || "Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const pills = useMemo(
    () =>
      BUTTONS.map((b) => (
        <button
          key={b}
          onClick={() => setOpen((curr) => (curr === b ? null : b))}
          className={`px-3 py-1.5 rounded-full border text-sm transition
            ${open === b ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-slate-50 border-slate-300"}
          `}
        >
          {b}
        </button>
      )),
    [open]
  );

  async function regenAfterSave() {
    await generatePlan();
    onRefreshAll && onRefreshAll();
  }

  async function saveGoalClick() {
    if (!profile) return;
    setSaving("Goal"); setErr("");
    try {
      await updateGoal({
        goal,
        regenerate: true,
        currentWeightKg: typeof newWeight === "number" ? newWeight : undefined,
      });
      await regenAfterSave();
    } catch (e) {
      setErr(e.message || "Failed to update goal");
    } finally { setSaving(null); }
  }

  async function saveWeightOnly() {
    if (!profile) return;
    if (newWeight === "" || Number(newWeight) <= 0) { setErr("Enter a valid weight (kg)"); return; }
    setSaving("Weight"); setErr("");
    try {
      await updateGoal({ goal: profile.goal, regenerate: true, currentWeightKg: Number(newWeight) });
      await regenAfterSave();
    } catch (e) {
      setErr(e.message || "Failed to update weight");
    } finally { setSaving(null); }
  }

  async function saveActivity() {
    if (!profile) return;
    setSaving("Activity Level"); setErr("");
    try {
      const payload = { ...profile, activityLevel: activity };
      await saveFullProfile(payload); // POST /profile expects the full profile shape
      await regenAfterSave();
      setProfile((p) => (p ? { ...p, activityLevel: activity } : p));
    } catch (e) {
      setErr(e.message || "Failed to update activity level");
    } finally { setSaving(null); }
  }

  async function savePrefs() {
    if (!profile) return;
    setSaving("Dietary Preference"); setErr("");
    try {
      const list = prefs.split(",").map((s) => s.trim()).filter(Boolean);
      const payload = { ...profile, preferences: list };
      await saveFullProfile(payload);
      await regenAfterSave();
      setProfile((p) => (p ? { ...p, preferences: list } : p));
    } catch (e) {
      setErr(e.message || "Failed to update dietary preferences");
    } finally { setSaving(null); }
  }

  async function saveAllergies() {
    if (!profile) return;
    setSaving("Allergies"); setErr("");
    try {
      const list = allergies.split(",").map((s) => s.trim()).filter(Boolean);
      const payload = { ...profile, allergies: list };
      await saveFullProfile(payload);
      await regenAfterSave();
      setProfile((p) => (p ? { ...p, allergies: list } : p));
    } catch (e) {
      setErr(e.message || "Failed to update allergies");
    } finally { setSaving(null); }
  }

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Update</h2>
        {loading && <span className="text-sm text-slate-500">Loading profile…</span>}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">{pills}</div>

      {err && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      {/* Goal */}
      {open === "Goal" && profile && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 mb-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Goal</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="lose">Lose</option>
                <option value="maintain">Maintain</option>
                <option value="gain">Gain</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Current Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              <p className="text-xs text-slate-500 mt-1">Optional: include latest weight so BMI/TDEE recalculates.</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={saveGoalClick}
              disabled={!!saving}
              className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-60"
            >
              {saving === "Goal" ? "Saving…" : "Save & Regenerate Plan"}
            </button>
          </div>
        </div>
      )}

      {/* Weight */}
      {open === "Weight" && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 mb-3">
          <label className="block text-sm font-medium mb-1">New Weight (kg)</label>
          <input
            type="number"
            step="0.1"
            min="1"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2"
          />
          <div className="mt-4">
            <button
              onClick={saveWeightOnly}
              disabled={!!saving}
              className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-60"
            >
              {saving === "Weight" ? "Saving…" : "Save & Regenerate Plan"}
            </button>
          </div>
        </div>
      )}

      {/* Activity Level */}
      {open === "Activity Level" && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 mb-3">
          <label className="block text-sm font-medium mb-1">Activity Level</label>
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="sedentary">Sedentary</option>
            <option value="light">Light</option>
            <option value="moderate">Moderate</option>
            <option value="active">Active</option>
            <option value="athlete">Athlete</option>
          </select>
          <div className="mt-4">
            <button
              onClick={saveActivity}
              disabled={!!saving}
              className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-60"
            >
              {saving === "Activity Level" ? "Saving…" : "Save & Regenerate Plan"}
            </button>
          </div>
        </div>
      )}

      {/* Dietary Preference */}
      {open === "Dietary Preference" && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 mb-3">
          <label className="block text-sm font-medium mb-1">Preferences (comma-separated)</label>
          <input
            type="text"
            placeholder="vegetarian, high-protein, halal"
            value={prefs}
            onChange={(e) => setPrefs(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <div className="mt-4">
            <button
              onClick={savePrefs}
              disabled={!!saving}
              className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-60"
            >
              {saving === "Dietary Preference" ? "Saving…" : "Save & Regenerate Plan"}
            </button>
          </div>
        </div>
      )}

      {/* Allergies */}
      {open === "Allergies" && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <label className="block text-sm font-medium mb-1">Allergies (comma-separated)</label>
          <input
            type="text"
            placeholder="peanut, egg"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <div className="mt-4">
            <button
              onClick={saveAllergies}
              disabled={!!saving}
              className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-60"
            >
              {saving === "Allergies" ? "Saving…" : "Save & Regenerate Plan"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
