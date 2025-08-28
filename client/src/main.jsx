import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import Protected from "./components/Protected";
import ProfileGate from "./components/ProfileGate";
import AuthShell from "./components/AuthShell";
import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import WorkoutPlan from "./pages/WorkoutPlan";
import MealPlan from "./pages/MealPlan";
import Progress from "./pages/Progress";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import GoalSettings from "./pages/GoalSettings";  // <-- keep only this one

import "./index.css";

const router = createBrowserRouter([
  { path: "/auth", element: <AuthShell />, children: [
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
    ]},
  { element: <Protected />, children: [
      { path: "/onboarding", element: <Onboarding /> },
      { element: <ProfileGate />, children: [
          { path: "/", element: <Layout />, children: [
              { index: true, element: <Dashboard /> },
              { path: "workouts", element: <WorkoutPlan /> },
              { path: "meals", element: <MealPlan /> },
              { path: "progress", element: <Progress /> },
              { path: "settings/goal", element: <GoalSettings /> }, // new page
          ]},
      ]},
  ]},
]);

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <RouterProvider router={router} future={{ v7_relativeSplatPath: true, v7_startTransition: true }} />
  </AuthProvider>
);
