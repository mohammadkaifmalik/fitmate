import React from "react";
import Card from "../components/Card";
import BackToDashboard from "../components/BackToDashboard";
import { api } from "../lib/api";

export default function MealPlan() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        const from = new Date().toISOString();
        const to = new Date(Date.now() + 7 * 86400000).toISOString();
        const res = await api.get("/meals", { params: { from, to } });
        setItems(res.data.meals || []);
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
      <h2 className="text-2xl font-semibold">Meal Plan</h2>

      <Card>
        {loading ? (
          <div className="py-8 text-slate-600">Loading…</div>
        ) : err ? (
          <div className="py-8 text-red-600 text-sm">{err}</div>
        ) : items.length === 0 ? (
          <div className="py-8 text-slate-600 text-sm">No meals for the next 7 days.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[520px]">
              <thead>
                <tr className="text-sm text-slate-600">
                  <th className="py-2">When</th>
                  <th>Meal</th>
                  <th>Calories</th>
                </tr>
              </thead>
              <tbody className="[&_tr]:border-t">
                {items.map((m) => {
                  const dt = new Date(m.eatenAt);
                  const when = dt.toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" });
                  return (
                    <tr key={m._id}>
                      <td className="py-2">{when}</td>
                      <td className="font-medium">{m.name}</td>
                      <td>{m.calories}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
