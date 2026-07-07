/* ============================================================
   IRON EDGE FITNESS — firebase/community.js
   Persists community posts, comments, likes and the following
   list to Firestore, with a real-time listener on the posts
   collection so the feed updates live across devices/tabs.

   Assumes ../js/firebase-config.js has already run:
     firebase.initializeApp({ ...yourConfig });
   and that the firebase-app / firebase-auth / firebase-firestore
   compat SDKs are loaded on the page before this file.

   Falls back gracefully (logs + no-ops) if Firebase isn't
   configured yet, so community.js keeps working on
   localStorage alone.
   ============================================================ */

(function () {
  "use strict";

  let db = null;
  let auth = null;
  let firebaseReady = false;
  let postsUnsubscribe = null;

  try {
    if (typeof firebase !== "undefined" && firebase.apps && firebase.apps.length) {
      db = firebase.firestore();
      auth = firebase.auth();
      firebaseReady = true;
    } else {
      console.warn("IronEdge Firebase (community): no initialized Firebase app found. " +
        "Community data will only be saved to localStorage until firebase-config.js initializes the app.");
    }
  } catch (e) {
    console.warn("IronEdge Firebase (community): initialization skipped —", e.message);
  }

  function getCurrentUserId() {
    if (!firebaseReady || !auth || !auth.currentUser) return null;
    return auth.currentUser.uid;
  }

  function usersCollection() { return db.collection("users"); }
  function postsCollection() { return db.collection("communityPosts"); }

  /* ============================================================
     SAVE: CREATE POST
     ============================================================ */
  async function createPost(post) {
    if (!firebaseReady) {
      console.info("IronEdge Firebase (community): skipped createPost (Firebase not ready).");
      return { success: false, reason: "not-ready" };
    }
    try {
      await postsCollection().doc(post.id).set({
        ...post,
        createdAt: new Date().toISOString()
      });
      return { success: true };
    } catch (e) {
      console.error("IronEdge Firebase (community): createPost failed —", e);
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
     SAVE: LIKE / UNLIKE POST
     ============================================================ */
  async function likePost(postId, isNowLiked) {
    const uid = getCurrentUserId();
    if (!firebaseReady) return { success: false, reason: "not-ready" };
    try {
      await postsCollection().doc(postId).update({
        likes: firebase.firestore.FieldValue.increment(isNowLiked ? 1 : -1),
        likedBy: isNowLiked
          ? firebase.firestore.FieldValue.arrayUnion(uid || "anonymous")
          : firebase.firestore.FieldValue.arrayRemove(uid || "anonymous")
      });
      return { success: true };
    } catch (e) {
      console.error("IronEdge Firebase (community): likePost failed —", e);
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
     SAVE: ADD COMMENT
     ============================================================ */
  async function addComment(postId, comment) {
    if (!firebaseReady) return { success: false, reason: "not-ready" };
    try {
      await postsCollection().doc(postId).update({
        comments: firebase.firestore.FieldValue.arrayUnion({
          ...comment,
          date: new Date().toISOString()
        })
      });
      return { success: true };
    } catch (e) {
      console.error("IronEdge Firebase (community): addComment failed —", e);
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
     SAVE: FOLLOWING LIST (overwrites)
     ============================================================ */
  async function saveFollowing(followingIds) {
    const uid = getCurrentUserId();
    if (!firebaseReady || !uid) {
      console.info("IronEdge Firebase (community): skipped saveFollowing (not signed in).");
      return { success: false, reason: "not-signed-in" };
    }
    try {
      await usersCollection().doc(uid).set({
        following: followingIds,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return { success: true };
    } catch (e) {
      console.error("IronEdge Firebase (community): saveFollowing failed —", e);
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
     REAL-TIME FEED LISTENER
     Keeps LocalStorage's ie_community_posts in sync with live
     Firestore changes so the feed updates without a refresh.
     Call startRealtimeFeedSync() once community.js has rendered
     its initial (localStorage-seeded) feed.
     ============================================================ */
  function startRealtimeFeedSync(onUpdateCallback) {
    if (!firebaseReady) {
      console.info("IronEdge Firebase (community): real-time sync unavailable (Firebase not ready).");
      return;
    }
    if (postsUnsubscribe) postsUnsubscribe(); // avoid duplicate listeners

    postsUnsubscribe = postsCollection()
      .orderBy("createdAt", "desc")
      .limit(50)
      .onSnapshot(snapshot => {
        const posts = snapshot.docs.map(doc => doc.data());
        if (posts.length > 0) {
          try {
            localStorage.setItem("ie_community_posts", JSON.stringify(posts));
          } catch (e) {
            console.error("IronEdge Firebase (community): failed to cache real-time posts —", e);
          }
          if (typeof onUpdateCallback === "function") onUpdateCallback(posts);
        }
      }, err => {
        console.warn("IronEdge Firebase (community): real-time listener error —", err.message);
      });
  }

  function stopRealtimeFeedSync() {
    if (postsUnsubscribe) {
      postsUnsubscribe();
      postsUnsubscribe = null;
    }
  }

  /* ============================================================
     LOAD: FOLLOWING LIST
     ============================================================ */
  async function loadFollowing() {
    const uid = getCurrentUserId();
    if (!firebaseReady || !uid) return { success: false, reason: "not-signed-in" };
    try {
      const docSnap = await usersCollection().doc(uid).get();
      const data = docSnap.exists ? docSnap.data() : {};
      return { success: true, data: { following: data.following || [] } };
    } catch (e) {
      console.error("IronEdge Firebase (community): loadFollowing failed —", e);
      return { success: false, error: e.message };
    }
  }

  /* ============================================================
     PUBLIC API
     ============================================================ */
  window.IronEdgeCommunityFirebase = {
    isReady: () => firebaseReady,
    createPost,
    likePost,
    addComment,
    saveFollowing,
    loadFollowing,
    startRealtimeFeedSync,
    stopRealtimeFeedSync
  };
})();
