import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProfileGate() {
  const { user, token, loading } = useAuth();
  const loc = useLocation();

  // While session is resolving, don't decide yet
  if (loading || (token && !user)) {
    return <div className="min-h-screen grid place-items-center">Loading…</div>;
  }

  // Always allow the onboarding route
  if (loc.pathname.startsWith("/onboarding")) return <Outlet />;

  const complete = Boolean(user?.profile?.isComplete);
  if (!complete) return <Navigate to="/onboarding" replace />;

  return <Outlet />;
}
