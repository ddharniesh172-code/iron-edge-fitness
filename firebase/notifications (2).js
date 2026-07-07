/* ============================================================
   IRON EDGE FITNESS — firebase/notifications.js
   Persists the notification list and Firebase Cloud Messaging
   (FCM) device tokens to Firestore under the signed-in user's
   document, with a real-time listener so notifications pushed
   from elsewhere (e.g. a future admin panel sending order
   updates) appear instantly in the in-app notification center.

   Assumes ../js/firebase-config.js has already run:
     firebase.initializeApp({ ...yourConfig });
   and that the firebase-app / firebase-auth / firebase-firestore
   / firebase-messaging compat SDKs are loaded on the page
   before this file.

   Falls back gracefully (logs + no-ops) if Firebase isn't
   configured yet, so notifications.js keeps working on
   localStorage alone.
   ============================================================ */

(function () {
  "use strict";

  let db = null;
  let auth = null;
  let firebaseReady = false;
  let notifUnsubscribe = null;

  try {
    if (typeof firebase !== "undefined" && firebase.apps && firebase.apps.length) {
      db = firebase.firestore();
      auth = firebase.auth();
      firebaseReady = true;
    } else {
      console.warn("IronEdge Firebase (notifications): no initialized Firebase app found. " +
        "Notifications will only be saved to localStorage until firebase-config.js initializes the app.");
    }
  } catch (e) {
    console.warn("IronEdge Firebase (notifications): initialization skipped —", e.message);
  }

  function getCurrentUserId() {
    if (!firebaseReady || !auth || !auth.currentUser) return null;
    return auth.currentUser.uid;
  }

  function usersCollection() { return db.collection("users"); }

  /* ============================================================
     SAVE: FULL NOTIFICATIONS LIST (overwrite)
     ============================================================ */
  async function saveNotifications(notifications) {
    const uid = getCurrentUserId();
    if (!firebaseReady || !uid) {
      console.info("IronEdge Firebase (notifications): skipped saveNotifications (not signed in).");
      return { success: false, reason: "not-signed-in" };
    }
    try {
      await usersCollection().doc(uid).set({
        notifications,
        notificationsUpdatedAt: new Date().toISOString()
      }, { merge: true });
      return { success: true };
    } catch (e) {
      console.error("IronEdge Firebase (notifications): saveNotifications failed —", e);
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
     SAVE: FCM DEVICE TOKEN
     ============================================================ */
  async function saveFcmToken(token) {
    const uid = getCurrentUserId();
    if (!firebaseReady || !uid) {
      console.info("IronEdge Firebase (notifications): skipped saveFcmToken (not signed in).");
      return { success: false, reason: "not-signed-in" };
    }
    try {
      await usersCollection().doc(uid).set({
        fcmTokens: firebase.firestore.FieldValue.arrayUnion(token)
      }, { merge: true });
      return { success: true };
    } catch (e) {
      console.error("IronEdge Firebase (notifications): saveFcmToken failed —", e);
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
     LOAD: NOTIFICATIONS FOR THE CURRENT USER
     ============================================================ */
  async function loadNotifications() {
    const uid = getCurrentUserId();
    if (!firebaseReady || !uid) return { success: false, reason: "not-signed-in" };
    try {
      const docSnap = await usersCollection().doc(uid).get();
      const data = docSnap.exists ? docSnap.data() : {};
      return { success: true, data: { notifications: data.notifications || [] } };
    } catch (e) {
      console.error("IronEdge Firebase (notifications): loadNotifications failed —", e);
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
     REAL-TIME LISTENER
     Watches the user's own document for notification changes
     (e.g. pushed server-side by a Cloud Function) and merges
     any new ones into localStorage + re-renders the panel.
     ============================================================ */
  function startRealtimeNotificationSync() {
    const uid = getCurrentUserId();
    if (!firebaseReady || !uid) {
      console.info("IronEdge Firebase (notifications): real-time sync unavailable (not signed in or not ready).");
      return;
    }
    if (notifUnsubscribe) notifUnsubscribe();

    notifUnsubscribe = usersCollection().doc(uid).onSnapshot(docSnap => {
      if (!docSnap.exists) return;
      const cloudNotifications = docSnap.data().notifications || [];

      try {
        const localNotifications = JSON.parse(localStorage.getItem("ie_notifications") || "[]");
        const localIds = new Set(localNotifications.map(n => n.id));
        const newOnes = cloudNotifications.filter(n => !localIds.has(n.id));

        if (newOnes.length > 0) {
          const merged = [...newOnes, ...localNotifications].slice(0, 60);
          localStorage.setItem("ie_notifications", JSON.stringify(merged));

          if (window.IronEdgeNotifications) {
            // Re-render panel/bell by triggering a lightweight custom event
            document.dispatchEvent(new CustomEvent("ie-notifications-updated"));
          }
        }
      } catch (e) {
        console.error("IronEdge Firebase (notifications): real-time merge failed —", e);
      }
    }, err => {
      console.warn("IronEdge Firebase (notifications): real-time listener error —", err.message);
    });
  }

  function stopRealtimeNotificationSync() {
    if (notifUnsubscribe) {
      notifUnsubscribe();
      notifUnsubscribe = null;
    }
  }

  /* ============================================================
     HYDRATE ON LOGIN + START REAL-TIME SYNC
     ============================================================ */
  async function hydrateFromCloudOnLogin() {
    if (!firebaseReady || !auth) return;

    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        stopRealtimeNotificationSync();
        return;
      }

      const result = await loadNotifications();
      if (result.success) {
        try {
          const localNotifications = JSON.parse(localStorage.getItem("ie_notifications") || "[]");
          if (localNotifications.length === 0 && result.data.notifications.length > 0) {
            localStorage.setItem("ie_notifications", JSON.stringify(result.data.notifications));
          }
        } catch (e) {
          console.error("IronEdge Firebase (notifications): hydrate merge failed —", e);
        }
      }

      startRealtimeNotificationSync();
    });
  }

  hydrateFromCloudOnLogin();

  /* ============================================================
     PUBLIC API
     ============================================================ */
  window.IronEdgeNotificationsFirebase = {
    isReady: () => firebaseReady,
    saveNotifications,
    saveFcmToken,
    loadNotifications,
    startRealtimeNotificationSync,
    stopRealtimeNotificationSync
  };
})();
