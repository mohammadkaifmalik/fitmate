// client/src/pages/Progress.jsx
import React, { useCallback, useEffect, useState } from "react";
import Card from "../components/Card";
import { api } from "../lib/api";
import { upsertWeight } from "../api/progress";
import ProgressUpdatePanel from "../components/ProgressUpdatePanel";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

function fmt(d) {
  const dt = new Date(d);
  return dt.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function Progress() {
  // weights
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);

  // calories (daily intake from consumed meals)
  const [calLogs, setCalLogs] = useState([]);

  // errors
  const [loadErr, setLoadErr] = useState("");
  const [saveErr, setSaveErr] = useState("");

  // back-dated entry
  const [entryDate, setEntryDate] = useState(() =>
    new Date().toISOString().slice(0, 10) // yyyy-mm-dd
  );
  const [entryWeight, setEntryWeight] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      const [a, b, c] = await Promise.all([
        api.get("/progress/weights", { params: { days: 90 } }),
        api.get("/progress/summary"),
        api.get("/progress/calories", { params: { days: 90 } }),
      ]);
      setLogs(a.data.logs || []);
      setSummary(b.data || null);
      setCalLogs(c.data.logs || []);
      setLoadErr("");
    } catch (e) {
      setLoadErr(e?.response?.data?.error || e.message);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function handleSavePast() {
    if (!entryDate || !entryWeight || Number(entryWeight) <= 0) {
      setSaveErr("Enter a valid date and weight (kg).");
      return;
    }
    try {
      await upsertWeight({ date: entryDate, weightKg: Number(entryWeight) });
      setSaveErr("");
      await fetchAll();
    } catch (e) {
      setSaveErr(e?.response?.data?.error || e.message || "Failed to save past entry");
    }
  }

  // ----- Chart data (merge weight + calories on the same X axis) -----
  const weightSeries = logs.map((l) => {
    const date = l.createdAt || l.date; // server may return either
    return { date, label: fmt(date), weightKg: l.weightKg };
  });

  const calSeries = calLogs.map((l) => {
    const date = l.date || l.day || l.createdAt || l.eatenAt; // be lenient
    return { date, label: fmt(date), calories: l.calories };
  });

  // merge by label (day)
  const merged = [...weightSeries];
  for (const c of calSeries) {
    const idx = merged.findIndex((m) => m.label === c.label);
    if (idx >= 0) merged[idx].calories = c.calories;
    else merged.push(c);
  }
  merged.sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="space-y-6">
      {/* Update panel */}
      <Card title="Update">
        <ProgressUpdatePanel onRefreshAll={fetchAll} />
      </Card>

      {/* Back-date a weight entry */}
      <Card title="Add/Update Past Weight">
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              min="1"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={entryWeight}
              onChange={(e) => setEntryWeight(e.target.value)}
              placeholder="e.g. 72.5"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSavePast}
              className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
        {saveErr && <div className="text-sm text-red-600 mt-2">{saveErr}</div>}
        <p className="text-xs text-slate-500 mt-2">
          This will create or update your entry for the selected day (one entry per day).
        </p>
      </Card>

      {/* Chart */}
      <Card title="Weight Trend (90 days) + Daily Calorie Intake">
        {loadErr ? (
          <div className="py-8 text-sm text-red-600">{loadErr}</div>
        ) : merged.length === 0 ? (
          <div className="py-8 text-sm text-slate-600">
            No entries yet. Update your goal with your current weight to get started.
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={merged}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                {/* left axis for weight, right axis for calories */}
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="weightKg"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="calories"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Summary */}
      <Card title="Summary">
        {summary ? (
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-slate-600">Start</div>
              <div className="text-lg font-semibold">
                {summary.startWeightKg ?? "—"} kg
              </div>
            </div>
            <div>
              <div className="text-slate-600">Latest</div>
              <div className="text-lg font-semibold">
                {summary.latestWeightKg ?? "—"} kg
              </div>
            </div>
            <div>
              <div className="text-slate-600">Change</div>
              <div className="text-lg font-semibold">
                {summary.deltaKg ?? 0} kg
              </div>
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
