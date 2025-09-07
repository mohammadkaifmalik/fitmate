import mongoose from "mongoose";

const OtpTokenSchema = new mongoose.Schema({
  email: { type: String, index: true },
  codeHash: String,
  expiresAt: { type: Date, index: true },
  attempts: { type: Number, default: 0 },
  requestedAt: { type: Date, default: Date.now }, // for cooldown
  ip: String,
}, { timestamps: true });

OtpTokenSchema.index({ email: 1, expiresAt: 1 });

export default mongoose.model("OtpToken", OtpTokenSchema);
