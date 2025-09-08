// client/src/api/progress.js
import { api } from "../lib/api";

// Upsert (create or update) a weight entry for a given date
export async function upsertWeight({ date, weightKg }) {
  const res = await api.post("/progress/weights/upsert", { date, weightKg });
  return res.data; // { ok: true, log: ... }
}
