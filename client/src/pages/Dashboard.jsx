import React from "react";
import Card from "../components/Card.jsx";
import { useAuth } from "../context/AuthContext";
import { api, setAuth } from "../lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

setAuth(localStorage.getItem("fitmate_token"));

const weekly = [
  { day: "Mon", value: 20 },
  { day: "Tue", value: 20 },
  { day: "Wed", value: 25 },
  { day: "Thu", value: 30 },
  { day: "Fri", value: 32 },
  { day: "Sat", value: 40 },
  { day: "Sun", value: 60 },
];

const breakdown = [
  { name: "Strength", value: 45 },
  { name: "Cardio", value: 25 },
  { name: "Flexibility", value: 15 },
  { name: "Other", value: 15 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const kcal = user?.caloriesTarget ?? 1800;
  const goal = user?.profile?.goal ?? "maintain";

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card title="Today's Workout">
          <div className="text-2xl font-semibold">Full Body</div>
          <div className="text-slate-600 mt-1">45 min</div>
        </Card>
        <Card title="Today's Meal Plan">
          <div className="text-2xl font-semibold capitalize">{goal} plan</div>
          <div className="text-slate-600 mt-1">{kcal} kcal</div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card title="This Week’s Progress">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Upcoming Workouts">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={breakdown} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2} />
                {breakdown.map((_, i) => <Cell key={i} />)}
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
