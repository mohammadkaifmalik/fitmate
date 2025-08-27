import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    gender: { type: String, enum: ["Male", "Female", "Other"], default: "Other" },
    heightCm: Number,
    weightKg: Number,
    goal: { type: String, enum: ["lose", "gain", "maintain"], default: "maintain" },
    activityLevel: {
      type: String,
      enum: ["sedentary", "light", "moderate", "active", "athlete"],
      default: "moderate",
    },
    preferences: { type: [String], default: [] }, // e.g., "vegetarian", "halal"
    allergies: { type: [String], default: [] },   // e.g., "peanuts", "lactose"
    isComplete: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    caloriesTarget: { type: Number, default: 1800 },
    profile: { type: profileSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
