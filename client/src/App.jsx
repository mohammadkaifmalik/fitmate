import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import WorkoutPlan from "./pages/WorkoutPlan";
import MealPlan from "./pages/MealPlan";
import Progress from "./pages/Progress";
import GoalSettings from "./pages/GoalSettings"; // <-- added import

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/workouts" element={<WorkoutPlan />} />
        <Route path="/meals" element={<MealPlan />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/settings/goal" element={<GoalSettings />} /> {/* <-- new route */}
      </Routes>
    </Layout>
  );
}
