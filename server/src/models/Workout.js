// server/src/models/workout.js
import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sets: { type: Number },          // for strength
    reps: { type: Number },          // for strength
    durationSec: { type: Number },   // for cardio/timed holds
    restSec: { type: Number, default: 60 },
    notes: { type: String },
    order: { type: Number, default: 0 }
  },
  { _id: false }
);

// Optional guard: must have sets+reps OR durationSec
exerciseSchema.pre("validate", function (next) {
  const hasStrength = Number.isFinite(this.sets) && Number.isFinite(this.reps);
  const hasDuration = Number.isFinite(this.durationSec);
  if (!hasStrength && !hasDuration) {
    return next(new Error("Exercise must have sets+reps or durationSec."));
  }
  next();
});

const workoutSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    durationMin: { type: Number, required: true },
    type: { type: String, enum: ["Strength", "Cardio", "Flexibility", "Other"], required: true },
    scheduledAt: { type: Date, required: true },
    completed: { type: Boolean, default: false },

    // NEW
    goal: { type: String, enum: ["lose", "gain", "maintain"], default: "maintain" },
    bmiAtPlan: { type: Number },
    notes: { type: String },                         // <-- add this
    exercises: { type: [exerciseSchema], default: [] }
  },
  { timestamps: true }
);

workoutSchema.index({ userId: 1, scheduledAt: 1 });

export default mongoose.model("Workout", workoutSchema);
