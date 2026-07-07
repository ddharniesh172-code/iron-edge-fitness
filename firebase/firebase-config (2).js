/* ==========================================================================
   IRON EDGE FITNESS — firebase/firebase-config.js
   Initializes the Firebase app + Auth + Firestore instances shared by every
   page that needs them (login/register/forgot-password for Auth; now also
   membership.html / payment.html for Firestore — membership plans, payment
   history, and expiry tracking).

   Loaded as an ES module:
     <script type="module" src="../firebase/firebase-config.js"></script>
   or imported directly:
     import { auth, googleProvider, db } from '../firebase/firebase-config.js';

   REPLACE the values in `firebaseConfig` with your own project's config
   from the Firebase Console -> Project Settings -> General -> Your apps ->
   SDK setup and configuration. The placeholders below will not connect to
   a real project until you do.

   [Prompt 3 update] Added Firestore (`getFirestore`) alongside the existing
   Auth setup from Prompt 2. Nothing else in this file was changed.
   ========================================================================== */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore,
  enableIndexedDbPersistence,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/* ---------------------------------------------------------------- config */
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'iron-edge-fitness.firebaseapp.com',
  projectId: 'iron-edge-fitness',
  storageBucket: 'iron-edge-fitness.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

/* ------------------------------------------------------------------ init */
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

/* Google sign-in provider - requests basic profile + email, always shows
   the account chooser so a signed-in browser doesn't silently reuse the
   last Google account. */
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/* Firestore — stores membership documents and payment history.
   See js/firebase.js for the collection schema and helper functions. */
export const db = getFirestore(app);

// Best-effort offline cache so membership status still renders (from cache)
// on a flaky gym wifi connection. Safe to ignore if it fails (e.g. multiple
// tabs open) — reads/writes simply fall back to network-only.
enableIndexedDbPersistence(db).catch((err) => {
  console.warn('[IronEdge] Firestore offline persistence unavailable:', err.code);
});

/* ------------------------------------------------------- local emulator ---
   Uncomment during local development against the Firebase Auth Emulator
   (firebase emulators:start) instead of a live project.

import { connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
if (location.hostname === 'localhost') {
  connectAuthEmulator(auth, 'http://localhost:9099');
}
--------------------------------------------------------------------------- */

export default app;
