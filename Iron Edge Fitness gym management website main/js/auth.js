/* ==========================================================================
   IRON EDGE FITNESS — js/auth.js
   Complete Firebase authentication controller for:
     pages/login.html, pages/register.html, pages/forgot-password.html
   Also exposes window.IEAuth.logout() for use by dashboard.html / navbar
   once those pages wire up a logout button (id="ie-logout-btn").

   Loaded as an ES module:
     <script type="module" src="../js/auth.js"></script>

   Depends on: firebase/firebase-config.js (auth, googleProvider)
   ========================================================================== */

import { auth, googleProvider } from '../firebase/firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  signOut,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);

  /* ----------------------------------------------------------- constants */
  const REDIRECT_AFTER_LOGIN = 'dashboard.html';
  const REDIRECT_AFTER_LOGOUT = 'login.html';
  const REMEMBER_KEY = 'ie-remember-email';

  /* ------------------------------------------------------- error mapping */
  // Firebase error codes translated into calm, specific, non-technical copy.
  const ERROR_MESSAGES = {
    'auth/invalid-email': 'That email address doesn’t look right.',
    'auth/user-disabled': 'This account has been disabled. Contact support for help.',
    'auth/user-not-found': 'No account matches that email. Check the address or register.',
    'auth/wrong-password': 'That password doesn’t match this account.',
    'auth/invalid-credential': 'Email or password is incorrect. Please try again.',
    'auth/email-already-in-use': 'An account already exists with that email. Try logging in instead.',
    'auth/weak-password': 'Choose a stronger password — at least 8 characters, with a number.',
    'auth/too-many-requests': 'Too many attempts. Wait a few minutes before trying again.',
    'auth/network-request-failed': 'Network error — check your connection and try again.',
    'auth/popup-closed-by-user': 'Google sign-in was closed before finishing. Try again.',
    'auth/cancelled-popup-request': 'Only one sign-in window can be open at a time.',
    'auth/popup-blocked': 'Your browser blocked the sign-in popup. Allow popups for this site and retry.',
    'auth/missing-password': 'Enter a password to continue.',
    'auth/requires-recent-login': 'For security, please log in again to complete this action.',
  };

  function friendlyError(err) {
    return ERROR_MESSAGES[err?.code] || 'Something went wrong on our end. Please try again.';
  }

  /* ------------------------------------------------------------ UI utils */
  function setLoading(form, isLoading) {
    if (!form) return;
    const btn = form.querySelector('[data-submit-btn]');
    if (!btn) return;
    btn.disabled = isLoading;
    btn.classList.toggle('is-loading', isLoading);
  }

  function showBanner(scope, message, type = 'error') {
    const banner = scope.querySelector('[data-form-banner]');
    if (!banner) return;
    banner.textContent = message;
    banner.dataset.type = type;
    banner.classList.add('is-visible');
  }

  function hideBanner(scope) {
    const banner = scope.querySelector('[data-form-banner]');
    if (!banner) return;
    banner.classList.remove('is-visible');
    banner.textContent = '';
  }

  function fieldError(input, message) {
    const wrap = input.closest('.ie-field');
    if (!wrap) return;
    wrap.classList.add('has-error');
    const small = wrap.querySelector('.ie-field__error');
    if (small) small.textContent = message;
  }

  function clearFieldError(input) {
    const wrap = input.closest('.ie-field');
    if (!wrap) return;
    wrap.classList.remove('has-error');
    const small = wrap.querySelector('.ie-field__error');
    if (small) small.textContent = '';
  }

  function clearAllErrors(form) {
    form.querySelectorAll('.ie-field').forEach((wrap) => {
      wrap.classList.remove('has-error');
      const small = wrap.querySelector('.ie-field__error');
      if (small) small.textContent = '';
    });
  }

  /* ------------------------------------------------------- validators --- */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function isValidEmail(value) {
    return EMAIL_RE.test(String(value).trim());
  }

  function passwordScore(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score; // 0–4
  }

  /* ---------------------------------------------------- password toggle */
  function initPasswordToggles(scope) {
    scope.querySelectorAll('[data-toggle-password]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-toggle-password');
        const input = document.getElementById(targetId);
        if (!input) return;
        const isHidden = input.type === 'password';
        input.type = isHidden ? 'text' : 'password';
        const icon = btn.querySelector('i');
        if (icon) icon.className = isHidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
        btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
      });
    });
  }

  /* --------------------------------------------------- strength meter --- */
  function initStrengthMeter(form) {
    const pwInput = form.querySelector('#ie-register-password');
    const meter = form.querySelector('[data-strength-meter]');
    const label = form.querySelector('[data-strength-label]');
    if (!pwInput || !meter) return;

    const levels = [
      { label: 'Very weak', color: 'var(--ie-danger)' },
      { label: 'Weak', color: 'var(--ie-danger)' },
      { label: 'Okay', color: 'var(--ie-warning)' },
      { label: 'Strong', color: 'var(--ie-orange-400)' },
      { label: 'Excellent', color: 'var(--ie-success)' },
    ];

    pwInput.addEventListener('input', () => {
      const score = passwordScore(pwInput.value);
      const pct = pwInput.value ? Math.max(12, (score / 4) * 100) : 0;
      meter.style.width = pct + '%';
      meter.style.background = levels[score].color;
      if (label) label.textContent = pwInput.value ? levels[score].label : '';
    });
  }

  /* -------------------------------------------------- remember-me email */
  function prefillRememberedEmail(form) {
    const emailInput = form.querySelector('#ie-login-email');
    const rememberBox = form.querySelector('#ie-remember-me');
    const remembered = localStorage.getItem(REMEMBER_KEY);
    if (remembered && emailInput) {
      emailInput.value = remembered;
      if (rememberBox) rememberBox.checked = true;
    }
  }

  /* ============================================================ LOGIN === */
  function initLoginForm() {
    const form = $('#ie-login-form');
    if (!form) return;

    initPasswordToggles(form);
    prefillRememberedEmail(form);

    // Verification banner if redirected here with ?verify=1
    const params = new URLSearchParams(location.search);
    if (params.get('verify') === '1') {
      showBanner(form, 'Account created — check your inbox to verify your email, then log in.', 'success');
    }
    if (params.get('reset') === '1') {
      showBanner(form, 'Password reset. You can log in with your new password.', 'success');
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideBanner(form);
      clearAllErrors(form);

      const email = form.querySelector('#ie-login-email');
      const password = form.querySelector('#ie-login-password');
      const remember = form.querySelector('#ie-remember-me');

      let valid = true;
      if (!isValidEmail(email.value)) {
        fieldError(email, 'Enter a valid email address.');
        valid = false;
      }
      if (!password.value) {
        fieldError(password, 'Enter your password.');
        valid = false;
      }
      if (!valid) return;

      setLoading(form, true);
      try {
        await setPersistence(auth, remember.checked ? browserLocalPersistence : browserSessionPersistence);
        await signInWithEmailAndPassword(auth, email.value.trim(), password.value);

        if (remember.checked) localStorage.setItem(REMEMBER_KEY, email.value.trim());
        else localStorage.removeItem(REMEMBER_KEY);

        showBanner(form, 'Welcome back — redirecting to your dashboard…', 'success');
        setTimeout(() => { window.location.href = REDIRECT_AFTER_LOGIN; }, 700);
      } catch (err) {
        console.error('[IronEdge auth] login failed:', err);
        showBanner(form, friendlyError(err), 'error');
        setLoading(form, false);
      }
    });

    // Google sign-in
    const googleBtn = $('#ie-google-signin');
    if (googleBtn) {
      googleBtn.addEventListener('click', async () => {
        hideBanner(form);
        googleBtn.classList.add('is-loading');
        googleBtn.disabled = true;
        try {
          await setPersistence(auth, browserLocalPersistence);
          await signInWithPopup(auth, googleProvider);
          showBanner(form, 'Signed in with Google — redirecting…', 'success');
          setTimeout(() => { window.location.href = REDIRECT_AFTER_LOGIN; }, 600);
        } catch (err) {
          console.error('[IronEdge auth] Google sign-in failed:', err);
          showBanner(form, friendlyError(err), 'error');
        } finally {
          googleBtn.classList.remove('is-loading');
          googleBtn.disabled = false;
        }
      });
    }
  }

  /* ========================================================= REGISTER === */
  function initRegisterForm() {
    const form = $('#ie-register-form');
    if (!form) return;

    initPasswordToggles(form);
    initStrengthMeter(form);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideBanner(form);
      clearAllErrors(form);

      const name = form.querySelector('#ie-register-name');
      const email = form.querySelector('#ie-register-email');
      const password = form.querySelector('#ie-register-password');
      const confirm = form.querySelector('#ie-register-confirm');
      const terms = form.querySelector('#ie-register-terms');

      let valid = true;
      if (!name.value.trim() || name.value.trim().length < 2) {
        fieldError(name, 'Enter your full name.');
        valid = false;
      }
      if (!isValidEmail(email.value)) {
        fieldError(email, 'Enter a valid email address.');
        valid = false;
      }
      if (password.value.length < 8) {
        fieldError(password, 'Use at least 8 characters.');
        valid = false;
      }
      if (confirm.value !== password.value || !confirm.value) {
        fieldError(confirm, 'Passwords do not match.');
        valid = false;
      }
      if (!terms.checked) {
        showBanner(form, 'Please accept the Terms of Service to continue.', 'error');
        valid = false;
      }
      if (!valid) return;

      setLoading(form, true);
      try {
        const cred = await createUserWithEmailAndPassword(auth, email.value.trim(), password.value);
        await updateProfile(cred.user, { displayName: name.value.trim() });
        await sendEmailVerification(cred.user);

        showBanner(form, 'Account created — check your inbox for a verification link.', 'success');
        setTimeout(() => {
          window.location.href = `login.html?verify=1`;
        }, 900);
      } catch (err) {
        console.error('[IronEdge auth] registration failed:', err);
        showBanner(form, friendlyError(err), 'error');
        setLoading(form, false);
      }
    });

    const googleBtn = $('#ie-google-signup');
    if (googleBtn) {
      googleBtn.addEventListener('click', async () => {
        hideBanner(form);
        googleBtn.classList.add('is-loading');
        googleBtn.disabled = true;
        try {
          await setPersistence(auth, browserLocalPersistence);
          await signInWithPopup(auth, googleProvider);
          showBanner(form, 'Account ready — redirecting…', 'success');
          setTimeout(() => { window.location.href = REDIRECT_AFTER_LOGIN; }, 600);
        } catch (err) {
          console.error('[IronEdge auth] Google sign-up failed:', err);
          showBanner(form, friendlyError(err), 'error');
        } finally {
          googleBtn.classList.remove('is-loading');
          googleBtn.disabled = false;
        }
      });
    }
  }

  /* =================================================== FORGOT PASSWORD === */
  function initForgotForm() {
    const form = $('#ie-forgot-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideBanner(form);
      clearAllErrors(form);

      const email = form.querySelector('#ie-forgot-email');
      if (!isValidEmail(email.value)) {
        fieldError(email, 'Enter a valid email address.');
        return;
      }

      setLoading(form, true);
      try {
        await sendPasswordResetEmail(auth, email.value.trim());
        form.classList.add('is-sent');
        showBanner(form, `Reset link sent to ${email.value.trim()}. Check your inbox (and spam folder).`, 'success');
      } catch (err) {
        console.error('[IronEdge auth] password reset failed:', err);
        // Avoid confirming/denying account existence for enumeration safety,
        // but still surface real problems (bad email format, network, etc).
        if (err.code === 'auth/user-not-found') {
          showBanner(form, `If an account exists for ${email.value.trim()}, a reset link is on its way.`, 'success');
        } else {
          showBanner(form, friendlyError(err), 'error');
        }
      } finally {
        setLoading(form, false);
      }
    });
  }

  /* ========================================================== SESSION === */
  // Runs on every page that includes auth.js. Guards auth pages from
  // logged-in users, and wires up any element tagged as a logout control.
  function initSessionGuard() {
    const page = document.body.dataset.page;
    const AUTH_PAGES = new Set(['login', 'register', 'forgot-password']);

    onAuthStateChanged(auth, (user) => {
      document.dispatchEvent(new CustomEvent('ie:auth-state', { detail: { user } }));

      if (user && AUTH_PAGES.has(page)) {
        // Already logged in — no reason to see the login/register screen again.
        window.location.replace(REDIRECT_AFTER_LOGIN);
      }
    });
  }

  async function logout() {
    try {
      await signOut(auth);
    } finally {
      localStorage.removeItem(REMEMBER_KEY);
      window.location.href = REDIRECT_AFTER_LOGOUT;
    }
  }

  window.IEAuth = { logout };

  document.addEventListener('DOMContentLoaded', () => {
    initLoginForm();
    initRegisterForm();
    initForgotForm();
    initSessionGuard();

    document.querySelectorAll('[data-logout]').forEach((btn) =>
      btn.addEventListener('click', (e) => { e.preventDefault(); logout(); })
    );
  });
})();
