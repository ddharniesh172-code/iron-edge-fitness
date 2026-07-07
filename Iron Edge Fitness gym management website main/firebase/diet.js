/* ============================================================
   IRON EDGE FITNESS — firebase/diet.js
   Persists diet plans, calorie logs, water intake and BMI/BMR
   history to Firestore under the signed-in user's document.

   Assumes ../js/firebase-config.js has already run:
     firebase.initializeApp({ ...yourConfig });
   and that the firebase-app / firebase-auth / firebase-firestore
   compat SDKs are loaded on the page before this file.

   Falls back gracefully (logs + no-ops) if Firebase isn't
   configured yet, so diet.js / calculators.js keep working on
   localStorage alone.
   ============================================================ */

(function () {
  "use strict";

  let db = null;
  let auth = null;
  let firebaseReady = false;

  try {
    if (typeof firebase !== "undefined" && firebase.apps && firebase.apps.length) {
      db = firebase.firestore();
      auth = firebase.auth();
      firebaseReady = true;
    } else {
      console.warn("IronEdge Firebase (diet): no initialized Firebase app found. " +
        "Diet data will only be saved to localStorage until firebase-config.js initializes the app.");
    }
  } catch (e) {
    console.warn("IronEdge Firebase (diet): initialization skipped —", e.message);
  }

  function getCurrentUserId() {
    if (!firebaseReady || !auth || !auth.currentUser) return null;
    return auth.currentUser.uid;
  }

  function usersCollection() {
    return db.collection("users");
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  /* ============================================================
     SAVE: DIET PLAN / GOAL (weight goal, calorie target, macro split, water goal)
     ============================================================ */
  async function saveDietPlan(goal) {
    const uid = getCurrentUserId();
    if (!firebaseReady || !uid) {
      console.info("IronEdge Firebase (diet): skipped saveDietPlan (not signed in).");
      return { success: false, reason: "not-signed-in" };
    }
    try {
      await usersCollection().doc(uid).set({
        dietPlan: { ...goal, updatedAt: new Date().toISOString() }
      }, { merge: true });
      return { success: true };
    } catch (e) {
      console.error("IronEdge Firebase (diet): saveDietPlan failed —", e);
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
     SAVE: CALORIE LOG (per-day meals snapshot, keyed by date)
     ============================================================ */
  async function saveCalorieLog({ date, meals }) {
    const uid = getCurrentUserId();
    if (!firebaseReady || !uid) {
      console.info("IronEdge Firebase (diet): skipped saveCalorieLog (not signed in).");
      return { success: false, reason: "not-signed-in" };
    }
    try {
      const day = date || todayKey();
      await usersCollection().doc(uid)
        .collection("calorieLogs").doc(day)
        .set({ date: day, meals, savedAt: new Date().toISOString() }, { merge: true });
      return { success: true };
    } catch (e) {
      console.error("IronEdge Firebase (diet): saveCalorieLog failed —", e);
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
     SAVE: WATER INTAKE (per-day, keyed by date)
     ============================================================ */
  async function saveWaterIntake({ date, ml }) {
    const uid = getCurrentUserId();
    if (!firebaseReady || !uid) {
      console.info("IronEdge Firebase (diet): skipped saveWaterIntake (not signed in).");
      return { success: false, reason: "not-signed-in" };
    }
    try {
      const day = date || todayKey();
      await usersCollection().doc(uid)
        .collection("waterLogs").doc(day)
        .set({ date: day, ml, savedAt: new Date().toISOString() }, { merge: true });
      return { success: true };
    } catch (e) {
      console.error("IronEdge Firebase (diet): saveWaterIntake failed —", e);
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
     SAVE: BMI / BMR / TDEE / WATER-GOAL HISTORY ENTRY
     ============================================================ */
  async function saveBmiBmrHistory(entry) {
    const uid = getCurrentUserId();
    if (!firebaseReady || !uid) {
      console.info("IronEdge Firebase (diet): skipped saveBmiBmrHistory (not signed in).");
      return { success: false, reason: "not-signed-in" };
    }
    try {
      await usersCollection().doc(uid).set({
        calcHistory: firebase.firestore.FieldValue.arrayUnion({
          ...entry,
          savedAt: new Date().toISOString()
        })
      }, { merge: true });
      return { success: true };
    } catch (e) {
      console.error("IronEdge Firebase (diet): saveBmiBmrHistory failed —", e);
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
     LOAD: FULL DIET PROFILE (plan, recent logs, calc history)
     ============================================================ */
  async function loadDietProfile() {
    const uid = getCurrentUserId();
    if (!firebaseReady || !uid) {
      return { success: false, reason: "not-signed-in" };
    }

    try {
      const docSnap = await usersCollection().doc(uid).get();
      const data = docSnap.exists ? docSnap.data() : {};

      const calorieLogsSnap = await usersCollection().doc(uid)
        .collection("calorieLogs").orderBy("date", "desc").limit(30).get();
      const waterLogsSnap = await usersCollection().doc(uid)
        .collection("waterLogs").orderBy("date", "desc").limit(30).get();

      return {
        success: true,
        data: {
          dietPlan: data.dietPlan || null,
          calcHistory: data.calcHistory || [],
          calorieLogs: calorieLogsSnap.docs.map(d => d.data()),
          waterLogs: waterLogsSnap.docs.map(d => d.data())
        }
      };
    } catch (e) {
      console.error("IronEdge Firebase (diet): loadDietProfile failed —", e);
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
     HYDRATE LOCALSTORAGE FROM CLOUD ON LOGIN
     ============================================================ */
  async function hydrateFromCloudOnLogin() {
    if (!firebaseReady || !auth) return;

    auth.onAuthStateChanged(async (user) => {
      if (!user) return;

      const result = await loadDietProfile();
      if (!result.success) return;

      try {
        // Diet plan / goal — cloud wins if local is unset
        if (result.data.dietPlan && !localStorage.getItem("ie_diet_goal")) {
          localStorage.setItem("ie_diet_goal", JSON.stringify(result.data.dietPlan));
        }

        // Calc history — merge by savedAt uniqueness
        const localCalcHistory = JSON.parse(localStorage.getItem("ie_calc_history") || "[]");
        const mergedCalcHistory = [...localCalcHistory, ...result.data.calcHistory]
          .sort((a, b) => new Date(b.date || b.savedAt) - new Date(a.date || a.savedAt))
          .slice(0, 40);
        localStorage.setItem("ie_calc_history", JSON.stringify(mergedCalcHistory));

        // Today's meals — hydrate only if local is empty for today
        const todayMealsKey = `ie_diet_meals_${todayKey()}`;
        if (!localStorage.getItem(todayMealsKey)) {
          const todayLog = result.data.calorieLogs.find(l => l.date === todayKey());
          if (todayLog && todayLog.meals) {
            localStorage.setItem(todayMealsKey, JSON.stringify(todayLog.meals));
          }
        }

        // Today's water — hydrate only if local is empty for today
        const todayWaterKey = `ie_diet_water_${todayKey()}`;
        if (!localStorage.getItem(todayWaterKey)) {
          const todayWater = result.data.waterLogs.find(l => l.date === todayKey());
          if (todayWater) {
            localStorage.setItem(todayWaterKey, JSON.stringify({ ml: todayWater.ml }));
          }
        }
      } catch (e) {
        console.error("IronEdge Firebase (diet): hydrateFromCloudOnLogin merge failed —", e);
      }
    });
  }

  hydrateFromCloudOnLogin();

  /* ============================================================
     PUBLIC API
     ============================================================ */
  window.IronEdgeDietFirebase = {
    isReady: () => firebaseReady,
    saveDietPlan,
    saveCalorieLog,
    saveWaterIntake,
    saveBmiBmrHistory,
    loadDietProfile
  };
})();
