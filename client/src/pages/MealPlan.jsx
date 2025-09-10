// client/src/pages/MealPlan.jsx
import React from "react";
import { api } from "../lib/api";
import Card from "../components/Card";

// ---- Format helpers ----
function dayKey(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}
function fmtDayLabel(d) {
  const x = new Date(d);
  return x.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}
function fmtTime(d) {
  const x = new Date(d);
  const hh = String(x.getHours()).padStart(2, "0");
  const mm = String(x.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function MealPlan() {
  const [meals, setMeals] = React.useState([]);
  const [err, setErr] = React.useState("");

  async function load() {
    try {
      // expects: { meals: [{ _id, name, description, calories, eatenAt, consumed }, ...] }
      const res = await api.get("/meals");
      setMeals(Array.isArray(res.data?.meals) ? res.data.meals : []);
      setErr("");
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    }
  }

  React.useEffect(() => { load(); }, []);

  // Group by calendar day using eatenAt
  const grouped = React.useMemo(() => {
    const g = {};
    for (const m of meals) {
      const key = dayKey(m.eatenAt || m.date || Date.now());
      (g[key] = g[key] || []).push(m);
    }
    Object.values(g).forEach(arr =>
      arr.sort((a, b) => new Date(a.eatenAt) - new Date(b.eatenAt))
    );
    return Object.entries(g)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]));
  }, [meals]);

  // Toggle consumed (checkbox)
  async function toggleConsumed(id, next) {
    try {
      await api.patch(`/meals/${id}/consumed`, { consumed: next });
      // Update local state immediately
      setMeals(ms => ms.map(m => (m._id === id || m.id === id)
        ? { ...m, consumed: next, consumedAt: next ? new Date().toISOString() : null }
        : m
      ));
    } catch (e) {
      alert(e?.response?.data?.error || e.message);
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Meal Plan">
        {err && <div className="text-sm text-red-600">{err}</div>}
        {!err && meals.length === 0 && (
          <div className="py-6 text-sm text-slate-600">
            No meals scheduled. Generate a plan to see your meals here.
          </div>
        )}

        {grouped.map(([key, items]) => {
          const total = items.reduce((s, x) => s + (x.calories || 0), 0);
          return (
            <div key={key} className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">{fmtDayLabel(key)}</h2>
                <div className="text-sm text-slate-600">
                  Planned total: <strong>{total}</strong> kcal
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left">
                      <th className="px-3 py-2 w-20">Taken</th>
                      <th className="px-3 py-2 w-24">Time</th>
                      <th className="px-3 py-2">Meal</th>
                      <th className="px-3 py-2 w-28">Calories</th>
                      <th className="px-3 py-2">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((m) => (
                      <tr key={m._id || m.id} className="border-t">
                        <td className="px-3 py-2 align-top">
                          <input
                            type="checkbox"
                            checked={!!m.consumed}
                            onChange={(e) => toggleConsumed(m._id || m.id, e.target.checked)}
                            aria-label={`Mark ${m.name} as taken`}
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap align-top">
                          {fmtTime(m.eatenAt)}
                        </td>
                        <td className="px-3 py-2 font-medium align-top">{m.name}</td>
                        <td className="px-3 py-2 whitespace-nowrap align-top">{m.calories} kcal</td>
                        <td className="px-3 py-2 text-slate-600">
                          {m.description?.trim?.() || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
