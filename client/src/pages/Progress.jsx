import React, { useCallback, useEffect, useState } from "react";
import Card from "../components/Card";
import { api } from "../lib/api";
import ProgressUpdatePanel from "../components/ProgressUpdatePanel";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

function fmt(d) {
  const dt = new Date(d);
  return dt.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function Progress() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [err, setErr] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([
        api.get("/progress/weights", { params: { days: 90 } }),
        api.get("/progress/summary"),
      ]);
      setLogs(a.data.logs || []);
      setSummary(b.data || null);
      setErr("");
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div className="space-y-6">
      {/* NEW: Update panel */}
      <Card title="Update">
        <ProgressUpdatePanel onRefreshAll={fetchAll} />
      </Card>

      <Card title="Weight Trend (90 days)">
        {err ? (
          <div className="py-8 text-sm text-red-600">{err}</div>
        ) : logs.length === 0 ? (
          <div className="py-8 text-sm text-slate-600">
            No weight entries yet. Update your goal with your current weight to get started.
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={logs.map((l) => ({ ...l, label: fmt(l.date) }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="weightKg" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card title="Summary">
        {summary ? (
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-slate-600">Start</div>
              <div className="text-lg font-semibold">{summary.startWeightKg ?? "—"} kg</div>
            </div>
            <div>
              <div className="text-slate-600">Latest</div>
              <div className="text-lg font-semibold">{summary.latestWeightKg ?? "—"} kg</div>
            </div>
            <div>
              <div className="text-slate-600">Change</div>
              <div className="text-lg font-semibold">{summary.deltaKg ?? 0} kg</div>
            </div>
            <div>
              <div className="text-slate-600">BMI</div>
              <div className="text-lg font-semibold">
                {summary.bmi ?? "—"} ({summary.bmiCategory ?? "—"})
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 text-slate-600 text-sm">Loading…</div>
        )}
      </Card>
    </div>
  );
}
