// client/src/pages/WorkoutPlan.jsx
import React from "react";
import Card from "../components/Card";
import BackToDashboard from "../components/BackToDashboard";
import { api } from "../lib/api";

function ExerciseList({ exercises = [] }) {
  if (!exercises.length) return null;
  return (
    <ul className="mt-2 space-y-1">
      {exercises
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((ex, i) => (
          <li key={i} className="text-sm leading-6 text-slate-700">
            <span className="font-medium">{ex.name}</span>
            {Number.isFinite(ex.sets) && Number.isFinite(ex.reps) ? (
              <> — {ex.sets} × {ex.reps}</>
            ) : null}
            {Number.isFinite(ex.durationSec) ? (
              <> — {Math.round(ex.durationSec / 60)} min</>
            ) : null}
            {Number.isFinite(ex.restSec) ? <> (Rest {ex.restSec}s)</> : null}
            {ex.notes ? <> — <em className="text-slate-500">{ex.notes}</em></> : null}
          </li>
        ))}
    </ul>
  );
}

export default function WorkoutPlan() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        // show everything from start of today
        const fromDate = new Date();
        fromDate.setHours(0, 0, 0, 0);
        const from = fromDate.toISOString();

        const to = new Date(Date.now() + 7 * 86400000).toISOString();

        // ✅ ask backend to include exercises/goal/notes
        const res = await api.get("/workouts", {
          params: { from, to, expand: "exercises" },
        });

        // console.log("workouts sample", res.data.workouts?.[0]); // debug if needed
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
          <div className="py-8 text-slate-600 text-sm">
            No workouts scheduled for the next 7 days.
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((w) => {
              const dt = new Date(w.scheduledAt);
              const when = dt.toLocaleString([], {
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <li
                  key={w._id}
                  className="py-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{w.title}</div>
                      {w.goal && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                          Goal: {w.goal}
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-slate-600">
                      {w.type} • {w.durationMin} min
                    </div>

                    {/* Exercises */}
                    <ExerciseList exercises={w.exercises} />

                    {/* Optional session notes */}
                    {w.notes && (
                      <p className="mt-2 text-sm text-slate-500">{w.notes}</p>
                    )}
                  </div>

                  <div className="text-sm shrink-0 md:text-right">{when}</div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
