import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register, setError } = useAuth();
  const nav = useNavigate();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      await register(name, email, password);
      nav("/", { replace: true });
    } catch (e2) {
      setErr(e2?.response?.data?.error || "Sign up failed");
      setError?.(e2);
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h1 className="text-2xl font-semibold text-center">Create account</h1>
      {err && <div className="text-sm text-red-600">{err}</div>}
      <input className="w-full rounded-xl border px-4 py-3" placeholder="Full name"
             value={name} onChange={e=>setName(e.target.value)} required />
      <input className="w-full rounded-xl border px-4 py-3" type="email" placeholder="Email address"
             value={email} onChange={e=>setEmail(e.target.value)} required />
      <input className="w-full rounded-xl border px-4 py-3" type="password" minLength={6}
             placeholder="Password (min 6 chars)" value={password} onChange={e=>setPassword(e.target.value)} required />
      <button className="w-full rounded-xl bg-slate-900 text-white py-3 disabled:opacity-60" disabled={busy}>
        {busy ? "Creating…" : "Sign Up"}
      </button>
      <div className="border-t pt-4 text-center text-sm">
        Already have an account? <Link to="/auth/login" className="font-semibold hover:underline">Log in</Link>
      </div>
    </form>
  );
}
