import React from "react";
import Card from "../components/Card";
import BackToDashboard from "../components/BackToDashboard";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

const data = [
  { day: "Mon", weight: 80.2 },
  { day: "Tue", weight: 80.0 },
  { day: "Wed", weight: 79.9 },
  { day: "Thu", weight: 79.8 },
  { day: "Fri", weight: 79.6 },
  { day: "Sat", weight: 79.5 },
  { day: "Sun", weight: 79.4 },
];

export default function Progress() {
  return (
    <div className="space-y-4">
      <BackToDashboard />
      <h2 className="text-2xl font-semibold">Progress</h2>
      <Card title="Weight (kg) — This Week">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="weight" dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
