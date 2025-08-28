import express from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signJwt } from "../utils/jwt.js";
import auth from "../middleware/auth.js";

const router = express.Router();

const credentialsSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email(),
  password: z.string().min(6)
});

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
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = signJwt({ sub: user.id, name: user.name, email: user.email });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.sub)
    .select("name email caloriesTarget profile"); // MUST include 'profile'
  if (!user) return res.status(404).json({ error: "User not found" });
  console.log("GET /auth/me -> isComplete:", user.profile?.isComplete); // debug
  res.json({ user });
});



export default router;
