import mongoose from "mongoose";

const WeightLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
  weightKg: { type: Number, required: true },
  bmi: { type: Number, required: true },
  bmiCategory: { type: String, required: true },
  date: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

export default mongoose.model("WeightLog", WeightLogSchema);
