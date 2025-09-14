// server/src/routes/workouts.js
import express from "express";
import auth from "../middleware/auth.js";
import Workout from "../models/Workout.js";

const router = express.Router();

/* -------- tiny generator (optional fallback) -------- */
function generateExercises({ goal = "maintain", bmi }) {
  const over = typeof bmi === "number" && bmi >= 25;
  const under = typeof bmi === "number" && bmi < 18.5;

  if (goal === "lose" || over) {
    return [
      { name: "Goblet Squat", sets: 3, reps: 15, restSec: 45, order: 1 },
      { name: "Incline Push-up", sets: 3, reps: 12, restSec: 45, order: 2 },
      { name: "Bent-over DB Row", sets: 3, reps: 12, restSec: 45, order: 3 },
      { name: "Kettlebell Swing", sets: 3, reps: 20, restSec: 45, order: 4 },
      { name: "Bike (Moderate)", durationSec: 8 * 60, restSec: 60, notes: "RPE 6/10", order: 5 }
    ];
  }

  if (goal === "gain" || under) {
    return [
      { name: "Back Squat", sets: 4, reps: 10, restSec: 90, notes: "Add small load weekly", order: 1 },
      { name: "DB Bench Press", sets: 4, reps: 10, restSec: 90, order: 2 },
      { name: "Lat Pulldown", sets: 3, reps: 12, restSec: 75, order: 3 },
      { name: "Romanian Deadlift", sets: 3, reps: 12, restSec: 90, order: 4 },
      { name: "Plank", durationSec: 45, restSec: 45, order: 5 }
    ];
  }

  // maintain
  return [
    { name: "Deadlift (light)", sets: 3, reps: 8, restSec: 90, order: 1 },
    { name: "DB Shoulder Press", sets: 3, reps: 10, restSec: 75, order: 2 },
    { name: "Seated Row", sets: 3, reps: 12, restSec: 60, order: 3 },
    { name: "Rowing Machine", durationSec: 10 * 60, restSec: 60, notes: "Steady", order: 4 }
  ];
}

/* -------- GET /api/workouts --------
   Optional query:
   - from, to: ISO dates
   - expand=exercises  -> include goal/bmiAtPlan/exercises/notes */
router.get("/", auth, async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const expand = String(req.query.expand || "");
    const start = from ? new Date(from) : new Date();
    const end = to ? new Date(to) : new Date(Date.now() + 7 * 86400000);

    const query = { userId: req.user.sub, scheduledAt: { $gte: start, $lte: end } };

    const isExpand = expand.split(",").map(s => s.trim()).includes("exercises");
    const projection = isExpand
      ? undefined // full doc
      : "title type durationMin scheduledAt"; // light list

    const cursor = Workout.find(query).sort({ scheduledAt: 1 });
    if (projection) cursor.select(projection);

    const workouts = await cursor.lean();
    res.json({ workouts });
  } catch (err) {
    next(err);
  }
});

/* -------- POST /api/workouts -------- */
router.post("/", auth, async (req, res, next) => {
  try {
    const {
      title,
      durationMin,
      type,
      scheduledAt,
      goal = "maintain",
      bmiAtPlan,
      exercises,
      notes
    } = req.body;

    const finalExercises =
      Array.isArray(exercises) && exercises.length
        ? exercises
        : generateExercises({ goal, bmi: bmiAtPlan });

    const doc = await Workout.create({
      userId: req.user.sub,
      title,
      durationMin,
      type,
      scheduledAt,
      goal,
      bmiAtPlan,
      exercises: finalExercises,
      notes
    });

    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

/* -------- PUT /api/workouts/:id -------- */
router.put("/:id", auth, async (req, res, next) => {
  try {
    const id = req.params.id;
    const update = { ...req.body };

    if (update.regenerate === true) {
      const current = await Workout
        .findOne({ _id: id, userId: req.user.sub })
        .select("goal bmiAtPlan")
        .lean();

      const goal = update.goal || current?.goal || "maintain";
      const bmi = typeof update.bmiAtPlan === "number" ? update.bmiAtPlan : current?.bmiAtPlan;
      update.exercises = generateExercises({ goal, bmi });
      delete update.regenerate;
    }

    const doc = await Workout.findOneAndUpdate(
      { _id: id, userId: req.user.sub },
      update,
      { new: true }
    );

    if (!doc) return res.status(404).json({ message: "Workout not found" });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

export default router;
