import mongoose from "mongoose";

const mealSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    calories: { type: Number, required: true },
    eatenAt: { type: Date, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("Meal", mealSchema);
