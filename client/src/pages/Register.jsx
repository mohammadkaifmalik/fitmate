import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function Register() {
  const nav = useNavigate();

  const [stage, setStage] = useState("form"); // 'form' | 'code'
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  async function sendCode(e) {
    e?.preventDefault?.();
    setErr(""); setMsg(""); setBusy(true);
    try {
      if (!email.includes("@")) throw new Error("Enter a valid email");
      if (!name.trim()) throw new Error("Enter your name");
      if (password.length < 6) throw new Error("Password must be at least 6 characters");

      await api.post("/auth/otp/request", { email });
      setStage("code");
      setMsg("We emailed you a 6-digit code.");
    } catch (e2) {
      setErr(e2?.response?.data?.error || e2.message || "Failed to send code");
    } finally {
      setBusy(false);
    }
  }

  async function verifyAndCreate() {
    setErr(""); setMsg(""); setBusy(true);
    try {
      // IMPORTANT: pass name/password and setPassword=true so server stores the password
      const res = await api.post("/auth/otp/verify", {
        email,
        code,
        name,
        password,
        setPassword: true,
      });
      localStorage.setItem("token", res.data.token);
      nav("/", { replace: true });
    } catch (e2) {
      setErr(e2?.response?.data?.error || e2.message || "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-center">Create account</h1>

      {stage === "form" && (
        <form onSubmit={sendCode} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          {err && <div className="text-sm text-red-600">{err}</div>}
          {msg && <div className="text-sm text-green-600">{msg}</div>}

          <label className="block text-sm font-medium">Full name</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            value={name}
            onChange={(e)=>setName(e.target.value)}
            required
          />

          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
          />

          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            minLength={6}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
          />

          <button
            className="w-full rounded-lg bg-slate-900 text-white px-4 py-2 hover:bg-slate-800 disabled:opacity-60"
            disabled={busy}
          >
            {busy ? "Sending…" : "Send Code"}
          </button>
        </form>
      )}

      {stage === "code" && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          {err && <div className="text-sm text-red-600">{err}</div>}
          {msg && <div className="text-sm text-green-600">{msg}</div>}

          <div className="text-sm text-slate-600">
            We sent a code to <strong>{email}</strong>
          </div>

          <label className="block text-sm font-medium">6-digit code</label>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 tracking-[0.6em] text-center text-lg"
            value={code}
            onChange={(e)=>setCode(e.target.value.replace(/\D/g, "").slice(0,6))}
          />

          <div className="flex gap-2">
            <button
              onClick={verifyAndCreate}
              disabled={busy || code.length !== 6}
              className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-60"
            >
              {busy ? "Verifying…" : "Verify & Create Account"}
            </button>
            <button
              onClick={sendCode}
              disabled={busy}
              className="rounded-lg bg-slate-100 px-4 py-2 hover:bg-slate-200"
            >
              Resend
            </button>
          </div>
        </div>
      )}

      <div className="border-t pt-4 text-center text-sm">
        Already have an account?{" "}
        <Link to="/auth/login" className="font-semibold hover:underline">
          Log in
        </Link>
      </div>
    </div>
  );
}
