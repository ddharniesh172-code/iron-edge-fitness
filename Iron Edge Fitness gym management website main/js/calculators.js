/* ============================================================
   IRON EDGE FITNESS — calculators.js
   Handles: tab switching, BMI, BMR (Mifflin-St Jeor), TDEE /
   daily calorie needs, and water intake goal calculations on
   nutrition-calculator.html. Also saves BMI/BMR history and
   wires "push to diet" / "push to water goal" actions.
   Safe to include on any page — checks for DOM elements first.
   ============================================================ */

(function () {
  "use strict";

  const LS_CALC_HISTORY = "ie_calc_history";

  function readLS(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error("IronEdge Calculators storage read error:", e);
      return fallback;
    }
  }
  function writeLS(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.error("IronEdge Calculators storage write error:", e); }
  }

  function showToast(message) {
    if (window.IronEdgeDiet && typeof window.IronEdgeDiet.showToast === "function") {
      window.IronEdgeDiet.showToast(message);
      return;
    }
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2600);
  }

  /* ============================================================
     PROFILE INPUT READER
     ============================================================ */
  function readProfile() {
    const gender = document.getElementById("calcGender")?.value || "male";
    const age = Number(document.getElementById("calcAge")?.value) || 0;
    const height = Number(document.getElementById("calcHeight")?.value) || 0;
    const weight = Number(document.getElementById("calcWeight")?.value) || 0;
    const activity = Number(document.getElementById("calcActivity")?.value) || 1.55;
    return { gender, age, height, weight, activity };
  }

  function validateProfile(profile, requireAgeHeight = true) {
    if (!profile.weight || profile.weight <= 0) {
      showToast("Please enter your weight first");
      return false;
    }
    if (requireAgeHeight && (!profile.height || !profile.age)) {
      showToast("Please enter your age and height first");
      return false;
    }
    return true;
  }

  /* ============================================================
     CALCULATION HISTORY
     ============================================================ */
  function saveCalcHistory(entry) {
    const history = readLS(LS_CALC_HISTORY, []);
    history.unshift({ ...entry, date: new Date().toISOString() });
    writeLS(LS_CALC_HISTORY, history.slice(0, 40));

    if (window.IronEdgeDietFirebase && typeof window.IronEdgeDietFirebase.saveBmiBmrHistory === "function") {
      window.IronEdgeDietFirebase.saveBmiBmrHistory(entry);
    }
    renderCalcHistory();
  }

  function renderCalcHistory() {
    const list = document.getElementById("calcHistoryList");
    if (!list) return;
    const history = readLS(LS_CALC_HISTORY, []);

    if (history.length === 0) {
      list.innerHTML = `<p style="color:var(--ie-gray); font-size:0.85rem;">No calculations yet. Try the BMI or BMR tools above.</p>`;
      return;
    }

    list.innerHTML = history.slice(0, 12).map(h => `
      <div class="ie-history-item">
        <div>
          <div class="ie-hist-name">${h.label}</div>
          <div class="ie-hist-date">${new Date(h.date).toLocaleString()}</div>
        </div>
        <div class="ie-hist-cal">${h.value}</div>
      </div>
    `).join("");
  }

  /* ============================================================
     TAB SWITCHING
     ============================================================ */
  function initTabs() {
    const tabs = document.getElementById("calcTabs");
    if (!tabs) return;

    tabs.querySelectorAll("[data-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        tabs.querySelectorAll("[data-tab]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        document.querySelectorAll(".ie-calc-panel").forEach(panel => panel.style.display = "none");
        const target = document.getElementById(`panel-${btn.dataset.tab}`);
        if (target) target.style.display = "block";
      });
    });
  }

  /* ============================================================
     BMI CALCULATOR
     ============================================================ */
  function classifyBmi(bmi) {
    if (bmi < 18.5) return { label: "Underweight", css: "under" };
    if (bmi < 25) return { label: "Normal Weight", css: "normal" };
    if (bmi < 30) return { label: "Overweight", css: "over" };
    return { label: "Obese", css: "obese" };
  }

  function calculateBmi() {
    const profile = readProfile();
    if (!validateProfile(profile, false)) return;
    if (!profile.height) { showToast("Please enter your height first"); return; }

    const heightM = profile.height / 100;
    const bmi = profile.weight / (heightM * heightM);
    const rounded = Math.round(bmi * 10) / 10;
    const category = classifyBmi(bmi);

    const valueEl = document.getElementById("bmiValue");
    const categoryEl = document.getElementById("bmiCategory");
    const markerEl = document.getElementById("bmiMarker");

    if (valueEl) valueEl.textContent = rounded;
    if (categoryEl) categoryEl.textContent = `${category.label} (BMI ${rounded})`;

    if (markerEl) {
      // Map BMI range ~15 to ~40 onto 0%-100% of the scale bar
      const pct = Math.min(100, Math.max(0, ((bmi - 15) / (40 - 15)) * 100));
      markerEl.style.left = `${pct}%`;
    }

    saveCalcHistory({ type: "bmi", label: "BMI Calculated", value: `${rounded} (${category.label})` });
  }

  /* ============================================================
     BMR CALCULATOR — Mifflin-St Jeor
     ============================================================ */
  function calculateBmrValue(profile) {
    const base = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age);
    return profile.gender === "male" ? base + 5 : base - 161;
  }

  function calculateBmr() {
    const profile = readProfile();
    if (!validateProfile(profile)) return;

    const bmr = Math.round(calculateBmrValue(profile));
    const valueEl = document.getElementById("bmrValue");
    if (valueEl) valueEl.textContent = bmr;

    saveCalcHistory({ type: "bmr", label: "BMR Calculated", value: `${bmr} kcal/day` });
  }

  /* ============================================================
     TDEE / CALORIE NEEDS CALCULATOR
     ============================================================ */
  let lastTdeeValue = null;

  function calculateTdee() {
    const profile = readProfile();
    if (!validateProfile(profile)) return;

    const bmr = calculateBmrValue(profile);
    const tdee = Math.round(bmr * profile.activity);

    const goalSelect = document.getElementById("calorieGoalSelect");
    const goal = goalSelect ? goalSelect.value : "maintain";
    let adjusted = tdee;
    let goalLabel = "Maintenance calories at your activity level";

    if (goal === "lose") { adjusted = tdee - 500; goalLabel = "Calorie target for steady weight loss (~0.5kg/week)"; }
    if (goal === "gain") { adjusted = tdee + 500; goalLabel = "Calorie target for steady weight gain (~0.5kg/week)"; }

    lastTdeeValue = adjusted;

    const valueEl = document.getElementById("tdeeValue");
    const labelEl = document.getElementById("tdeeGoalLabel");
    if (valueEl) valueEl.textContent = adjusted;
    if (labelEl) labelEl.textContent = goalLabel;

    saveCalcHistory({ type: "tdee", label: `Calorie Needs (${goal})`, value: `${adjusted} kcal/day` });
  }

  function pushTdeeToDiet() {
    if (!lastTdeeValue) {
      showToast("Calculate your calorie needs first");
      return;
    }
    if (window.IronEdgeDiet && typeof window.IronEdgeDiet.setCalorieTarget === "function") {
      window.IronEdgeDiet.setCalorieTarget(lastTdeeValue);
    } else {
      showToast("Diet planner not loaded on this page");
    }
  }

  /* ============================================================
     WATER GOAL CALCULATOR
     ============================================================ */
  let lastWaterGoalMl = null;

  function calculateWaterGoal() {
    const profile = readProfile();
    if (!validateProfile(profile, false)) return;

    // Base: 35ml per kg bodyweight, plus an activity buffer for higher activity levels
    const activityBuffer = profile.activity >= 1.725 ? 500 : profile.activity >= 1.55 ? 300 : 0;
    const goalMl = Math.round((profile.weight * 35) + activityBuffer);
    lastWaterGoalMl = goalMl;

    const valueEl = document.getElementById("waterGoalValue");
    const glassesEl = document.getElementById("waterGoalGlasses");
    const glasses = Math.round(goalMl / 250);

    if (valueEl) valueEl.textContent = goalMl;
    if (glassesEl) glassesEl.textContent = `≈ ${glasses} glasses (250ml each)`;

    saveCalcHistory({ type: "water", label: "Water Goal Calculated", value: `${goalMl} ml/day` });
  }

  function pushWaterGoalToDiet() {
    if (!lastWaterGoalMl) {
      showToast("Calculate your water goal first");
      return;
    }
    if (window.IronEdgeDiet && typeof window.IronEdgeDiet.setWaterGoal === "function") {
      window.IronEdgeDiet.setWaterGoal(lastWaterGoalMl);
    } else {
      showToast("Diet planner not loaded on this page");
    }
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    if (!document.getElementById("calcTabs")) return; // not on nutrition-calculator.html

    initTabs();
    renderCalcHistory();

    const calcBmiBtn = document.getElementById("calcBmiBtn");
    const calcBmrBtn = document.getElementById("calcBmrBtn");
    const calcTdeeBtn = document.getElementById("calcTdeeBtn");
    const calcWaterBtn = document.getElementById("calcWaterBtn");
    const pushToDietBtn = document.getElementById("pushToDietBtn");
    const pushToWaterBtn = document.getElementById("pushToWaterBtn");

    if (calcBmiBtn) calcBmiBtn.addEventListener("click", calculateBmi);
    if (calcBmrBtn) calcBmrBtn.addEventListener("click", calculateBmr);
    if (calcTdeeBtn) calcTdeeBtn.addEventListener("click", calculateTdee);
    if (calcWaterBtn) calcWaterBtn.addEventListener("click", calculateWaterGoal);
    if (pushToDietBtn) pushToDietBtn.addEventListener("click", pushTdeeToDiet);
    if (pushToWaterBtn) pushToWaterBtn.addEventListener("click", pushWaterGoalToDiet);
  }

  document.addEventListener("DOMContentLoaded", init);

  window.IronEdgeCalculators = {
    calculateBmi,
    calculateBmr,
    calculateTdee,
    calculateWaterGoal
  };
})();
