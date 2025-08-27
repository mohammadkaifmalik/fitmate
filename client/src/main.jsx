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

import "./index.css";

const router = createBrowserRouter([
  { path: "/auth", element: <AuthShell />, children: [
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
    ]},
  // Everything below requires auth
  { element: <Protected />, children: [
      // Onboarding is protected by auth, but OUTSIDE the gate
      { path: "/onboarding", element: <Onboarding /> },
      // The rest is gated on profile completion
      { element: <ProfileGate />, children: [
          { path: "/", element: <Layout />, children: [
              { index: true, element: <Dashboard /> },
              { path: "workouts", element: <WorkoutPlan /> },
              { path: "meals", element: <MealPlan /> },
              { path: "progress", element: <Progress /> },
          ]},
      ]},
  ]},
]);

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <RouterProvider router={router} future={{ v7_relativeSplatPath: true, v7_startTransition: true }} />
  </AuthProvider>
);
