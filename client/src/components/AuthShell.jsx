import React from "react";
import { Outlet, Link } from "react-router-dom";
import Logo from "./Logo";

export default function AuthShell() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Logo /><span className="text-2xl font-bold">FitMate</span>
          </div>
          <Outlet />
        </div>
        <div className="text-center mt-4 text-xs text-slate-500">
          <Link to="/">← Back to site</Link>
        </div>
      </div>
    </div>
  );
}
