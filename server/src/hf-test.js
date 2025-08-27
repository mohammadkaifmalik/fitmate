import dotenv from "dotenv";
dotenv.config();

const url = `https://api-inference.huggingface.co/models/${encodeURIComponent(process.env.HUGGINGFACE_MODEL)}`;

const prompt = "Say 'hello' in JSON like this: {\"greeting\":\"...\"}";
const body = { inputs: prompt, parameters: { max_new_tokens: 64, temperature: 0.2 } };

try {
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`HF ${res.status}: ${t}`);
  }
  const data = await res.json();
  console.log("HF response:", JSON.stringify(data, null, 2));
} catch (e) {
  console.error("HF test error:", e.message);
  process.exit(1);
}
