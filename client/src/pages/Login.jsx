import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = React.useState({ email: "", password: "" });
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("Signing in…");
    try {
      const u = await login(form.email, form.password); // fetches /auth/me
      const complete = Boolean(u?.profile?.isComplete);
      if (complete) localStorage.setItem("fitmate_onboarded", "1");
      else localStorage.removeItem("fitmate_onboarded");
      nav(complete ? "/" : "/onboarding", { replace: true });
    } catch (err) {
      console.error(err);
      setMsg(err?.response?.data?.error || err?.message || "Unable to sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h1 className="text-2xl font-semibold">Log in</h1>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input className="mt-1 w-full border rounded-xl px-3 py-2"
                   type="email" value={form.email}
                   onChange={e=>setForm(f=>({...f, email:e.target.value}))} required />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input className="mt-1 w-full border rounded-xl px-3 py-2"
                   type="password" value={form.password}
                   onChange={e=>setForm(f=>({...f, password:e.target.value}))} required />
          </div>
          <button className="w-full px-4 py-2 rounded-xl bg-slate-900 text-white disabled:opacity-60" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
          {msg && <div className="text-sm text-slate-600">{msg}</div>}
          <div className="text-sm">
            Don’t have an account? <Link to="/auth/register" className="underline">Create one</Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
