// server/src/utils/generateWorkout.js
export function generateExercises({ goal, bmi }) {
    // Simple rule tweaks using BMI
    const over = bmi >= 25;
    const under = bmi < 18.5;
  
    if (goal === "lose" || over) {
      return [
        { name: "Goblet Squat", sets: 3, reps: 15, restSec: 45, order: 1 },
        { name: "Push-up (Incline if needed)", sets: 3, reps: 12, restSec: 45, order: 2 },
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
  