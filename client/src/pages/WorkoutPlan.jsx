import React from "react";
import Card from "../components/Card";
import BackToDashboard from "../components/BackToDashboard";
import { api } from "../lib/api";

export default function WorkoutPlan() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        const from = new Date().toISOString();
        const to = new Date(Date.now() + 7 * 86400000).toISOString();
        const res = await api.get("/workouts", { params: { from, to } });
        setItems(res.data.workouts || []);
      } catch (e) {
        setErr(e?.response?.data?.error || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <BackToDashboard />
      <h2 className="text-2xl font-semibold">Workout Plan</h2>

      <Card>
        {loading ? (
          <div className="py-8 text-slate-600">Loading…</div>
        ) : err ? (
          <div className="py-8 text-red-600 text-sm">{err}</div>
        ) : items.length === 0 ? (
          <div className="py-8 text-slate-600 text-sm">No workouts scheduled for the next 7 days.</div>
        ) : (
          <ul className="divide-y">
            {items.map((w) => {
              const dt = new Date(w.scheduledAt);
              const when = dt.toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" });
              return (
                <li key={w._id} className="py-3 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="font-medium">{w.title}</div>
                    <div className="text-sm text-slate-600">
                      {w.type} • {w.durationMin} min
                    </div>
                  </div>
                  <div className="text-sm">{when}</div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
