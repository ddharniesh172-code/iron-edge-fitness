/* ============================================================
   IRON EDGE FITNESS — diet.js
   Handles: meal planner, macro/calorie dashboard, water tracker,
   weight goal, food search + nutrition facts modals, diet history.
   Expects FOOD_DATA (food-data.js) loaded first. Works alongside
   calculators.js (BMI/BMR/TDEE/Water) and firebase/diet.js (sync).
   Safe to include on any page — every function checks for its
   DOM elements before touching them.
   ============================================================ */

(function () {
  "use strict";

  /* ============================================================
     STORAGE KEYS
     ============================================================ */
  const LS_GOAL = "ie_diet_goal";
  const LS_HISTORY = "ie_diet_history";
  const MEAL_TYPES = ["breakfast", "lunch", "snacks", "dinner"];
  const WATER_GLASS_ML = 250;
  const DEFAULT_WATER_GOAL_ML = 2000;

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function mealsKeyForToday() { return `ie_diet_meals_${todayKey()}`; }
  function waterKeyForToday() { return `ie_diet_water_${todayKey()}`; }

  /* ============================================================
     STORAGE HELPERS
     ============================================================ */
  function readLS(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error("IronEdge Diet storage read error:", e);
      return fallback;
    }
  }
  function writeLS(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("IronEdge Diet storage write error:", e);
    }
  }

  /* ============================================================
     TOAST (shared pattern with workout.js — safe standalone copy)
     ============================================================ */
  let toastTimeout;
  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  /* ============================================================
     GOAL STATE
     ============================================================ */
  function getGoal() {
    return readLS(LS_GOAL, {
      weightGoal: "maintain",
      calorieTarget: 2200,
      macroSplit: "balanced",
      waterGoalMl: DEFAULT_WATER_GOAL_ML
    });
  }

  function saveGoal(goal) {
    writeLS(LS_GOAL, goal);
    if (window.IronEdgeDietFirebase && typeof window.IronEdgeDietFirebase.saveDietPlan === "function") {
      window.IronEdgeDietFirebase.saveDietPlan(goal);
    }
  }

  const MACRO_SPLITS = {
    balanced: { protein: 0.30, carbs: 0.40, fat: 0.30 },
    highProtein: { protein: 0.40, carbs: 0.35, fat: 0.25 },
    lowCarb: { protein: 0.35, carbs: 0.25, fat: 0.40 },
    custom: { protein: 0.30, carbs: 0.40, fat: 0.30 }
  };

  function computeMacroTargets(calorieTarget, splitKey) {
    const split = MACRO_SPLITS[splitKey] || MACRO_SPLITS.balanced;
    return {
      protein: Math.round((calorieTarget * split.protein) / 4),
      carbs: Math.round((calorieTarget * split.carbs) / 4),
      fat: Math.round((calorieTarget * split.fat) / 9)
    };
  }

  /* Public setters used by calculators.js "push to diet" buttons */
  function setCalorieTarget(kcal) {
    const goal = getGoal();
    goal.calorieTarget = Math.round(kcal);
    saveGoal(goal);
    renderGoalInputs();
    renderDashboard();
    showToast(`Calorie target set to ${goal.calorieTarget} kcal`);
  }

  function setWaterGoal(ml) {
    const goal = getGoal();
    goal.waterGoalMl = Math.round(ml);
    saveGoal(goal);
    renderWaterTracker();
    showToast(`Water goal set to ${goal.waterGoalMl} ml`);
  }

  /* ============================================================
     MEALS STATE (scoped to today)
     ============================================================ */
  function getTodayMeals() {
    return readLS(mealsKeyForToday(), { breakfast: [], lunch: [], snacks: [], dinner: [] });
  }

  function saveTodayMeals(meals) {
    writeLS(mealsKeyForToday(), meals);
    if (window.IronEdgeDietFirebase && typeof window.IronEdgeDietFirebase.saveCalorieLog === "function") {
      window.IronEdgeDietFirebase.saveCalorieLog({ date: todayKey(), meals });
    }
    updateHistoryEntryForToday(meals);
  }

  function addFoodToMeal(mealType, scaledFood) {
    const meals = getTodayMeals();
    if (!meals[mealType]) meals[mealType] = [];
    meals[mealType].push({ ...scaledFood, entryId: `${scaledFood.id}-${Date.now()}` });
    saveTodayMeals(meals);
    renderMealPlanner();
    renderDashboard();
    showToast(`${scaledFood.name} added to ${mealType}`);
  }

  function removeFoodFromMeal(mealType, entryId) {
    const meals = getTodayMeals();
    if (!meals[mealType]) return;
    meals[mealType] = meals[mealType].filter(item => item.entryId !== entryId);
    saveTodayMeals(meals);
    renderMealPlanner();
    renderDashboard();
  }

  function clearAllMeals() {
    saveTodayMeals({ breakfast: [], lunch: [], snacks: [], dinner: [] });
    renderMealPlanner();
    renderDashboard();
    showToast("All meals cleared for today");
  }

  function computeMealTotals(meals) {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    MEAL_TYPES.forEach(type => {
      (meals[type] || []).forEach(item => {
        totals.calories += item.calories || 0;
        totals.protein += item.protein || 0;
        totals.carbs += item.carbs || 0;
        totals.fat += item.fat || 0;
      });
    });
    return totals;
  }

  /* ============================================================
     WATER STATE (scoped to today)
     ============================================================ */
  function getTodayWater() {
    return readLS(waterKeyForToday(), { ml: 0 });
  }

  function saveTodayWater(waterObj) {
    writeLS(waterKeyForToday(), waterObj);
    if (window.IronEdgeDietFirebase && typeof window.IronEdgeDietFirebase.saveWaterIntake === "function") {
      window.IronEdgeDietFirebase.saveWaterIntake({ date: todayKey(), ml: waterObj.ml });
    }
    updateHistoryEntryForToday(null, waterObj.ml);
  }

  function adjustWater(deltaMl) {
    const water = getTodayWater();
    water.ml = Math.max(0, water.ml + deltaMl);
    saveTodayWater(water);
    renderWaterTracker();
  }

  /* ============================================================
     DIET HISTORY (one rolling entry per day)
     ============================================================ */
  function getHistory() { return readLS(LS_HISTORY, []); }

  function updateHistoryEntryForToday(meals, waterMlOverride) {
    const history = getHistory();
    const date = todayKey();
    const totals = computeMealTotals(meals || getTodayMeals());
    const water = waterMlOverride !== undefined ? waterMlOverride : getTodayWater().ml;

    const existingIndex = history.findIndex(h => h.date === date);
    const entry = {
      date,
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein),
      carbs: Math.round(totals.carbs),
      fat: Math.round(totals.fat),
      waterMl: water
    };

    if (existingIndex >= 0) {
      history[existingIndex] = entry;
    } else {
      history.unshift(entry);
    }
    writeLS(LS_HISTORY, history.slice(0, 60));
  }

  function renderDietHistory() {
    const list = document.getElementById("dietHistoryList");
    if (!list) return;
    const history = getHistory();

    if (history.length === 0) {
      list.innerHTML = `<p style="color:var(--ie-gray); font-size:0.85rem;">No diet history yet. Log a meal to start tracking.</p>`;
      return;
    }

    list.innerHTML = history.slice(0, 14).map(h => `
      <div class="ie-history-item">
        <div>
          <div class="ie-hist-name">${new Date(h.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>
          <div class="ie-hist-date">P ${h.protein}g &middot; C ${h.carbs}g &middot; F ${h.fat}g &middot; ${h.waterMl}ml water</div>
        </div>
        <div class="ie-hist-cal">${h.calories} cal</div>
      </div>
    `).join("");
  }

  /* ============================================================
     DASHBOARD RENDERING
     ============================================================ */
  let caloriesRingInstance = null;

  function renderDashboard() {
    const ringCanvas = document.getElementById("caloriesRingChart");
    if (!ringCanvas) return; // not on diet-planner.html

    const goal = getGoal();
    const meals = getTodayMeals();
    const totals = computeMealTotals(meals);
    const macroTargets = computeMacroTargets(goal.calorieTarget, goal.macroSplit);

    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setText("caloriesConsumedLabel", Math.round(totals.calories));
    setText("caloriesTargetLabel", goal.calorieTarget);
    setText("proteinConsumed", Math.round(totals.protein));
    setText("proteinTarget", macroTargets.protein);
    setText("carbsConsumed", Math.round(totals.carbs));
    setText("carbsTarget", macroTargets.carbs);
    setText("fatConsumed", Math.round(totals.fat));
    setText("fatTarget", macroTargets.fat);

    const setBar = (id, consumed, target) => {
      const bar = document.getElementById(id);
      if (!bar) return;
      const pct = target > 0 ? Math.min(100, (consumed / target) * 100) : 0;
      bar.style.width = `${pct}%`;
    };
    setBar("proteinBar", totals.protein, macroTargets.protein);
    setBar("carbsBar", totals.carbs, macroTargets.carbs);
    setBar("fatBar", totals.fat, macroTargets.fat);

    if (typeof Chart !== "undefined") {
      const remaining = Math.max(0, goal.calorieTarget - totals.calories);
      const overage = Math.max(0, totals.calories - goal.calorieTarget);

      if (caloriesRingInstance) caloriesRingInstance.destroy();
      caloriesRingInstance = new Chart(ringCanvas.getContext("2d"), {
        type: "doughnut",
        data: {
          labels: ["Consumed", overage > 0 ? "Over Target" : "Remaining"],
          datasets: [{
            data: overage > 0 ? [goal.calorieTarget, overage] : [totals.calories, remaining],
            backgroundColor: overage > 0 ? ["#ff6a00", "#ff4d4d"] : ["#ff6a00", "rgba(255,255,255,0.08)"],
            borderWidth: 0
          }]
        },
        options: {
          cutout: "72%",
          plugins: { legend: { display: false }, tooltip: { enabled: true } }
        }
      });
    }

    const dateLabel = document.getElementById("todayDateLabel");
    if (dateLabel) {
      dateLabel.textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    }

    renderDietHistory();
  }

  /* ============================================================
     WATER TRACKER RENDERING
     ============================================================ */
  function renderWaterTracker() {
    const wrap = document.getElementById("waterGlasses");
    if (!wrap) return;

    const goal = getGoal();
    const water = getTodayWater();
    const totalGlasses = Math.max(1, Math.round(goal.waterGoalMl / WATER_GLASS_ML));
    const filledGlasses = Math.round(water.ml / WATER_GLASS_ML);

    wrap.innerHTML = "";
    for (let i = 0; i < totalGlasses; i++) {
      const glass = document.createElement("div");
      glass.className = `ie-water-glass ${i < filledGlasses ? "filled" : ""}`;
      wrap.appendChild(glass);
    }

    const countEl = document.getElementById("waterCount");
    if (countEl) countEl.textContent = `${filledGlasses} / ${totalGlasses}`;

    const amountLabel = document.getElementById("waterAmountLabel");
    if (amountLabel) amountLabel.textContent = `${water.ml} ml`;
  }

  /* ============================================================
     MEAL PLANNER RENDERING
     ============================================================ */
  function buildMealItemRow(mealType, item) {
    const row = document.createElement("div");
    row.className = "ie-meal-item";
    row.innerHTML = `
      <div class="ie-meal-item-info">
        <span class="ie-meal-item-name">${item.name}</span>
        <span class="ie-meal-item-meta">${item.servings}x ${item.serving} &middot; P${item.protein}g C${item.carbs}g F${item.fat}g</span>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="color:var(--ie-orange-light); font-weight:700; font-size:0.8rem;">${item.calories} cal</span>
        <button class="ie-meal-item-remove" data-remove-meal="${mealType}" data-remove-entry="${item.entryId}">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `;
    return row;
  }

  function renderMealPlanner() {
    const meals = getTodayMeals();
    if (!document.getElementById("breakfastItems")) return; // not on diet-planner.html

    MEAL_TYPES.forEach(type => {
      const container = document.getElementById(`${type}Items`);
      const calLabel = document.getElementById(`${type}Cal`);
      if (!container) return;

      container.innerHTML = "";
      let mealCalories = 0;
      (meals[type] || []).forEach(item => {
        container.appendChild(buildMealItemRow(type, item));
        mealCalories += item.calories || 0;
      });

      if (calLabel) calLabel.textContent = `${Math.round(mealCalories)} kcal`;
    });

    document.querySelectorAll("[data-remove-meal]").forEach(btn => {
      btn.addEventListener("click", () => {
        removeFoodFromMeal(btn.dataset.removeMeal, btn.dataset.removeEntry);
      });
    });
  }

  /* ============================================================
     FOOD SEARCH MODAL
     ============================================================ */
  let activeMealTarget = null;
  let activeFoodCategory = "all";
  let selectedFoodForFacts = null;

  function openFoodSearchModal(mealType) {
    activeMealTarget = mealType;
    const modal = document.getElementById("foodSearchModal");
    const mealNameEl = document.getElementById("foodModalMealName");
    if (mealNameEl) mealNameEl.textContent = mealType.charAt(0).toUpperCase() + mealType.slice(1);
    if (modal) modal.style.display = "flex";
    renderFoodSearchResults();
  }

  function closeFoodSearchModal() {
    const modal = document.getElementById("foodSearchModal");
    if (modal) modal.style.display = "none";
    const input = document.getElementById("foodSearchInput");
    if (input) input.value = "";
  }

  function renderFoodSearchResults() {
    const resultsWrap = document.getElementById("foodSearchResults");
    if (!resultsWrap) return;

    const query = document.getElementById("foodSearchInput")?.value || "";
    const results = typeof searchFoods === "function" ? searchFoods(query, activeFoodCategory) : [];

    if (results.length === 0) {
      resultsWrap.innerHTML = `<p style="color:var(--ie-gray); text-align:center; padding:20px 0;">No foods match your search.</p>`;
      return;
    }

    resultsWrap.innerHTML = results.map(f => `
      <div class="ie-food-result-item" data-food-id="${f.id}">
        <div>
          <div class="ie-food-result-name">${f.name}</div>
          <div class="ie-food-result-meta">${f.serving} &middot; P${f.protein}g C${f.carbs}g F${f.fat}g</div>
        </div>
        <div class="ie-food-result-cal">${f.calories} cal</div>
      </div>
    `).join("");

    resultsWrap.querySelectorAll("[data-food-id]").forEach(el => {
      el.addEventListener("click", () => openNutritionFactsModal(el.dataset.foodId));
    });
  }

  /* ============================================================
     NUTRITION FACTS MODAL
     ============================================================ */
  function openNutritionFactsModal(foodId) {
    const food = getFoodById(foodId);
    if (!food) return;
    selectedFoodForFacts = food;

    document.getElementById("nutritionFoodName").textContent = food.name;
    const servingInput = document.getElementById("servingInput");
    if (servingInput) servingInput.value = 1;

    renderNutritionFactsBody(1);

    const modal = document.getElementById("nutritionFactsModal");
    if (modal) modal.style.display = "flex";
  }

  function renderNutritionFactsBody(servings) {
    const body = document.getElementById("nutritionFactsBody");
    if (!body || !selectedFoodForFacts) return;

    const scaled = scaleFoodByServings(selectedFoodForFacts, servings);
    body.innerHTML = `
      <div class="ie-nutrition-row total"><span>Calories</span><span>${scaled.calories} kcal</span></div>
      <div class="ie-nutrition-row"><span>Protein</span><span>${scaled.protein} g</span></div>
      <div class="ie-nutrition-row"><span>Carbohydrates</span><span>${scaled.carbs} g</span></div>
      <div class="ie-nutrition-row"><span>Fat</span><span>${scaled.fat} g</span></div>
      <div class="ie-nutrition-row"><span>Serving</span><span>${scaled.servings}x ${selectedFoodForFacts.serving}</span></div>
    `;
  }

  function closeNutritionFactsModal() {
    const modal = document.getElementById("nutritionFactsModal");
    if (modal) modal.style.display = "none";
    selectedFoodForFacts = null;
  }

  /* ============================================================
     EVENT WIRING
     ============================================================ */
  function renderGoalInputs() {
    const goal = getGoal();
    const weightGoalSelect = document.getElementById("weightGoalSelect");
    const calorieTargetInput = document.getElementById("calorieTargetInput");
    const macroSplitSelect = document.getElementById("macroSplitSelect");

    if (weightGoalSelect) weightGoalSelect.value = goal.weightGoal;
    if (calorieTargetInput) calorieTargetInput.value = goal.calorieTarget;
    if (macroSplitSelect) macroSplitSelect.value = goal.macroSplit;
  }

  function initDietPlannerPage() {
    if (!document.getElementById("breakfastItems")) return; // only run on diet-planner.html

    renderGoalInputs();
    renderMealPlanner();
    renderDashboard();
    renderWaterTracker();
    renderDietHistory();

    const saveGoalBtn = document.getElementById("saveGoalBtn");
    if (saveGoalBtn) {
      saveGoalBtn.addEventListener("click", () => {
        const goal = getGoal();
        goal.weightGoal = document.getElementById("weightGoalSelect").value;
        goal.calorieTarget = Number(document.getElementById("calorieTargetInput").value) || goal.calorieTarget;
        goal.macroSplit = document.getElementById("macroSplitSelect").value;
        saveGoal(goal);
        renderDashboard();
        showToast("Diet goal saved");
      });
    }

    document.querySelectorAll("[data-meal]").forEach(btn => {
      if (btn.classList.contains("ie-add-food-btn")) {
        btn.addEventListener("click", () => openFoodSearchModal(btn.dataset.meal));
      }
    });

    const clearMealsBtn = document.getElementById("clearMealsBtn");
    if (clearMealsBtn) clearMealsBtn.addEventListener("click", clearAllMeals);

    // Water tracker buttons
    const waterPlusBtn = document.getElementById("waterPlusBtn");
    const waterMinusBtn = document.getElementById("waterMinusBtn");
    if (waterPlusBtn) waterPlusBtn.addEventListener("click", () => adjustWater(WATER_GLASS_ML));
    if (waterMinusBtn) waterMinusBtn.addEventListener("click", () => adjustWater(-WATER_GLASS_ML));

    // Food search modal wiring
    const foodModalCloseBtn = document.getElementById("foodModalCloseBtn");
    if (foodModalCloseBtn) foodModalCloseBtn.addEventListener("click", closeFoodSearchModal);

    const foodSearchInput = document.getElementById("foodSearchInput");
    if (foodSearchInput) foodSearchInput.addEventListener("input", renderFoodSearchResults);

    document.querySelectorAll("[data-food-cat]").forEach(chip => {
      chip.addEventListener("click", () => {
        activeFoodCategory = chip.dataset.foodCat;
        document.querySelectorAll("[data-food-cat]").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        renderFoodSearchResults();
      });
    });

    // Nutrition facts modal wiring
    const nutritionModalCloseBtn = document.getElementById("nutritionModalCloseBtn");
    if (nutritionModalCloseBtn) nutritionModalCloseBtn.addEventListener("click", closeNutritionFactsModal);

    const servingInput = document.getElementById("servingInput");
    if (servingInput) {
      servingInput.addEventListener("input", (e) => renderNutritionFactsBody(e.target.value));
    }

    const confirmAddFoodBtn = document.getElementById("confirmAddFoodBtn");
    if (confirmAddFoodBtn) {
      confirmAddFoodBtn.addEventListener("click", () => {
        if (!selectedFoodForFacts || !activeMealTarget) return;
        const servings = Number(document.getElementById("servingInput").value) || 1;
        const scaled = scaleFoodByServings(selectedFoodForFacts, servings);
        addFoodToMeal(activeMealTarget, scaled);
        closeNutritionFactsModal();
        closeFoodSearchModal();
      });
    }

    // Close modals on overlay click
    [["foodSearchModal", closeFoodSearchModal], ["nutritionFactsModal", closeNutritionFactsModal]].forEach(([id, closeFn]) => {
      const overlay = document.getElementById(id);
      if (overlay) {
        overlay.addEventListener("click", (e) => { if (e.target === overlay) closeFn(); });
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initDietPlannerPage);

  /* ============================================================
     PUBLIC API (used by calculators.js "push to diet" buttons)
     ============================================================ */
  window.IronEdgeDiet = {
    getGoal,
    saveGoal,
    setCalorieTarget,
    setWaterGoal,
    computeMacroTargets,
    getTodayMeals,
    getTodayWater,
    getHistory,
    showToast
  };
})();
