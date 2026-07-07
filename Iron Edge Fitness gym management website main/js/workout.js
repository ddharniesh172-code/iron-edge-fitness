/* ============================================================
   IRON EDGE FITNESS — firebase/workout.js
   Persists completed workouts, favorites and workout history
   to Firestore under the signed-in user's document.

   Assumes ../js/firebase-config.js has already run:
     firebase.initializeApp({ ...yourConfig });
   and that the firebase-app / firebase-auth / firebase-firestore
   compat SDKs are loaded on the page before this file.

   Falls back gracefully (logs + no-ops) if Firebase isn't
   configured yet, so the rest of the app keeps working on
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
      console.warn("IronEdge Firebase: no initialized Firebase app found. " +
        "Workout data will only be saved to localStorage until firebase-config.js initializes the app.");
    }
  } catch (e) {
    console.warn("IronEdge Firebase: initialization skipped —", e.message);
  }

  function getCurrentUserId() {
    if (!firebaseReady || !auth || !auth.currentUser) return null;
    return auth.currentUser.uid;
  }

  function usersCollection() {
    return db.collection("users");
  }

  /* ============================================================
     SAVE: COMPLETED WORKOUT (appends to workoutHistory array)
     ============================================================ */
  async function saveCompletedWorkout(entry) {
    const uid = getCurrentUserId();
    if (!firebaseReady || !uid) {
      console.info("IronEdge Firebase: skipped saveCompletedWorkout (not signed in).");
      return { success: false, reason: "not-signed-in" };
    }

    try {
      const docRef = usersCollection().doc(uid);
      await docRef.set({
        workoutHistory: firebase.firestore.FieldValue.arrayUnion({
          ...entry,
          savedAt: new Date().toISOString()
        }),
        stats: {
          lastWorkoutAt: new Date().toISOString()
        }
      }, { merge: true });

      return { success: true };
    } catch (e) {
      console.error("IronEdge Firebase: saveCompletedWorkout failed —", e);
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
     SAVE: FAVORITES (overwrites the favorites array)
     ============================================================ */
  async function saveFavorites(favoritesArray) {
    const uid = getCurrentUserId();
    if (!firebaseReady || !uid) {
      console.info("IronEdge Firebase: skipped saveFavorites (not signed in).");
      return { success: false, reason: "not-signed-in" };
    }

    try {
      const docRef = usersCollection().doc(uid);
      await docRef.set({
        favorites: favoritesArray,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      return { success: true };
    } catch (e) {
      console.error("IronEdge Firebase: saveFavorites failed —", e);
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
     SAVE: RECENTLY VIEWED (overwrites the array)
     ============================================================ */
  async function saveRecentlyViewed(recentArray) {
    const uid = getCurrentUserId();
    if (!firebaseReady || !uid) return { success: false, reason: "not-signed-in" };

    try {
      const docRef = usersCollection().doc(uid);
      await docRef.set({
        recentlyViewed: recentArray,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return { success: true };
    } catch (e) {
      console.error("IronEdge Firebase: saveRecentlyViewed failed —", e);
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
     LOAD: FULL WORKOUT PROFILE (favorites, history, recent)
     Called on login / page load to hydrate localStorage from
     the cloud copy, so progress follows the user across devices.
     ============================================================ */
  async function loadWorkoutProfile() {
    const uid = getCurrentUserId();
    if (!firebaseReady || !uid) {
      return { success: false, reason: "not-signed-in" };
    }

    try {
      const docSnap = await usersCollection().doc(uid).get();
      if (!docSnap.exists) {
        return { success: true, data: { favorites: [], workoutHistory: [], recentlyViewed: [] } };
      }
      const data = docSnap.data();
      return {
        success: true,
        data: {
          favorites: data.favorites || [],
          workoutHistory: data.workoutHistory || [],
          recentlyViewed: data.recentlyViewed || []
        }
      };
    } catch (e) {
      console.error("IronEdge Firebase: loadWorkoutProfile failed —", e);
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
     MERGE CLOUD DATA INTO LOCALSTORAGE ON AUTH STATE CHANGE
     Keeps the two stores in sync without the rest of the app
     needing to know Firebase exists.
     ============================================================ */
  function mergeArraysUnique(a = [], b = []) {
    return Array.from(new Set([...a, ...b]));
  }

  async function hydrateFromCloudOnLogin() {
    if (!firebaseReady || !auth) return;

    auth.onAuthStateChanged(async (user) => {
      if (!user) return;

      const result = await loadWorkoutProfile();
      if (!result.success) return;

      try {
        const localFavorites = JSON.parse(localStorage.getItem("ie_favorites") || "[]");
        const localHistory = JSON.parse(localStorage.getItem("ie_workout_history") || "[]");
        const localRecent = JSON.parse(localStorage.getItem("ie_recently_viewed") || "[]");

        const mergedFavorites = mergeArraysUnique(localFavorites, result.data.favorites);
        const mergedHistory = [...localHistory, ...result.data.workoutHistory]
          .sort((x, y) => new Date(y.date) - new Date(x.date));
        const mergedRecent = mergeArraysUnique(localRecent, result.data.recentlyViewed).slice(0, 8);

        localStorage.setItem("ie_favorites", JSON.stringify(mergedFavorites));
        localStorage.setItem("ie_workout_history", JSON.stringify(mergedHistory));
        localStorage.setItem("ie_recently_viewed", JSON.stringify(mergedRecent));

        // Push merged favorites back up so cloud stays authoritative too
        saveFavorites(mergedFavorites);
      } catch (e) {
        console.error("IronEdge Firebase: hydrateFromCloudOnLogin merge failed —", e);
      }
    });
  }

  hydrateFromCloudOnLogin();

  /* ============================================================
     PUBLIC API
     ============================================================ */
  window.IronEdgeWorkoutFirebase = {
    isReady: () => firebaseReady,
    saveCompletedWorkout,
    saveFavorites,
    saveRecentlyViewed,
    loadWorkoutProfile
  };
})();
