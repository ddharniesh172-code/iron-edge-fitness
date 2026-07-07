/* ============================================================
   IRON EDGE FITNESS — achievements-data.js
   Badge definitions + AI daily tip pool used by dashboard.js
   and ai-recommendations.js.

   Each badge's `check(stats)` function receives an aggregated
   stats object built by dashboard.js:
   {
     totalWorkouts, workoutStreak, totalCaloriesBurned,
     dietDaysLogged, waterGoalHitDays, weightLogsCount,
     favoriteExercisesCount, daysSinceSignup
   }
   ============================================================ */

const ACHIEVEMENT_BADGES = [
  {
    id: "first-workout",
    name: "First Rep",
    description: "Complete your first workout.",
    icon: "fa-solid fa-dumbbell",
    check: (s) => s.totalWorkouts >= 1
  },
  {
    id: "workout-10",
    name: "Getting Serious",
    description: "Complete 10 workouts.",
    icon: "fa-solid fa-medal",
    check: (s) => s.totalWorkouts >= 10
  },
  {
    id: "workout-50",
    name: "Iron Regular",
    description: "Complete 50 workouts.",
    icon: "fa-solid fa-trophy",
    check: (s) => s.totalWorkouts >= 50
  },
  {
    id: "workout-100",
    name: "Century Club",
    description: "Complete 100 workouts.",
    icon: "fa-solid fa-crown",
    check: (s) => s.totalWorkouts >= 100
  },
  {
    id: "streak-3",
    name: "On A Roll",
    description: "Hit a 3-day workout streak.",
    icon: "fa-solid fa-fire",
    check: (s) => s.workoutStreak >= 3
  },
  {
    id: "streak-7",
    name: "Week Warrior",
    description: "Hit a 7-day workout streak.",
    icon: "fa-solid fa-fire-flame-curved",
    check: (s) => s.workoutStreak >= 7
  },
  {
    id: "streak-30",
    name: "Unstoppable",
    description: "Hit a 30-day workout streak.",
    icon: "fa-solid fa-bolt",
    check: (s) => s.workoutStreak >= 30
  },
  {
    id: "calories-1000",
    name: "Calorie Crusher",
    description: "Burn 1,000 total calories through workouts.",
    icon: "fa-solid fa-fire-flame-simple",
    check: (s) => s.totalCaloriesBurned >= 1000
  },
  {
    id: "calories-10000",
    name: "Furnace Mode",
    description: "Burn 10,000 total calories through workouts.",
    icon: "fa-solid fa-fire-burner",
    check: (s) => s.totalCaloriesBurned >= 10000
  },
  {
    id: "diet-first-log",
    name: "Meal Tracker",
    description: "Log your first meal in the Diet Planner.",
    icon: "fa-solid fa-utensils",
    check: (s) => s.dietDaysLogged >= 1
  },
  {
    id: "diet-7-days",
    name: "Nutrition Rookie",
    description: "Log meals on 7 different days.",
    icon: "fa-solid fa-carrot",
    check: (s) => s.dietDaysLogged >= 7
  },
  {
    id: "diet-30-days",
    name: "Nutrition Pro",
    description: "Log meals on 30 different days.",
    icon: "fa-solid fa-apple-whole",
    check: (s) => s.dietDaysLogged >= 30
  },
  {
    id: "water-goal-7",
    name: "Hydration Hero",
    description: "Hit your water goal on 7 different days.",
    icon: "fa-solid fa-droplet",
    check: (s) => s.waterGoalHitDays >= 7
  },
  {
    id: "water-goal-30",
    name: "Water Champion",
    description: "Hit your water goal on 30 different days.",
    icon: "fa-solid fa-water",
    check: (s) => s.waterGoalHitDays >= 30
  },
  {
    id: "weight-log-first",
    name: "Progress Starter",
    description: "Log your body weight for the first time.",
    icon: "fa-solid fa-weight-scale",
    check: (s) => s.weightLogsCount >= 1
  },
  {
    id: "weight-log-10",
    name: "Consistent Tracker",
    description: "Log your body weight 10 times.",
    icon: "fa-solid fa-chart-line",
    check: (s) => s.weightLogsCount >= 10
  },
  {
    id: "favorites-5",
    name: "Curator",
    description: "Favorite 5 exercises.",
    icon: "fa-solid fa-heart",
    check: (s) => s.favoriteExercisesCount >= 5
  },
  {
    id: "member-30-days",
    name: "One Month Strong",
    description: "Be an Iron Edge member for 30 days.",
    icon: "fa-solid fa-shield-heart",
    check: (s) => s.daysSinceSignup >= 30
  },
  {
    id: "member-365-days",
    name: "Iron Anniversary",
    description: "Be an Iron Edge member for a full year.",
    icon: "fa-solid fa-award",
    check: (s) => s.daysSinceSignup >= 365
  }
];

/* ============================================================
   AI DAILY TIPS
   Rotated by ai-recommendations.js — one shown per day, seeded
   by the date so it stays stable if the dashboard reloads.
   ============================================================ */
const AI_DAILY_TIPS = [
  "Aim to get at least 1.6-2.2g of protein per kg of bodyweight daily to support muscle recovery.",
  "Progressive overload is the #1 driver of long-term strength gains — try adding a small amount of weight or one extra rep each week.",
  "Sleep is when your muscles actually repair. Aim for 7-9 hours to make the most of your training.",
  "Hydration affects strength and endurance — even 2% dehydration can noticeably hurt performance.",
  "Don't skip your warm-up. Five minutes of mobility work can meaningfully reduce injury risk.",
  "Rest days aren't wasted days — they're when adaptation actually happens.",
  "Compound lifts like squats, deadlifts and presses give you the most return on time invested.",
  "Track your workouts. What gets measured tends to get improved.",
  "Carbs before a workout and protein after can help maximize both performance and recovery.",
  "Consistency beats intensity — a moderate plan you can sustain for months beats a brutal one you quit after two weeks.",
  "Stretch or foam roll on rest days to help manage soreness and maintain mobility.",
  "If you're plateauing, check your recovery first — many stalls come from under-sleeping or under-eating, not under-training.",
  "Fiber-rich carbs like oats, vegetables and legumes help keep you full while hitting your calorie targets.",
  "A short walk after meals can help with digestion and blood sugar control.",
  "Mixing up rep ranges (heavy low-rep and lighter high-rep work) can help you break through strength plateaus."
];

function getBadgeById(id) {
  return ACHIEVEMENT_BADGES.find(b => b.id === id) || null;
}

function getEarnedBadges(stats) {
  return ACHIEVEMENT_BADGES.filter(b => {
    try { return b.check(stats); } catch (e) { return false; }
  });
}

function getDailyTip(seedDateStr) {
  const seed = (seedDateStr || new Date().toISOString().slice(0, 10))
    .split("-").join("");
  const index = parseInt(seed, 10) % AI_DAILY_TIPS.length;
  return AI_DAILY_TIPS[index];
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { ACHIEVEMENT_BADGES, AI_DAILY_TIPS, getBadgeById, getEarnedBadges, getDailyTip };
}
