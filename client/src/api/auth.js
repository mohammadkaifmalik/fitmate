import { api } from "../lib/api";

export async function requestOtp(email) {
  const res = await api.post("/auth/otp/request", { email });
  return res.data; // { ok:true }
}

export async function verifyOtp(email, code) {
  const res = await api.post("/auth/otp/verify", { email, code });
  return res.data; // { ok:true, token, user }
}
