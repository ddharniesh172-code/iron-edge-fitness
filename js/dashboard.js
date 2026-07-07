/* ============================================================
   IRON EDGE FITNESS — dashboard.js
   Aggregates data already stored by the workout and diet
   modules (LocalStorage) into: welcome/profile summary, daily/
   weekly/monthly goal rings, progress charts, membership
   timeline, achievement badges, and AI recommendation panels.

   Expects to run on dashboard.html alongside exercise-data.js,
   food-data.js, achievements-data.js, ai-recommendations.js,
   calculators.js, diet.js, workout.js and firebase/dashboard.js.
   ============================================================ */

(function () {
  "use strict";

  if (!document.getElementById("welcomeName")) return; // not on dashboard.html

  /* ============================================================
     STORAGE HELPERS
     ============================================================ */
  function readLS(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function writeLS(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.error("IronEdge Dashboard storage write error:", e); }
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2600);
  }

  const WEIGHT_LOGS_KEY = "ie_weight_logs";
  const MEMBERSHIP_KEY = "ie_membership";

  function todayKey() { return new Date().toISOString().slice(0, 10); }

  function lastNDays(n) {
    const days = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }

  /* ============================================================
     DATA SOURCES (from other modules, read directly)
     ============================================================ */
  function getWorkoutHistory() { return readLS("ie_workout_history", []); }
  function getFavorites() { return readLS("ie_favorites", []); }
  function getDietGoal() { return readLS("ie_diet_goal", { weightGoal: "maintain", calorieTarget: 2200, macroSplit: "balanced", waterGoalMl: 2000 }); }
  function getDietHistory() { return readLS("ie_diet_history", []); }
  function getCalcHistory() { return readLS("ie_calc_history", []); }
  function getWeightLogs() { return readLS(WEIGHT_LOGS_KEY, []); }
  function getMembership() {
    return readLS(MEMBERSHIP_KEY, {
      plan: "Standard Monthly",
      joinDate: new Date(Date.now() - 14 * 86400000).toISOString(),
      expiryDate: new Date(Date.now() + 16 * 86400000).toISOString()
    });
  }

  function getLatestBmi() {
    const bmiEntry = getCalcHistory().find(h => h.type === "bmi");
    if (!bmiEntry) return null;
    const match = /([\d.]+)/.exec(bmiEntry.value);
    return match ? parseFloat(match[1]) : null;
  }
  function getLatestBmr() {
    const bmrEntry = getCalcHistory().find(h => h.type === "bmr");
    if (!bmrEntry) return null;
    const match = /(\d+)/.exec(bmrEntry.value);
    return match ? parseInt(match[1], 10) : null;
  }

  /* ============================================================
     STREAK CALCULATION (workout)
     ============================================================ */
  function computeWorkoutStreak(history) {
    if (history.length === 0) return 0;
    const dates = [...new Set(history.map(h => h.date.slice(0, 10)))].sort().reverse();
    let streak = 0;
    let cursor = new Date();
    for (const d of dates) {
      const cursorStr = cursor.toISOString().slice(0, 10);
      if (d === cursorStr) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else break;
    }
    return streak;
  }

  /* ============================================================
     AGGREGATE STATS (used by badges, goals, AI insight)
     ============================================================ */
  function buildStats() {
    const workoutHistory = getWorkoutHistory();
    const dietHistory = getDietHistory();
    const weightLogs = getWeightLogs();
    const goal = getDietGoal();
    const membership = getMembership();

    const totalCaloriesBurned = workoutHistory.reduce((sum, w) => sum + (w.calories || 0), 0);
    const waterGoalHitDays = dietHistory.filter(d => d.waterMl >= (goal.waterGoalMl || 2000)).length;
    const daysSinceSignup = Math.floor((Date.now() - new Date(membership.joinDate).getTime()) / 86400000);

    return {
      totalWorkouts: workoutHistory.length,
      workoutStreak: computeWorkoutStreak(workoutHistory),
      totalCaloriesBurned,
      dietDaysLogged: dietHistory.filter(d => d.calories > 0).length,
      waterGoalHitDays,
      weightLogsCount: weightLogs.length,
      favoriteExercisesCount: getFavorites().length,
      daysSinceSignup: Math.max(0, daysSinceSignup)
    };
  }

  /* ============================================================
     WELCOME CARD + PROFILE SUMMARY
     ============================================================ */
  const QUOTES = [
    "Every rep counts. Let's see where you stand today.",
    "Discipline beats motivation — let's keep the streak alive.",
    "Small consistent effort compounds into big results.",
    "Progress, not perfection. Let's check today's numbers.",
    "Your future self is built by what you do today."
  ];

  function renderWelcomeCard() {
    let displayName = "Athlete";
    try {
      if (typeof firebase !== "undefined" && firebase.auth && firebase.auth().currentUser) {
        displayName = firebase.auth().currentUser.displayName || firebase.auth().currentUser.email?.split("@")[0] || "Athlete";
      }
    } catch (e) { /* firebase not ready — keep default */ }

    document.getElementById("welcomeName").textContent = displayName;
    document.getElementById("welcomeQuote").textContent = QUOTES[new Date().getDate() % QUOTES.length];

    const membership = getMembership();
    document.getElementById("membershipPlan").textContent = membership.plan || "No Active Plan";
    const expiry = new Date(membership.expiryDate);
    const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / 86400000);
    document.getElementById("membershipExpiry").textContent = daysLeft > 0
      ? `Renews in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`
      : "Expired — renew to keep access";

    const bmi = getLatestBmi();
    const bmr = getLatestBmr();
    document.getElementById("miniBmi").textContent = bmi !== null ? bmi : "--";
    document.getElementById("miniBmr").textContent = bmr !== null ? bmr : "--";
    document.getElementById("miniStreak").textContent = computeWorkoutStreak(getWorkoutHistory());

    const stats = buildStats();
    const earned = typeof getEarnedBadges === "function" ? getEarnedBadges(stats) : [];
    document.getElementById("miniBadgeCount").textContent = earned.length;
  }

  /* ============================================================
     GOAL RINGS (Chart.js doughnuts)
     ============================================================ */
  const ringInstances = {};

  function renderRing(canvasId, consumed, target, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === "undefined") return;
    const pct = target > 0 ? Math.min(100, (consumed / target) * 100) : 0;

    if (ringInstances[canvasId]) ringInstances[canvasId].destroy();
    ringInstances[canvasId] = new Chart(canvas.getContext("2d"), {
      type: "doughnut",
      data: {
        datasets: [{
          data: [pct, 100 - pct],
          backgroundColor: [color, "rgba(255,255,255,0.07)"],
          borderWidth: 0
        }]
      },
      options: {
        cutout: "74%",
        plugins: { legend: { display: false }, tooltip: { enabled: false } }
      }
    });
  }

  function renderGoalTabs() {
    const tabs = document.getElementById("goalTabs");
    if (!tabs) return;
    tabs.querySelectorAll("[data-goal-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        tabs.querySelectorAll("[data-goal-tab]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        ["daily", "weekly", "monthly"].forEach(t => {
          const grid = document.getElementById(`goalsGrid-${t}`);
          if (grid) grid.style.display = t === btn.dataset.goalTab ? "grid" : "none";
        });
      });
    });
  }

  function renderDailyGoals() {
    const goal = getDietGoal();
    const dietHistory = getDietHistory();
    const today = dietHistory.find(d => d.date === todayKey()) || { calories: 0, protein: 0, waterMl: 0 };
    const workoutHistory = getWorkoutHistory();
    const workoutsToday = workoutHistory.filter(w => w.date.slice(0, 10) === todayKey()).length;

    const macroTargets = (window.IronEdgeDiet && typeof window.IronEdgeDiet.computeMacroTargets === "function")
      ? window.IronEdgeDiet.computeMacroTargets(goal.calorieTarget, goal.macroSplit)
      : { protein: Math.round(goal.calorieTarget * 0.3 / 4) };

    renderRing("goalCaloriesRing", today.calories, goal.calorieTarget, "#ff6a00");
    renderRing("goalWaterRing", today.waterMl, goal.waterGoalMl || 2000, "#4da3ff");
    renderRing("goalWorkoutRing", workoutsToday, 1, "#2ee6a6");
    renderRing("goalProteinRing", today.protein, macroTargets.protein, "#ffc857");

    document.getElementById("goalCaloriesText").textContent = `${Math.round(today.calories)} / ${goal.calorieTarget} kcal`;
    document.getElementById("goalWaterText").textContent = `${today.waterMl} / ${goal.waterGoalMl || 2000} ml`;
    document.getElementById("goalWorkoutText").textContent = `${workoutsToday} / 1 session`;
    document.getElementById("goalProteinText").textContent = `${Math.round(today.protein)} / ${macroTargets.protein} g`;
  }

  function renderWeeklyGoals() {
    const days = lastNDays(7);
    const workoutHistory = getWorkoutHistory();
    const dietHistory = getDietHistory();
    const goal = getDietGoal();

    const workoutsThisWeek = workoutHistory.filter(w => days.includes(w.date.slice(0, 10))).length;
    const caloriesBurnedWeek = workoutHistory
      .filter(w => days.includes(w.date.slice(0, 10)))
      .reduce((sum, w) => sum + (w.calories || 0), 0);
    const waterDaysOnTarget = dietHistory.filter(d => days.includes(d.date) && d.waterMl >= (goal.waterGoalMl || 2000)).length;

    const weeklyCalorieTarget = 2000;
    renderRing("goalWeeklyWorkoutsRing", workoutsThisWeek, 5, "#ff6a00");
    renderRing("goalWeeklyCaloriesRing", caloriesBurnedWeek, weeklyCalorieTarget, "#ff9142");
    renderRing("goalWeeklyWaterRing", waterDaysOnTarget, 7, "#4da3ff");

    document.getElementById("goalWeeklyWorkoutsText").textContent = `${workoutsThisWeek} / 5`;
    document.getElementById("goalWeeklyCaloriesText").textContent = `${Math.round(caloriesBurnedWeek)} / ${weeklyCalorieTarget} kcal`;
    document.getElementById("goalWeeklyWaterText").textContent = `${waterDaysOnTarget} / 7`;
  }

  function renderMonthlyGoals() {
    const days = lastNDays(30);
    const workoutHistory = getWorkoutHistory();
    const weightLogs = getWeightLogs();
    const goal = getDietGoal();

    const workoutsThisMonth = workoutHistory.filter(w => days.includes(w.date.slice(0, 10))).length;
    const caloriesBurnedMonth = workoutHistory
      .filter(w => days.includes(w.date.slice(0, 10)))
      .reduce((sum, w) => sum + (w.calories || 0), 0);

    const monthlyCalorieTarget = 8000;
    renderRing("goalMonthlyWorkoutsRing", workoutsThisMonth, 20, "#ff6a00");
    renderRing("goalMonthlyCaloriesRing", caloriesBurnedMonth, monthlyCalorieTarget, "#ff9142");

    document.getElementById("goalMonthlyWorkoutsText").textContent = `${workoutsThisMonth} / 20`;
    document.getElementById("goalMonthlyCaloriesText").textContent = `${Math.round(caloriesBurnedMonth)} / ${monthlyCalorieTarget} kcal`;

    const weightTextEl = document.getElementById("goalMonthlyWeightText");
    if (weightLogs.length >= 2) {
      const sorted = [...weightLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
      const first = sorted[0].weight;
      const latest = sorted[sorted.length - 1].weight;
      const diff = Math.round((latest - first) * 10) / 10;
      const onTrack = (goal.weightGoal === "lose" && diff < 0) || (goal.weightGoal === "gain" && diff > 0) || (goal.weightGoal === "maintain" && Math.abs(diff) < 1);
      renderRing("goalMonthlyWeightRing", onTrack ? 1 : 0.4, 1, onTrack ? "#2ee6a6" : "#ffc857");
      weightTextEl.textContent = `${diff > 0 ? "+" : ""}${diff} kg since first log`;
    } else {
      renderRing("goalMonthlyWeightRing", 0, 1, "#ffc857");
      weightTextEl.textContent = "Log your weight twice to see progress";
    }
  }

  /* ============================================================
     PROGRESS CHARTS
     ============================================================ */
  const chartInstances = {};

  function destroyAndCreate(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === "undefined") return;
    if (chartInstances[canvasId]) chartInstances[canvasId].destroy();
    chartInstances[canvasId] = new Chart(canvas.getContext("2d"), config);
  }

  const CHART_AXIS_OPTS = {
    x: { ticks: { color: "#9a9aa2" }, grid: { display: false } },
    y: { ticks: { color: "#9a9aa2" }, grid: { color: "rgba(255,255,255,0.06)" } }
  };

  function renderWeightProgressChart() {
    const logs = [...getWeightLogs()].sort((a, b) => new Date(a.date) - new Date(b.date));
    destroyAndCreate("weightProgressChart", {
      type: "line",
      data: {
        labels: logs.map(l => new Date(l.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })),
        datasets: [{
          label: "Weight (kg)",
          data: logs.map(l => l.weight),
          borderColor: "#ff6a00",
          backgroundColor: "rgba(255,106,0,0.15)",
          tension: 0.35,
          fill: true,
          pointBackgroundColor: "#ff6a00"
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: CHART_AXIS_OPTS }
    });
  }

  function renderCaloriesChart() {
    const days = lastNDays(7);
    const workoutHistory = getWorkoutHistory();
    const dietHistory = getDietHistory();

    const burned = days.map(d => workoutHistory.filter(w => w.date.slice(0, 10) === d).reduce((s, w) => s + (w.calories || 0), 0));
    const consumed = days.map(d => {
      const entry = dietHistory.find(h => h.date === d);
      return entry ? entry.calories : 0;
    });

    destroyAndCreate("caloriesChart", {
      type: "bar",
      data: {
        labels: days.map(d => new Date(d).toLocaleDateString(undefined, { weekday: "short" })),
        datasets: [
          { label: "Burned", data: burned, backgroundColor: "rgba(255,106,0,0.7)", borderRadius: 5, maxBarThickness: 22 },
          { label: "Consumed", data: consumed, backgroundColor: "rgba(46,230,166,0.6)", borderRadius: 5, maxBarThickness: 22 }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: "#f5f5f7" } } },
        scales: CHART_AXIS_OPTS
      }
    });
  }

  function renderWorkoutHistoryChart() {
    const days = lastNDays(7);
    const workoutHistory = getWorkoutHistory();
    const sessionCounts = days.map(d => workoutHistory.filter(w => w.date.slice(0, 10) === d).length);

    destroyAndCreate("workoutHistoryChart", {
      type: "bar",
      data: {
        labels: days.map(d => new Date(d).toLocaleDateString(undefined, { weekday: "short" })),
        datasets: [{ label: "Sessions", data: sessionCounts, backgroundColor: "rgba(255,106,0,0.7)", borderRadius: 6, maxBarThickness: 30 }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: CHART_AXIS_OPTS }
    });
  }

  function renderWaterHistoryChart() {
    const days = lastNDays(7);
    const dietHistory = getDietHistory();
    const goal = getDietGoal();
    const waterMl = days.map(d => {
      const entry = dietHistory.find(h => h.date === d);
      return entry ? entry.waterMl : 0;
    });

    destroyAndCreate("waterHistoryChart", {
      type: "bar",
      data: {
        labels: days.map(d => new Date(d).toLocaleDateString(undefined, { weekday: "short" })),
        datasets: [{
          label: "Water (ml)",
          data: waterMl,
          backgroundColor: waterMl.map(v => v >= (goal.waterGoalMl || 2000) ? "rgba(46,230,166,0.7)" : "rgba(77,163,255,0.6)"),
          borderRadius: 6,
          maxBarThickness: 30
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: CHART_AXIS_OPTS }
    });
  }

  let analyticsRange = "weekly";
  function renderAnalyticsChart() {
    const days = lastNDays(analyticsRange === "weekly" ? 7 : 30);
    const workoutHistory = getWorkoutHistory();
    const volumeData = days.map(d => workoutHistory.filter(w => w.date.slice(0, 10) === d).reduce((s, w) => s + (w.calories || 0), 0));

    destroyAndCreate("analyticsChart", {
      type: "bar",
      data: {
        labels: days.map(d => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })),
        datasets: [{ label: "Calories Burned", data: volumeData, backgroundColor: "rgba(255,106,0,0.65)", borderRadius: 5, maxBarThickness: analyticsRange === "weekly" ? 30 : 14 }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: CHART_AXIS_OPTS }
    });
  }

  function initAnalyticsToggle() {
    document.querySelectorAll("[data-analytics-range]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-analytics-range]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        analyticsRange = btn.dataset.analyticsRange;
        renderAnalyticsChart();
      });
    });
  }

  /* ============================================================
     MEMBERSHIP TIMELINE
     ============================================================ */
  function renderMembershipTimeline() {
    const wrap = document.getElementById("membershipTimeline");
    if (!wrap) return;
    const membership = getMembership();
    const joinDate = new Date(membership.joinDate);
    const expiryDate = new Date(membership.expiryDate);
    const now = new Date();

    const events = [
      { date: joinDate, title: "Joined Iron Edge Fitness", desc: `Started on the ${membership.plan} plan.`, past: joinDate < now },
      { date: now, title: "Today", desc: "Current membership status.", past: false },
      { date: expiryDate, title: expiryDate > now ? "Upcoming Renewal" : "Membership Expired", desc: expiryDate > now ? "Renew before this date to avoid interruption." : "Renew now to restore full access.", past: expiryDate < now }
    ];

    wrap.innerHTML = events.map(e => `
      <div class="ie-timeline-item ${e.past ? "past" : ""}">
        <div class="ie-timeline-date">${e.date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
        <div class="ie-timeline-title">${e.title}</div>
        <div class="ie-timeline-desc">${e.desc}</div>
      </div>
    `).join("");
  }

  /* ============================================================
     ACHIEVEMENT BADGES
     ============================================================ */
  function renderBadges() {
    const grid = document.getElementById("badgesGrid");
    if (!grid || typeof ACHIEVEMENT_BADGES === "undefined") return;

    const stats = buildStats();
    const earnedIds = new Set(getEarnedBadges(stats).map(b => b.id));

    document.getElementById("badgeTotalCount").textContent = ACHIEVEMENT_BADGES.length;
    document.getElementById("badgeEarnedCount").textContent = earnedIds.size;

    grid.innerHTML = ACHIEVEMENT_BADGES.map(b => `
      <div class="ie-badge-card glass-card ${earnedIds.has(b.id) ? "earned" : "locked"}">
        <div class="ie-badge-icon"><i class="${b.icon}"></i></div>
        <span class="ie-badge-name">${b.name}</span>
        <span class="ie-badge-desc">${b.description}</span>
      </div>
    `).join("");

    if (window.IronEdgeDashboardFirebase && typeof window.IronEdgeDashboardFirebase.saveAchievements === "function") {
      window.IronEdgeDashboardFirebase.saveAchievements([...earnedIds]);
    }
  }

  /* ============================================================
     AI RECOMMENDATIONS
     ============================================================ */
  function renderAiRecommendations() {
    if (!window.IronEdgeAI) return;
    const stats = buildStats();

    const workoutRec = window.IronEdgeAI.getWorkoutSuggestion();
    const dietRec = window.IronEdgeAI.getDietSuggestion();
    const insight = window.IronEdgeAI.getPersonalizedInsight(stats);
    const tip = window.IronEdgeAI.getDailyTipText();

    document.getElementById("aiWorkoutSuggestion").textContent = workoutRec.text;
    document.getElementById("aiDietSuggestion").textContent = dietRec.text;
    document.getElementById("aiPersonalizedInsight").textContent = insight;
    document.getElementById("aiDailyTip").textContent = tip;

    const workoutLink = document.getElementById("aiWorkoutLink");
    if (workoutLink && workoutRec.linkBodyPart) {
      workoutLink.href = `workout.html?bodypart=${workoutRec.linkBodyPart}`;
    }

    if (window.IronEdgeDashboardFirebase && typeof window.IronEdgeDashboardFirebase.saveAiRecommendations === "function") {
      window.IronEdgeDashboardFirebase.saveAiRecommendations({
        workout: workoutRec.text, diet: dietRec.text, insight, tip, date: new Date().toISOString()
      });
    }
  }

  /* ============================================================
     WEIGHT LOGGING
     ============================================================ */
  function logWeight() {
    const input = document.getElementById("weightLogInput");
    const value = Number(input.value);
    if (!value || value <= 0) {
      showToast("Enter a valid weight first");
      return;
    }
    const logs = getWeightLogs().filter(l => l.date.slice(0, 10) !== todayKey());
    logs.push({ date: new Date().toISOString(), weight: value });
    writeLS(WEIGHT_LOGS_KEY, logs);
    input.value = "";
    showToast("Weight logged for today");

    renderWeightProgressChart();
    renderMonthlyGoals();
    renderBadges();

    if (window.IronEdgeDashboardFirebase && typeof window.IronEdgeDashboardFirebase.saveDashboardStats === "function") {
      window.IronEdgeDashboardFirebase.saveDashboardStats(buildStats());
    }
  }

  /* ============================================================
     FULL RENDER + INIT
     ============================================================ */
  function renderAll() {
    renderWelcomeCard();
    renderDailyGoals();
    renderWeeklyGoals();
    renderMonthlyGoals();
    renderWeightProgressChart();
    renderCaloriesChart();
    renderWorkoutHistoryChart();
    renderWaterHistoryChart();
    renderAnalyticsChart();
    renderMembershipTimeline();
    renderBadges();
    renderAiRecommendations();

    if (window.IronEdgeDashboardFirebase && typeof window.IronEdgeDashboardFirebase.saveDashboardStats === "function") {
      window.IronEdgeDashboardFirebase.saveDashboardStats(buildStats());
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderGoalTabs();
    initAnalyticsToggle();
    renderAll();

    const logWeightBtn = document.getElementById("logWeightBtn");
    if (logWeightBtn) logWeightBtn.addEventListener("click", logWeight);

    const refreshBtn = document.getElementById("refreshDashboardBtn");
    if (refreshBtn) refreshBtn.addEventListener("click", () => { renderAll(); showToast("Dashboard refreshed"); });

    const refreshAiBtn = document.getElementById("refreshAiBtn");
    if (refreshAiBtn) refreshAiBtn.addEventListener("click", () => { renderAiRecommendations(); showToast("AI insights refreshed"); });
  });

  window.IronEdgeDashboard = { renderAll, buildStats };
})();
