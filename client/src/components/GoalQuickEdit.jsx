import React from "react";
import Card from "./Card";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function GoalQuickEdit() {
  const { user, setUser } = useAuth();
  const [goal, setGoal] = React.useState(user?.profile?.goal || "maintain");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  async function save(nextGoal, regen = false) {
    setBusy(true);
    setMsg("Updating goal…");
    try {
      const r = await api.patch("/profile/goal", { goal: nextGoal, regenerate: regen });
      setUser(r.data.user); // update in-memory user so UI reflects new target immediately
      setMsg(regen ? "Goal updated. Regenerating plan…" : "Goal updated.");
      if (regen) {
        await api.post("/profile/generate");
        setMsg("Plan regenerated.");
      }
    } catch (e) {
      console.error(e);
      setMsg(e?.response?.data?.error || e.message || "Failed to update goal");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(""), 2000);
    }
  }

  const buttons = [
    { key: "lose", label: "Lose weight" },
    { key: "maintain", label: "Maintain" },
    { key: "gain", label: "Gain weight" },
  ];

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-sm text-slate-600">Current goal</div>
          <div className="text-lg font-semibold capitalize">{user?.profile?.goal || "—"}</div>
          <div className="text-xs text-slate-500">Daily target: {user?.caloriesTarget || 0} kcal</div>
        </div>

        <div className="flex gap-2">
          {buttons.map(b => (
            <button
              key={b.key}
              type="button"
              onClick={() => setGoal(b.key)}
              className={`px-3 py-2 rounded-xl border ${
                goal === b.key ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200"
              }`}
              disabled={busy}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => save(goal, false)}
            disabled={busy}
            className="px-3 py-2 rounded-xl bg-slate-900 text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => save(goal, true)}
            disabled={busy}
            className="px-3 py-2 rounded-xl border border-slate-300 disabled:opacity-60"
            title="Update goal and regenerate this week's plan"
          >
            {busy ? "Working…" : "Save + Regenerate Plan"}
          </button>
        </div>
      </div>

      {msg && <div className="mt-2 text-sm text-slate-600">{msg}</div>}
    </Card>
  );
}
