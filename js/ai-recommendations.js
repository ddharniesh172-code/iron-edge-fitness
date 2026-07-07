/* ============================================================
   IRON EDGE FITNESS — ai-recommendations.js
   A rule-based "AI" recommendation engine — no external API
   calls. Reads existing localStorage data from the workout and
   diet modules (plus EXERCISE_DATA / FOOD_DATA) to produce:
     - Workout suggestions (targets under-trained body parts)
     - Diet recommendations (targets macro shortfalls vs goal)
     - Daily tips (from achievements-data.js, date-seeded)
     - A personalized insight paragraph
   Expects exercise-data.js, food-data.js and achievements-data.js
   to be loaded first. Safe to call from any page.
   ============================================================ */

(function () {
  "use strict";

  function readLS(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  /* ============================================================
     DATA GATHERING
     ============================================================ */
  function getWorkoutHistory() {
    return readLS("ie_workout_history", []);
  }

  function getDietGoal() {
    return readLS("ie_diet_goal", { weightGoal: "maintain", calorieTarget: 2200, macroSplit: "balanced", waterGoalMl: 2000 });
  }

  function getDietHistory() {
    return readLS("ie_diet_history", []);
  }

  function getLatestBmi() {
    const calcHistory = readLS("ie_calc_history", []);
    const bmiEntry = calcHistory.find(h => h.type === "bmi");
    if (!bmiEntry) return null;
    const match = /([\d.]+)/.exec(bmiEntry.value);
    return match ? parseFloat(match[1]) : null;
  }

  /* ============================================================
     WORKOUT SUGGESTION
     ============================================================ */
  function findUnderTrainedBodyPart() {
    const history = getWorkoutHistory().slice(0, 20); // most recent 20 sessions
    const counts = {};
    (typeof EXERCISE_BODY_PARTS !== "undefined" ? EXERCISE_BODY_PARTS : []).forEach(bp => counts[bp] = 0);

    history.forEach(entry => {
      if (typeof getExerciseById !== "function") return;
      const ex = getExerciseById(entry.id);
      if (ex && counts[ex.bodyPart] !== undefined) counts[ex.bodyPart]++;
    });

    const entries = Object.entries(counts);
    if (entries.length === 0) return "full-body";

    entries.sort((a, b) => a[1] - b[1]);
    return entries[0][0];
  }

  function getWorkoutSuggestion() {
    const history = getWorkoutHistory();

    if (history.length === 0) {
      return {
        text: "You haven't logged a workout yet. Start with a Full Body beginner session to build a baseline before specializing.",
        linkBodyPart: "full-body"
      };
    }

    const bodyPart = findUnderTrainedBodyPart();
    const bmi = getLatestBmi();

    let intro = `Your recent sessions have leaned away from ${bodyPart.replace("-", " ")} training.`;
    if (bmi !== null && bmi >= 25) {
      intro += " Since your BMI suggests some extra body fat, consider pairing this with 2-3 cardio sessions this week too.";
    } else if (bmi !== null && bmi < 18.5) {
      intro += " With a lower BMI, prioritize compound strength moves and make sure you're eating enough to support growth.";
    }

    let exampleExercise = null;
    if (typeof getExercisesByBodyPart === "function") {
      const options = getExercisesByBodyPart(bodyPart);
      if (options.length) exampleExercise = options[Math.floor(Math.random() * options.length)];
    }

    const suggestionText = exampleExercise
      ? `${intro} Try "${exampleExercise.name}" — ${exampleExercise.sets} sets of ${exampleExercise.reps}.`
      : intro;

    return { text: suggestionText, linkBodyPart: bodyPart };
  }

  /* ============================================================
     DIET SUGGESTION
     ============================================================ */
  function getDietSuggestion() {
    const goal = getDietGoal();
    const history = getDietHistory();
    const today = new Date().toISOString().slice(0, 10);
    const todayEntry = history.find(h => h.date === today);

    const macroTargets = (window.IronEdgeDiet && typeof window.IronEdgeDiet.computeMacroTargets === "function")
      ? window.IronEdgeDiet.computeMacroTargets(goal.calorieTarget, goal.macroSplit)
      : { protein: Math.round(goal.calorieTarget * 0.3 / 4), carbs: Math.round(goal.calorieTarget * 0.4 / 4), fat: Math.round(goal.calorieTarget * 0.3 / 9) };

    if (!todayEntry || todayEntry.calories === 0) {
      const goalMsg = goal.weightGoal === "lose"
        ? "Since your goal is weight loss, start the day with a high-protein, high-fiber breakfast to stay full on fewer calories — try Greek yogurt with fruit, or a moong dal chilla."
        : goal.weightGoal === "gain"
          ? "Since your goal is weight gain, don't skip meals — a calorie-dense breakfast like oats with peanut butter and banana is a good start."
          : "Log your meals today to keep your macros on track — a balanced plate of dal, rice and a vegetable side is a solid go-to.";
      return { text: `No meals logged yet today. ${goalMsg}` };
    }

    const proteinGap = macroTargets.protein - todayEntry.protein;
    const carbsGap = macroTargets.carbs - todayEntry.carbs;

    if (proteinGap > 20) {
      return { text: `You're about ${Math.round(proteinGap)}g short on protein today. Add a serving of paneer, chicken breast, chana, or a whey shake to close the gap.` };
    }
    if (todayEntry.calories > goal.calorieTarget + 200) {
      return { text: `You're running ${Math.round(todayEntry.calories - goal.calorieTarget)} kcal over your target today. Consider a lighter, vegetable-forward dinner to balance it out.` };
    }
    if (carbsGap > 40 && goal.weightGoal === "gain") {
      return { text: `You still have room for ${Math.round(carbsGap)}g of carbs today — rice, roti, or a banana would help you hit your gaining target.` };
    }
    return { text: "Your macros are tracking well against today's targets. Keep it up and stay consistent with your meal timing." };
  }

  /* ============================================================
     PERSONALIZED INSIGHT
     ============================================================ */
  function getPersonalizedInsight(stats) {
    const parts = [];

    if (stats.workoutStreak >= 3) {
      parts.push(`You're on a ${stats.workoutStreak}-day workout streak — great consistency.`);
    } else if (stats.totalWorkouts === 0) {
      parts.push("You haven't logged a workout yet this week.");
    } else {
      parts.push(`You've completed ${stats.totalWorkouts} workouts so far.`);
    }

    if (stats.waterGoalHitDays > 0) {
      parts.push(`You've hit your water goal on ${stats.waterGoalHitDays} of the last several days.`);
    } else {
      parts.push("Your water intake has been below goal recently — small sips throughout the day add up.");
    }

    if (stats.dietDaysLogged >= 5) {
      parts.push("Your meal logging is consistent, which makes these recommendations more accurate over time.");
    } else {
      parts.push("Logging meals more consistently will help sharpen your diet recommendations.");
    }

    return parts.join(" ");
  }

  /* ============================================================
     DAILY TIP
     ============================================================ */
  function getDailyTipText() {
    if (typeof getDailyTip === "function") return getDailyTip();
    return "Stay consistent — small daily habits compound into big results.";
  }

  /* ============================================================
     PUBLIC API
     ============================================================ */
  window.IronEdgeAI = {
    getWorkoutSuggestion,
    getDietSuggestion,
    getPersonalizedInsight,
    getDailyTipText
  };
})();
