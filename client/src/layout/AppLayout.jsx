import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="flex">
      {/* Sidebar (sticky) */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 min-h-screen bg-slate-50 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
