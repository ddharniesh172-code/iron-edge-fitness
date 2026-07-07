/* ============================================================
   IRON EDGE FITNESS — firebase/ai-coach.js
   Persists AI Coach chat threads and a lightweight interaction
   log (question/answer pairs, useful for later improving the
   response engine) to Firestore under the signed-in user's
   document.

   Assumes ../js/firebase-config.js has already run:
     firebase.initializeApp({ ...yourConfig });
   and that the firebase-app / firebase-auth / firebase-firestore
   compat SDKs are loaded on the page before this file.

   Falls back gracefully (logs + no-ops) if Firebase isn't
   configured yet, so ai-coach.js keeps working on
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
      console.warn("IronEdge Firebase (ai-coach): no initialized Firebase app found. " +
        "Chat history will only be saved to localStorage until firebase-config.js initializes the app.");
    }
  } catch (e) {
    console.warn("IronEdge Firebase (ai-coach): initialization skipped —", e.message);
  }

  function getCurrentUserId() {
    if (!firebaseReady || !auth || !auth.currentUser) return null;
    return auth.currentUser.uid;
  }

  function usersCollection() { return db.collection("users"); }

  /* ============================================================
     SAVE: FULL CHAT THREADS (overwrite)
     ============================================================ */
  async function saveChats(chats) {
    const uid = getCurrentUserId();
    if (!firebaseReady || !uid) {
      console.info("IronEdge Firebase (ai-coach): skipped saveChats (not signed in).");
      return { success: false, reason: "not-signed-in" };
    }
    try {
      await usersCollection().doc(uid).set({
        aiCoachChats: chats,
        aiCoachChatsUpdatedAt: new Date().toISOString()
      }, { merge: true });
      return { success: true };
    } catch (e) {
      console.error("IronEdge Firebase (ai-coach): saveChats failed —", e);
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
     SAVE: INTERACTION LOG ENTRY (appends question/answer pairs)
     Kept separate from the full chat threads so it can grow
     over time without repeatedly rewriting the whole thread list.
     ============================================================ */
  async function logInteraction(entry) {
    const uid = getCurrentUserId();
    if (!firebaseReady || !uid) {
      console.info("IronEdge Firebase (ai-coach): skipped logInteraction (not signed in).");
      return { success: false, reason: "not-signed-in" };
    }
    try {
      await usersCollection().doc(uid)
        .collection("aiCoachInteractions")
        .add({ ...entry, loggedAt: new Date().toISOString() });
      return { success: true };
    } catch (e) {
      console.error("IronEdge Firebase (ai-coach): logInteraction failed —", e);
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
     LOAD: CHAT THREADS FOR THE CURRENT USER
     ============================================================ */
  async function loadChats() {
    const uid = getCurrentUserId();
    if (!firebaseReady || !uid) return { success: false, reason: "not-signed-in" };
    try {
      const docSnap = await usersCollection().doc(uid).get();
      const data = docSnap.exists ? docSnap.data() : {};
      return { success: true, data: { chats: data.aiCoachChats || [] } };
    } catch (e) {
      console.error("IronEdge Firebase (ai-coach): loadChats failed —", e);
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
     HYDRATE LOCALSTORAGE FROM CLOUD ON LOGIN
     Only fills in when local storage has no chat history yet,
     so it never clobbers a conversation in progress.
     ============================================================ */
  async function hydrateFromCloudOnLogin() {
    if (!firebaseReady || !auth) return;

    auth.onAuthStateChanged(async (user) => {
      if (!user) return;

      const result = await loadChats();
      if (!result.success) return;

      try {
        const localChats = JSON.parse(localStorage.getItem("ie_ai_chats") || "[]");
        if (localChats.length === 0 && result.data.chats.length > 0) {
          localStorage.setItem("ie_ai_chats", JSON.stringify(result.data.chats));
        }
      } catch (e) {
        console.error("IronEdge Firebase (ai-coach): hydrateFromCloudOnLogin merge failed —", e);
      }
    });
  }

  hydrateFromCloudOnLogin();

  /* ============================================================
     PUBLIC API
     ============================================================ */
  window.IronEdgeAiCoachFirebase = {
    isReady: () => firebaseReady,
    saveChats,
    logInteraction,
    loadChats
  };
})();
