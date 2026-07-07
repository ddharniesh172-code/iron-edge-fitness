/* ==========================================================================
   IRON EDGE FITNESS — js/admin.js
   Shared bootstrap for every admin/*.html page:
     - Admin-only auth guard (redirects non-admins, shows an access-denied
       screen rather than a silent bounce)
     - Loads components/sidebar.html into #ie-sidebar-slot + active-link
       highlighting + mobile toggle
     - Fills in the signed-in admin's name/avatar in the sidebar footer
     - Shared toast + tiny modal open/close helpers
     - CSV and PDF export helpers reused by users.html, orders.html,
       analytics.html, etc.

   Loaded as an ES module on every admin page:
     <script type="module" src="../js/admin.js"></script>

   Each admin/*.html page's own inline module script runs its page-specific
   rendering and imports IEAdmin.* from window for the shared helpers below,
   and imports firebase/admin.js directly for data calls.
   ========================================================================== */

import { auth } from '../firebase/firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { isAdmin, getUserProfile } from '../firebase/admin.js';

(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ------------------------------------------------------- component load */
  async function loadSidebar() {
    const slot = $('#ie-sidebar-slot');
    if (!slot) return;
    try {
      const res = await fetch('../components/sidebar.html');
      slot.innerHTML = await res.text();
    } catch (err) {
      console.error('[IronEdge admin] sidebar failed to load:', err);
    }
    initSidebarBehavior();
  }

  function initSidebarBehavior() {
    const page = document.body.dataset.adminPage;
    $$('[data-admin-nav]').forEach((a) => a.classList.toggle('is-active', a.dataset.adminNav === page));

    const toggle = $('#ie-admin-sidebar-toggle');
    const sidebar = $('#ie-admin-sidebar');
    const backdrop = $('#ie-admin-sidebar-backdrop');
    if (toggle && sidebar && backdrop) {
      const open = () => { sidebar.classList.add('is-open'); backdrop.classList.add('is-visible'); toggle.setAttribute('aria-expanded', 'true'); };
      const close = () => { sidebar.classList.remove('is-open'); backdrop.classList.remove('is-visible'); toggle.setAttribute('aria-expanded', 'false'); };
      toggle.addEventListener('click', () => (sidebar.classList.contains('is-open') ? close() : open()));
      backdrop.addEventListener('click', close);
      $$('[data-admin-nav]').forEach((a) => a.addEventListener('click', close));
    }
  }

  function paintAdminProfile(profile) {
    const nameEl = $('#ie-admin-name');
    const avatarEl = $('#ie-admin-avatar');
    if (!nameEl || !avatarEl) return;
    const name = profile?.name || 'Admin';
    nameEl.textContent = name;
    avatarEl.textContent = name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  /* =========================================================== AUTH GUARD */
  function showAccessDenied(message) {
    document.body.innerHTML = `
      <div id="ie-admin-guard-screen">
        <div class="ie-glass">
          <i class="fa-solid fa-shield-halved"></i>
          <h2 style="font-family:var(--ie-font-display); font-size:1.4rem; margin-bottom:10px;">Admins Only</h2>
          <p style="color:var(--ie-text-muted); font-size:0.9rem; margin-bottom:24px;">${message}</p>
          <a href="../pages/login.html" class="ie-btn ie-btn-primary">Go to Login</a>
        </div>
      </div>`;
  }

  /**
   * Resolves once the guard has either confirmed an admin (and returns
   * their profile) or redirected/blocked the page. Each admin page's inline
   * script should `await IEAdmin.requireAdmin()` before doing anything else.
   */
  function requireAdmin() {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          showAccessDenied('You need to log in with an admin account to view this page.');
          return resolve(null);
        }
        try {
          const admin = await isAdmin(user.uid);
          if (!admin) {
            showAccessDenied('This account doesn’t have admin access. Contact the site owner if you believe this is a mistake.');
            return resolve(null);
          }
          const profile = await getUserProfile(user.uid);
          paintAdminProfile(profile);
          resolve({ user, profile });
        } catch (err) {
          console.error('[IronEdge admin] guard check failed:', err);
          showAccessDenied('Something went wrong verifying your access. Please try again.');
          resolve(null);
        }
      });
    });
  }

  /* ================================================================ TOAST */
  function toast(message) {
    const el = $('#ie-toast');
    if (!el) return;
    $('#ie-toast-text').textContent = message;
    el.classList.add('is-visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('is-visible'), 2400);
  }

  /* ================================================================ MODAL */
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('is-open');
    document.documentElement.style.overflow = 'hidden';
  }
  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('is-open');
    document.documentElement.style.overflow = '';
  }
  function initModalDismiss() {
    $$('.ie-admin-modal').forEach((modal) => {
      modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal.id); });
      $$('[data-modal-close]', modal).forEach((btn) => btn.addEventListener('click', () => closeModal(modal.id)));
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      $$('.ie-admin-modal.is-open').forEach((modal) => closeModal(modal.id));
    });
  }

  /* ============================================================== EXPORT */
  /** Converts an array of flat objects into a downloadable CSV file. */
  function exportToCSV(filename, rows) {
    if (!rows || !rows.length) { toast('Nothing to export yet.'); return; }
    const headers = Object.keys(rows[0]);
    const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const csv = [headers.join(','), ...rows.map((row) => headers.map((h) => escape(row[h])).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /** Builds a simple tabular PDF report using jsPDF (must be loaded on the page). */
  function exportToPDF({ title, subtitle, headers, rows, filename }) {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) { toast('PDF generator failed to load — check your connection.'); return; }
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(255, 106, 0);
    doc.text('IRON EDGE FITNESS', 40, 46);
    doc.setFontSize(12); doc.setTextColor(40, 40, 40); doc.setFont('helvetica', 'normal');
    doc.text(title || 'Report', 40, 68);
    if (subtitle) { doc.setFontSize(10); doc.setTextColor(120, 120, 120); doc.text(subtitle, 40, 84); }
    doc.setDrawColor(230, 230, 230); doc.line(40, 96, 555, 96);

    const colWidth = 515 / headers.length;
    let y = 118;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(40, 40, 40);
    headers.forEach((h, i) => doc.text(String(h), 40 + i * colWidth, y));
    y += 8; doc.line(40, y, 555, y); y += 16;

    doc.setFont('helvetica', 'normal');
    rows.forEach((row) => {
      if (y > 780) { doc.addPage(); y = 50; }
      row.forEach((cell, i) => doc.text(String(cell ?? '').slice(0, 26), 40 + i * colWidth, y));
      y += 18;
    });

    doc.save(filename?.endsWith('.pdf') ? filename : `${filename || 'report'}.pdf`);
  }

  /* ================================================================= INIT */
  document.addEventListener('DOMContentLoaded', () => {
    loadSidebar();
    initModalDismiss();
  });

  window.IEAdmin = { requireAdmin, toast, openModal, closeModal, exportToCSV, exportToPDF };
})();
