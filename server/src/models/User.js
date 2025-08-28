import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema(
  {
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    heightCm: { type: Number },
    weightKg: { type: Number },
    goal: { type: String, enum: ["lose", "gain", "maintain"] },
    activityLevel: { type: String, enum: ["sedentary", "light", "moderate", "active", "athlete"] },
    preferences: [{ type: String, default: [] }],
    allergies: [{ type: String, default: [] }],
    isComplete: { type: Boolean, default: false },    // ✅ IMPORTANT
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    passwordHash: String,
    caloriesTarget: { type: Number, default: 0 },
    profile: { type: ProfileSchema, default: {} },     // ✅ embed profile
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
