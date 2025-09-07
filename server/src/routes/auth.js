// server/src/routes/auth.js
import express from "express";
import { z } from "zod";
import ms from "ms";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import OtpToken from "../models/OtpToken.js";
import User from "../models/User.js";
import { signJwt } from "../utils/jwt.js";
import auth from "../middleware/auth.js";
import { sendOtpEmail } from "../lib/mailer.js";

const router = express.Router();

/* ------------------------- ENV / CONSTS ------------------------- */
const OTP_TTL_MS = parseInt(process.env.OTP_TTL_MS || "600000", 10);       // 10 min
const OTP_COOLDOWN_MS = parseInt(process.env.OTP_WINDOW_MS || "120000", 10); // 2 min
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || "5", 10);

/* ------------------------- HELPERS ------------------------- */
const credentialsSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email(),
  password: z.string().min(6)
});

// add an optional context flag
const requestOtpSchema = z.object({
  email: z.string().email(),
  context: z.enum(["register","login"]).optional()  // ← new
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(8),   // we send 6 digits, but be lenient
  name: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
  setPassword: z.boolean().optional().default(false),
});


function makeOtp() {
  return (Math.floor(100000 + Math.random() * 900000)).toString(); // 6 digits
}

/* ------------------------- PASSWORD FLOW (existing) ------------------------- */
router.post("/register", async (req, res) => {
  const parse = credentialsSchema.safeParse(req.body);
  if (!parse.success || !parse.data.name) return res.status(400).json({ error: "Invalid data" });

  const { name, email, password } = parse.data;
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ error: "Email already in use" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash });
  const token = signJwt({ sub: user.id, name: user.name, email: user.email });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

router.post("/login", async (req, res) => {
  const parse = credentialsSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid data" });

  const { email, password } = parse.data;
  const user = await User.findOne({ email });
  if (!user?.passwordHash) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signJwt({ sub: user.id, name: user.name, email: user.email });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.sub)
    .select("name email caloriesTarget profile emailVerified");
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user });
});

// POST /api/auth/otp/request  { email }
router.post("/otp/request", async (req, res) => {
  const parsed = requestOtpSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Valid email required" });

  const email = String(parsed.data.email).trim().toLowerCase();
  const context = parsed.data.context || "login"; // default: login

  try {
    // If this is a register attempt, block if user already exists
    if (context === "register") {
      const exists = await User.findOne({ email }).select("_id");
      if (exists) {
        return res.status(409).json({ error: "User already exists. Please login or use a new email." });
      }
    }

    // Cooldown check (avoid spamming)
    const last = await OtpToken.findOne({ email }).sort({ createdAt: -1 });
    if (last && Date.now() - new Date(last.requestedAt || last.createdAt).getTime() < OTP_COOLDOWN_MS) {
      const waitMs = OTP_COOLDOWN_MS - (Date.now() - new Date(last.requestedAt || last.createdAt).getTime());
      return res.status(429).json({ error: `Please wait ${Math.ceil(waitMs/1000)}s before requesting another code` });
    }

    // Create OTP
    const otp = makeOtp();
    const codeHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await OtpToken.create({
      email,
      codeHash,
      expiresAt,
      attempts: 0,
      requestedAt: new Date(),
      ip: req.ip
    });

    // Send email (throws on failure)
    const messageId = await sendOtpEmail({ toEmail: email, otp });
    return res.json({ ok: true, message: "OTP sent", messageId });
  } catch (e) {
    console.error("OTP request error:", e?.message || e);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
});


// POST /api/auth/otp/verify  { email, code }
router.post("/otp/verify", async (req, res) => {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const { email: rawEmail, code, name, password, setPassword } = parsed.data;
  const email = rawEmail.trim().toLowerCase();

  // Get most recent token
  const tokenDoc = await OtpToken.findOne({ email }).sort({ createdAt: -1 });
  if (!tokenDoc) return res.status(400).json({ error: "No OTP requested" });

  if (new Date() > new Date(tokenDoc.expiresAt)) {
    return res.status(400).json({ error: "Code expired" });
  }
  if (tokenDoc.attempts >= OTP_MAX_ATTEMPTS) {
    return res.status(429).json({ error: "Too many attempts" });
  }

  // Verify code
  const ok = await bcrypt.compare(code, tokenDoc.codeHash);
  if (!ok) {
    tokenDoc.attempts += 1;
    await tokenDoc.save();
    return res.status(400).json({ error: "Invalid code" });
  }

  // Consume OTP
  await OtpToken.deleteMany({ email });

  // Check if user exists
  let user = await User.findOne({ email });

  if (!user) {
    // New user
    if (setPassword && password) {
      const passwordHash = await bcrypt.hash(password, 10);
      user = await User.create({
        email,
        name: name || email.split("@")[0],
        profile: { isComplete: false },
        emailVerified: true,
        passwordHash,
      });
    } else {
      user = await User.create({
        email,
        name: name || email.split("@")[0],
        profile: { isComplete: false },
        emailVerified: true,
      });
    }
  } else {
    // Existing user → block registration
    if (setPassword) {
      return res.status(409).json({ error: "User already exists. Please login." });
    }
    // Otherwise, treat as OTP login
    user.emailVerified = true;
    await user.save();
  }

  const token = signJwt({ sub: user.id, name: user.name, email: user.email });
  return res.json({ ok: true, token, user: { id: user.id, name: user.name, email: user.email } });
});


export default router;
