/* ============================================================
   IRON EDGE FITNESS — firebase/trainer-booking.js
   Persists trainer bookings to Firestore under the signed-in
   user's document, plus a mirrored write into a top-level
   `trainerBookings` collection so trainers/admins could query
   bookings by trainerId in a future admin panel.

   Assumes ../js/firebase-config.js has already run:
     firebase.initializeApp({ ...yourConfig });
   and that the firebase-app / firebase-auth / firebase-firestore
   compat SDKs are loaded on the page before this file.

   Falls back gracefully (logs + no-ops) if Firebase isn't
   configured yet, so trainer-booking.js keeps working on
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
      console.warn("IronEdge Firebase (trainer-booking): no initialized Firebase app found. " +
        "Booking data will only be saved to localStorage until firebase-config.js initializes the app.");
    }
  } catch (e) {
    console.warn("IronEdge Firebase (trainer-booking): initialization skipped —", e.message);
  }

  function getCurrentUserId() {
    if (!firebaseReady || !auth || !auth.currentUser) return null;
    return auth.currentUser.uid;
  }

  function usersCollection() { return db.collection("users"); }
  function bookingsCollection() { return db.collection("trainerBookings"); }

  /* ============================================================
     SAVE: FULL BOOKINGS LIST (overwrite under the user's doc,
     plus upsert each booking into the top-level collection so
     it's queryable by trainerId)
     ============================================================ */
  async function saveBookings(bookings) {
    const uid = getCurrentUserId();
    if (!firebaseReady || !uid) {
      console.info("IronEdge Firebase (trainer-booking): skipped saveBookings (not signed in).");
      return { success: false, reason: "not-signed-in" };
    }
    try {
      await usersCollection().doc(uid).set({
        bookings,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Mirror each booking into the top-level collection (batched)
      const batch = db.batch();
      bookings.forEach(b => {
        const ref = bookingsCollection().doc(b.id);
        batch.set(ref, { ...b, userId: uid }, { merge: true });
      });
      await batch.commit();

      return { success: true };
    } catch (e) {
      console.error("IronEdge Firebase (trainer-booking): saveBookings failed —", e);
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
     LOAD: BOOKINGS FOR THE CURRENT USER
     ============================================================ */
  async function loadBookings() {
    const uid = getCurrentUserId();
    if (!firebaseReady || !uid) return { success: false, reason: "not-signed-in" };
    try {
      const docSnap = await usersCollection().doc(uid).get();
      const data = docSnap.exists ? docSnap.data() : {};
      return { success: true, data: { bookings: data.bookings || [] } };
    } catch (e) {
      console.error("IronEdge Firebase (trainer-booking): loadBookings failed —", e);
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
     HYDRATE LOCALSTORAGE FROM CLOUD ON LOGIN
     Merges by booking id — cloud bookings the user doesn't have
     locally get added; local-only bookings (made before sign-in)
     are preserved and pushed back up.
     ============================================================ */
  async function hydrateFromCloudOnLogin() {
    if (!firebaseReady || !auth) return;

    auth.onAuthStateChanged(async (user) => {
      if (!user) return;

      const result = await loadBookings();
      if (!result.success) return;

      try {
        const localBookings = JSON.parse(localStorage.getItem("ie_trainer_bookings") || "[]");
        const localIds = new Set(localBookings.map(b => b.id));
        const merged = [...localBookings, ...result.data.bookings.filter(b => !localIds.has(b.id))]
          .sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt));

        localStorage.setItem("ie_trainer_bookings", JSON.stringify(merged));

        if (merged.length !== result.data.bookings.length) {
          saveBookings(merged); // push any local-only bookings back up to the cloud
        }

        if (window.IronEdgeTrainerBooking && typeof window.IronEdgeTrainerBooking.renderUpcomingBookings === "function") {
          window.IronEdgeTrainerBooking.renderUpcomingBookings();
          window.IronEdgeTrainerBooking.renderBookingHistory();
        }
      } catch (e) {
        console.error("IronEdge Firebase (trainer-booking): hydrateFromCloudOnLogin merge failed —", e);
      }
    });
  }

  hydrateFromCloudOnLogin();

  /* ============================================================
     PUBLIC API
     ============================================================ */
  window.IronEdgeTrainerBookingFirebase = {
    isReady: () => firebaseReady,
    saveBookings,
    loadBookings
  };
})();
