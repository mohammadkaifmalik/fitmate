import mongoose from "mongoose";

const workoutSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    durationMin: { type: Number, required: true },
    type: { type: String, enum: ["Strength", "Cardio", "Flexibility", "Other"], required: true },
    scheduledAt: { type: Date, required: true },
    completed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("Workout", workoutSchema);
