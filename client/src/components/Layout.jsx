// client/src/components/Layout.jsx
import React from "react";
import { NavLink, Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { user, logout } = useAuth();

  const NavItem = ({ to, label }) => (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={() => setSidebarOpen(false)}
      className={({ isActive }) =>
        `block px-4 py-2 rounded-xl hover:bg-slate-800/60 ${
          isActive ? "bg-slate-800" : ""
        }`
      }
    >
      {label}
    </NavLink>
  );

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Desktop sidebar */}
      {/* Desktop sidebar */}
<aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col p-4 sticky top-0 h-screen">
  <Link to="/" className="flex items-center gap-2 px-2 py-4">
    <Logo />
    <span className="text-2xl font-semibold">FitMate</span>
  </Link>
  <nav className="mt-6 space-y-2">
    <NavItem to="/" label="Dashboard" />
    <NavItem to="/workouts" label="Workout Plan" />
    <NavItem to="/meals" label="Meal Plan" />
    <NavItem to="/progress" label="Progress" />
    <NavItem to="/settings/goal" label="Goal settings" />
  </nav>
  <div className="mt-auto text-xs text-slate-400 px-2 py-4">
    © {new Date().getFullYear()} FitMate
  </div>
</aside>


      {/* Mobile overlay + sidebar (mounted only when open) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {sidebarOpen && (
        <aside
          className="fixed z-50 inset-y-0 left-0 w-72 bg-slate-900 text-white p-4 md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between px-2 py-3">
            <div className="flex items-center gap-2">
              <Logo />
              <span className="text-xl font-semibold">FitMate</span>
            </div>
            <button
              className="p-2 rounded-lg hover:bg-slate-800"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
          <nav className="mt-4 space-y-2">
            <NavItem to="/" label="Dashboard" />
            <NavItem to="/workouts" label="Workout Plan" />
            <NavItem to="/meals" label="Meal Plan" />
            <NavItem to="/progress" label="Progress" />
            <NavItem to="/settings/goal" label="Goal settings" />
          </nav>
        </aside>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white sticky top-0 z-30 shadow-sm border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-xl border border-slate-200"
              onClick={() => setSidebarOpen((s) => !s)}
              aria-label="Open menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <Link to="/" className="md:hidden flex items-center gap-2">
              <Logo />
              <span className="text-xl font-semibold">FitMate</span>
            </Link>

            {/* Greeting on the left */}
            <h1 className="text-2xl md:text-3xl font-semibold flex-1">
              Welcome back, {user?.name ?? "Guest"}
            </h1>

            {/* Auth actions on the right (hidden on mobile for simplicity) */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <span className="text-sm text-slate-600">{user.email}</span>
                  <button
                    onClick={logout}
                    className="px-3 py-2 rounded-xl border border-slate-200"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  to="/auth/login"
                  className="px-3 py-2 rounded-xl border border-slate-200"
                >
                  Log in
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Routed page content */}
        <main className="max-w-6xl mx-auto w-full p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
