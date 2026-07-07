/* ============================================================
   IRON EDGE FITNESS — firebase/dashboard.js
   Persists dashboard statistics, earned achievements and AI
   recommendation history to Firestore under the signed-in
   user's document.

   Assumes ../js/firebase-config.js has already run:
     firebase.initializeApp({ ...yourConfig });
   and that the firebase-app / firebase-auth / firebase-firestore
   compat SDKs are loaded on the page before this file.

   Falls back gracefully (logs + no-ops) if Firebase isn't
   configured yet, so dashboard.js keeps working on
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
      console.warn("IronEdge Firebase (dashboard): no initialized Firebase app found. " +
        "Dashboard data will only be saved to localStorage until firebase-config.js initializes the app.");
    }
  } catch (e) {
    console.warn("IronEdge Firebase (dashboard): initialization skipped —", e.message);
  }

  function getCurrentUserId() {
    if (!firebaseReady || !auth || !auth.currentUser) return null;
    return auth.currentUser.uid;
  }

  function usersCollection() {
    return db.collection("users");
  }

  /* ============================================================
     SAVE: DASHBOARD STATISTICS (overwrites a stats snapshot)
     ============================================================ */
  async function saveDashboardStats(stats) {
    const uid = getCurrentUserId();
    if (!firebaseReady || !uid) {
      console.info("IronEdge Firebase (dashboard): skipped saveDashboardStats (not signed in).");
      return { success: false, reason: "not-signed-in" };
    }
    try {
      await usersCollection().doc(uid).set({
        dashboardStats: { ...stats, updatedAt: new Date().toISOString() }
      }, { merge: true });
      return { success: true };
    } catch (e) {
      console.error("IronEdge Firebase (dashboard): saveDashboardStats failed —", e);
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
     SAVE: ACHIEVEMENTS (overwrites the earned badge id list)
     ============================================================ */
  async function saveAchievements(earnedBadgeIds) {
    const uid = getCurrentUserId();
    if (!firebaseReady || !uid) {
      console.info("IronEdge Firebase (dashboard): skipped saveAchievements (not signed in).");
      return { success: false, reason: "not-signed-in" };
    }
    try {
      await usersCollection().doc(uid).set({
        achievements: {
          earnedBadgeIds,
          updatedAt: new Date().toISOString()
        }
      }, { merge: true });
      return { success: true };
    } catch (e) {
      console.error("IronEdge Firebase (dashboard): saveAchievements failed —", e);
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
     SAVE: AI RECOMMENDATIONS HISTORY (appends a snapshot entry)
     ============================================================ */
  async function saveAiRecommendations(entry) {
    const uid = getCurrentUserId();
    if (!firebaseReady || !uid) {
      console.info("IronEdge Firebase (dashboard): skipped saveAiRecommendations (not signed in).");
      return { success: false, reason: "not-signed-in" };
    }
    try {
      await usersCollection().doc(uid).set({
        aiRecommendationHistory: firebase.firestore.FieldValue.arrayUnion({
          ...entry,
          savedAt: new Date().toISOString()
        })
      }, { merge: true });
      return { success: true };
    } catch (e) {
      console.error("IronEdge Firebase (dashboard): saveAiRecommendations failed —", e);
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
     SAVE: MEMBERSHIP INFO (plan, join date, expiry)
     ============================================================ */
  async function saveMembership(membership) {
    const uid = getCurrentUserId();
    if (!firebaseReady || !uid) {
      console.info("IronEdge Firebase (dashboard): skipped saveMembership (not signed in).");
      return { success: false, reason: "not-signed-in" };
    }
    try {
      await usersCollection().doc(uid).set({
        membership: { ...membership, updatedAt: new Date().toISOString() }
      }, { merge: true });
      return { success: true };
    } catch (e) {
      console.error("IronEdge Firebase (dashboard): saveMembership failed —", e);
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
     SAVE: WEIGHT LOG ENTRY (appends to a weightLogs array)
     ============================================================ */
  async function saveWeightLog(entry) {
    const uid = getCurrentUserId();
    if (!firebaseReady || !uid) {
      console.info("IronEdge Firebase (dashboard): skipped saveWeightLog (not signed in).");
      return { success: false, reason: "not-signed-in" };
    }
    try {
      await usersCollection().doc(uid).set({
        weightLogs: firebase.firestore.FieldValue.arrayUnion(entry)
      }, { merge: true });
      return { success: true };
    } catch (e) {
      console.error("IronEdge Firebase (dashboard): saveWeightLog failed —", e);
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
     LOAD: FULL DASHBOARD PROFILE
     ============================================================ */
  async function loadDashboardProfile() {
    const uid = getCurrentUserId();
    if (!firebaseReady || !uid) {
      return { success: false, reason: "not-signed-in" };
    }
    try {
      const docSnap = await usersCollection().doc(uid).get();
      const data = docSnap.exists ? docSnap.data() : {};
      return {
        success: true,
        data: {
          dashboardStats: data.dashboardStats || null,
          achievements: data.achievements || { earnedBadgeIds: [] },
          aiRecommendationHistory: data.aiRecommendationHistory || [],
          membership: data.membership || null,
          weightLogs: data.weightLogs || []
        }
      };
    } catch (e) {
      console.error("IronEdge Firebase (dashboard): loadDashboardProfile failed —", e);
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
     HYDRATE LOCALSTORAGE FROM CLOUD ON LOGIN
     Only fills gaps — never overwrites data the user is actively
     working with locally.
     ============================================================ */
  async function hydrateFromCloudOnLogin() {
    if (!firebaseReady || !auth) return;

    auth.onAuthStateChanged(async (user) => {
      if (!user) return;

      const result = await loadDashboardProfile();
      if (!result.success) return;

      try {
        if (result.data.membership && !localStorage.getItem("ie_membership")) {
          localStorage.setItem("ie_membership", JSON.stringify(result.data.membership));
        }

        if (result.data.weightLogs.length && !localStorage.getItem("ie_weight_logs")) {
          localStorage.setItem("ie_weight_logs", JSON.stringify(result.data.weightLogs));
        }

        // Refresh the dashboard if it's already rendered on this page
        if (window.IronEdgeDashboard && typeof window.IronEdgeDashboard.renderAll === "function") {
          window.IronEdgeDashboard.renderAll();
        }
      } catch (e) {
        console.error("IronEdge Firebase (dashboard): hydrateFromCloudOnLogin merge failed —", e);
      }
    });
  }

  hydrateFromCloudOnLogin();

  /* ============================================================
     PUBLIC API
     ============================================================ */
  window.IronEdgeDashboardFirebase = {
    isReady: () => firebaseReady,
    saveDashboardStats,
    saveAchievements,
    saveAiRecommendations,
    saveMembership,
    saveWeightLog,
    loadDashboardProfile
  };
})();
