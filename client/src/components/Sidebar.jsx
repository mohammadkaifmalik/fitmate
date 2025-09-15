import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-white p-4 sticky top-0 h-screen">
      <h2 className="text-xl font-bold mb-6">FitMate</h2>
      <nav className="space-y-3">
        <Link to="/" className="block hover:bg-slate-700 px-3 py-2 rounded">
          Dashboard
        </Link>
        <Link to="/progress" className="block hover:bg-slate-700 px-3 py-2 rounded">
          Progress
        </Link>
        <Link to="/profile" className="block hover:bg-slate-700 px-3 py-2 rounded">
          Profile
        </Link>
        <Link to="/settings" className="block hover:bg-slate-700 px-3 py-2 rounded">
          Settings
        </Link>
      </nav>
    </aside>
  );
}
