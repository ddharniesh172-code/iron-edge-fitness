/* ==========================================================================
   IRON EDGE FITNESS — firebase/firebase-config.js
   Initializes the Firebase app + Auth instance shared by every page that
   needs authentication (login.html, register.html, forgot-password.html,
   and later dashboard.html / profile.html / settings.html).

   Loaded as an ES module:
     <script type="module" src="../firebase/firebase-config.js"></script>
   or imported directly:
     import { auth, googleProvider } from '../firebase/firebase-config.js';

   REPLACE the values in `firebaseConfig` with your own project's config
   from the Firebase Console -> Project Settings -> General -> Your apps ->
   SDK setup and configuration. The placeholders below will not connect to
   a real project until you do.
   ========================================================================== */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

/* ---------------------------------------------------------------- config */
const firebaseConfig = {
  apiKey: "AIzaSyAL8ext3rTJlzH88bVThRaRh5Qe-_vcKug",
  authDomain: "iron-edge-fitness-7dab1.firebaseapp.com",
  projectId: "iron-edge-fitness-7dab1",
  storageBucket: "iron-edge-fitness-7dab1.firebasestorage.app",
  messagingSenderId: "10939718475",
  appId: "1:10939718475:web:d9846c074469e1a33666ce",
  measurementId: "G-E87CMSFXY2"
};

/* ------------------------------------------------------------------ init */
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

/* Google sign-in provider - requests basic profile + email, always shows
   the account chooser so a signed-in browser doesn't silently reuse the
   last Google account. */
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/* ------------------------------------------------------- local emulator ---
   Uncomment during local development against the Firebase Auth Emulator
   (firebase emulators:start) instead of a live project.

import { connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
if (location.hostname === 'localhost') {
  connectAuthEmulator(auth, 'http://localhost:9099');
}
--------------------------------------------------------------------------- */

export default app;
