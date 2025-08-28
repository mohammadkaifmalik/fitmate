// client/src/components/ProfileGate.jsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProfileGate() {
  const { user, token, loading } = useAuth();
  const loc = useLocation();

  if (loading || (token && !user)) {
    return <div className="min-h-screen grid place-items-center">Loading…</div>;
  }

  // allow onboarding route
  if (loc.pathname.startsWith("/onboarding")) return <Outlet />;

  // ✅ server is the only source of truth
  const complete = Boolean(user?.profile?.isComplete);
  if (!complete) return <Navigate to="/onboarding" replace />;

  return <Outlet />;
}
