import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Protected() {
  const { token, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="min-h-screen grid place-items-center">Loading…</div>;
  if (!token) return <Navigate to="/auth/login" replace state={{ from: loc }} />;
  return <Outlet />;
}
