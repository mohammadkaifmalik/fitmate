import express from "express";
const router = express.Router();

router.get("/hf", async (req, res) => {
  const model = (process.env.HUGGINGFACE_MODEL || "").trim();
  const key = (process.env.HUGGINGFACE_API_KEY || "").trim();

  if (!model) return res.status(500).json({ ok:false, error:"HUGGINGFACE_MODEL missing" });
  if (!key)   return res.status(500).json({ ok:false, error:"HUGGINGFACE_API_KEY missing" });

  const url = `https://api-inference.huggingface.co/models/${encodeURIComponent(model)}`;
  const payload = { inputs: "Return ONLY JSON: {\"ok\":true}", parameters: { max_new_tokens: 8 } };

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type":"application/json" },
      body: JSON.stringify(payload),
    });
    const text = await r.text();
    res.status(r.status).json({
      ok: r.ok, status: r.status, model,
      bodyPreview: text.slice(0, 400)
    });
  } catch (e) {
    res.status(500).json({ ok:false, error: e.message });
  }
});

export default router;
