import mongoose from "mongoose";

const progressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    weightKg: { type: Number },
    steps: { type: Number },
    caloriesBurned: { type: Number }
  },
  { timestamps: true }
);

export default mongoose.model("Progress", progressSchema);
