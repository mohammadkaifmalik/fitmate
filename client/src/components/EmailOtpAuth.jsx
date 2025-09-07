import { useState } from "react";
import { requestOtp, verifyOtp } from "../api/auth";

export default function EmailOtpAuth({ onAuthed }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState("enterEmail"); // 'enterEmail' | 'enterCode'
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [message, setMessage] = useState("");

  async function handleRequest() {
    setErr(""); setMessage(""); setLoading(true);
    try {
      await requestOtp(email);
      setStage("enterCode");
      setMessage("We’ve sent a 6-digit code to your email.");
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setErr(""); setMessage(""); setLoading(true);
    try {
      const data = await verifyOtp(email, code);
      localStorage.setItem("token", data.token);
      setMessage("Signed in!");
      onAuthed && onAuthed(data.user);
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <h3 className="text-lg font-semibold">Sign in with Email</h3>

      {stage === "enterEmail" && (
        <>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="you@example.com"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
          />
          <button
            onClick={handleRequest}
            disabled={loading || !email.includes("@")}
            className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send Code"}
          </button>
        </>
      )}

      {stage === "enterCode" && (
        <>
          <div className="text-sm text-slate-600">Email: <strong>{email}</strong></div>
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
              onClick={handleVerify}
              disabled={loading || code.length !== 6}
              className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Verifying…" : "Verify & Sign In"}
            </button>
            <button
              onClick={handleRequest}
              disabled={loading}
              className="rounded-lg bg-slate-100 px-4 py-2 hover:bg-slate-200"
            >
              Resend
            </button>
          </div>
        </>
      )}

      {err && <div className="text-sm text-red-600">{err}</div>}
      {message && <div className="text-sm text-green-600">{message}</div>}
    </div>
  );
}
