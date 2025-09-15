import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProfileGate() {
  const { user, token, loading } = useAuth();
  const loc = useLocation();

  if (loading || (token && !user)) {
    return <div className="min-h-screen grid place-items-center">Loading…</div>;
  }

  if (loc.pathname.startsWith("/onboarding")) return <Outlet />;

  const complete = Boolean(user?.profile?.isComplete);
  if (!complete) return <Navigate to="/onboarding" replace />;

  return <Outlet />;
}
