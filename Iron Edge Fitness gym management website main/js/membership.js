/* ==========================================================================
   IRON EDGE FITNESS — js/membership.js
   Page logic for pages/membership.html:
     - Monthly / Quarterly / Yearly duration toggle (updates all price cards)
     - "Choose Plan" -> redirects to payment.html?plan=..&duration=..
     - Membership status card (active / expired / none) driven by Firestore
     - Membership history table + client-side PDF invoice download

   Loaded as an ES module:
     <script type="module" src="../js/membership.js"></script>

   Depends on: js/firebase.js (Firestore helpers), js/auth.js (auth state
   event), and the jsPDF UMD build loaded on the page for invoice PDFs.
   ========================================================================== */

import {
  PLAN_CATALOG,
  DURATIONS,
  getUserMembership,
  computeMembershipStatus,
  getPaymentHistory,
} from '../js/firebase.js';

(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  let currentDuration = 'monthly';
  let currentUser = null;

  /* ---------------------------------------------------------- formatters */
  const money = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);

  const dateFmt = (d) => {
    if (!d) return '—';
    const date = d.toDate ? d.toDate() : new Date(d);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  /* =========================================================== DURATION */
  function initDurationToggle() {
    const buttons = $$('.ie-duration-toggle button[data-duration]');
    if (!buttons.length) return;

    function paintPrices() {
      $$('.ie-price-card').forEach((card) => {
        const price = parseFloat(card.dataset[`price${capitalize(currentDuration)}`] || card.dataset.priceMonthly);
        const amountEl = card.querySelector('.ie-price-card__amount');
        const periodEl = card.querySelector('.ie-price-card__period');
        const perMonthEl = card.querySelector('.ie-price-card__permonth');
        if (!amountEl) return;

        const dur = DURATIONS[currentDuration];
        amountEl.textContent = formatAmount(price);
        if (periodEl) periodEl.textContent = currentDuration === 'monthly' ? '/ mo' : `/ ${dur.label.toLowerCase().replace('ly', '')}`;

        if (perMonthEl) {
          if (currentDuration === 'monthly') {
            perMonthEl.innerHTML = '&nbsp;';
          } else {
            const perMonth = price / dur.months;
            perMonthEl.textContent = `≈ ${money(perMonth)} / mo · billed ${dur.label.toLowerCase()}`;
          }
        }
      });
    }

    function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
    function formatAmount(n) { return Number.isInteger(n) ? n : n.toFixed(2); }

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        currentDuration = btn.dataset.duration;
        buttons.forEach((b) => {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-selected', String(b === btn));
        });
        paintPrices();
      });
    });

    paintPrices();
  }

  /* ========================================================= CHOOSE PLAN */
  function initChoosePlanButtons() {
    $$('[data-choose-plan]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const plan = btn.dataset.choosePlan;
        window.location.href = `payment.html?plan=${encodeURIComponent(plan)}&duration=${encodeURIComponent(currentDuration)}`;
      });
    });
  }

  /* ===================================================== MEMBERSHIP CARD */
  function renderLoggedOutStatus() {
    const el = $('#ie-membership-status');
    if (!el) return;
    el.innerHTML = `
      <div class="ie-empty-state">
        <i class="fa-solid fa-lock"></i>
        <p>Log in to view your membership status, expiry, and history.</p>
        <a href="login.html" class="ie-btn ie-btn-primary">Log In</a>
      </div>`;
  }

  function renderNoMembershipStatus() {
    const el = $('#ie-membership-status');
    if (!el) return;
    el.innerHTML = `
      <div class="ie-empty-state">
        <i class="fa-solid fa-dumbbell"></i>
        <p>You don't have an active membership yet — pick a plan above to get started.</p>
        <button type="button" class="ie-btn ie-btn-primary" onclick="document.querySelector('.ie-pricing-grid').scrollIntoView({behavior:'smooth'})">Browse Plans</button>
      </div>`;
  }

  function renderMembershipStatus(membership) {
    const el = $('#ie-membership-status');
    if (!el) return;

    const { state, daysLeft, expiryDate } = computeMembershipStatus(membership);
    if (state === 'none') return renderNoMembershipStatus();

    const plan = PLAN_CATALOG[membership.plan] || { name: membership.plan, color: 'var(--ie-orange-400)' };
    const dur = DURATIONS[membership.duration] || { months: 1, label: membership.duration };
    const totalDays = dur.months * 30;
    const usedPct = Math.min(100, Math.max(0, Math.round(((totalDays - daysLeft) / totalDays) * 100)));

    el.innerHTML = `
      <div class="ie-status-card__top">
        <div>
          <h3 style="font-size:1.3rem; font-family:var(--ie-font-body); font-weight:700; text-transform:none;">${plan.name} Membership</h3>
          <p style="font-size:0.85rem; color:var(--ie-text-muted); margin-top:4px;">Billed ${dur.label.toLowerCase()}</p>
        </div>
        <span class="ie-status-badge" data-state="${state}">${state === 'active' ? 'Active' : 'Expired'}</span>
      </div>

      <div class="ie-status-grid">
        <div class="ie-status-metric">
          <p class="ie-status-metric__label">Plan</p>
          <p class="ie-status-metric__value">${plan.name}</p>
        </div>
        <div class="ie-status-metric">
          <p class="ie-status-metric__label">Billing Cycle</p>
          <p class="ie-status-metric__value">${dur.label}</p>
        </div>
        <div class="ie-status-metric">
          <p class="ie-status-metric__label">Price</p>
          <p class="ie-status-metric__value">${money(membership.price)}</p>
        </div>
        <div class="ie-status-metric">
          <p class="ie-status-metric__label">${state === 'active' ? 'Days Left' : 'Expired'}</p>
          <p class="ie-status-metric__value">${state === 'active' ? daysLeft + ' days' : dateFmt(expiryDate)}</p>
        </div>
      </div>

      <div class="ie-expiry-track"><div class="ie-expiry-fill" style="--fill:${usedPct}%;"></div></div>
      <p class="ie-expiry-caption">
        ${state === 'active'
          ? `Renews / expires on ${dateFmt(expiryDate)}`
          : `Membership expired on ${dateFmt(expiryDate)} — renew to regain access.`}
      </p>

      <div style="margin-top:24px; display:flex; gap:12px; flex-wrap:wrap;">
        <a href="payment.html?plan=${membership.plan}&duration=${membership.duration}" class="ie-btn ie-btn-primary">
          <i class="fa-solid fa-rotate"></i> ${state === 'active' ? 'Renew Now' : 'Reactivate Membership'}
        </a>
        <a href="#" class="ie-btn ie-btn-ghost" onclick="document.querySelector('.ie-pricing-grid').scrollIntoView({behavior:'smooth'}); return false;">
          Change Plan
        </a>
      </div>
    `;

    requestAnimationFrame(() => {
      const fill = el.querySelector('.ie-expiry-fill');
      if (fill) fill.style.width = getComputedStyle(fill).getPropertyValue('--fill');
    });
  }

  /* ============================================================= HISTORY */
  function renderHistoryLoggedOut() {
    const body = $('#ie-history-body');
    if (!body) return;
    body.innerHTML = `<tr class="ie-skeleton-row"><td colspan="7">Log in to see your payment history.</td></tr>`;
  }

  function renderHistoryEmpty() {
    const body = $('#ie-history-body');
    if (!body) return;
    body.innerHTML = `<tr class="ie-skeleton-row"><td colspan="7">No payments yet — your first invoice will show up here.</td></tr>`;
  }

  function renderHistory(records) {
    const body = $('#ie-history-body');
    if (!body) return;
    if (!records.length) return renderHistoryEmpty();

    body.innerHTML = records
      .map((r) => {
        const plan = PLAN_CATALOG[r.plan]?.name || r.plan;
        const dur = DURATIONS[r.duration]?.label || r.duration;
        return `
        <tr>
          <td style="font-family:var(--ie-font-mono); font-size:0.78rem;">${r.invoiceId || r.id}</td>
          <td>${plan}</td>
          <td>${dur}</td>
          <td>${money(r.total)}</td>
          <td>${dateFmt(r.createdAt)}</td>
          <td><span class="ie-history-status" data-status="${r.status || 'paid'}">${r.status || 'paid'}</span></td>
          <td>
            <button type="button" class="ie-download-invoice-btn" data-invoice='${JSON.stringify(r).replace(/'/g, '&apos;')}'>
              <i class="fa-solid fa-download"></i> Invoice
            </button>
          </td>
        </tr>`;
      })
      .join('');

    $$('.ie-download-invoice-btn', body).forEach((btn) => {
      btn.addEventListener('click', () => {
        try {
          downloadInvoicePdf(JSON.parse(btn.dataset.invoice.replace(/&apos;/g, "'")));
        } catch (err) {
          console.error('[IronEdge membership] invoice parse failed:', err);
        }
      });
    });
  }

  /* --------------------------------------------------------- PDF invoice */
  function downloadInvoicePdf(record) {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
      alert('PDF generator failed to load — check your connection and try again.');
      return;
    }
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const plan = PLAN_CATALOG[record.plan]?.name || record.plan;
    const dur = DURATIONS[record.duration]?.label || record.duration;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 106, 0);
    doc.text('IRON EDGE FITNESS', 40, 50);

    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'normal');
    doc.text('Invoice', 40, 75);

    doc.setDrawColor(230, 230, 230);
    doc.line(40, 90, 555, 90);

    const rows = [
      ['Invoice ID', record.invoiceId || record.id],
      ['Date', dateFmt(record.createdAt)],
      ['Plan', plan],
      ['Billing Cycle', dur],
      ['Base Price', money(record.basePrice ?? record.total)],
      ['Discount', money(record.discount || 0)],
      ['Coupon', record.couponCode || '—'],
      ['Total Paid', money(record.total)],
      ['Status', (record.status || 'paid').toUpperCase()],
    ];

    let y = 120;
    rows.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(String(label), 40, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value), 220, y);
      y += 24;
    });

    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for training with Iron Edge Fitness.', 40, y + 20);

    doc.save(`${record.invoiceId || record.id}.pdf`);
  }

  /* ============================================================ BOOTSTRAP */
  async function loadAccountData(user) {
    if (!user) {
      renderLoggedOutStatus();
      renderHistoryLoggedOut();
      return;
    }
    try {
      const [membership, history] = await Promise.all([
        getUserMembership(user.uid),
        getPaymentHistory(user.uid),
      ]);
      if (!membership) renderNoMembershipStatus();
      else renderMembershipStatus(membership);
      renderHistory(history);
    } catch (err) {
      console.error('[IronEdge membership] failed to load account data:', err);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initDurationToggle();
    initChoosePlanButtons();
  });

  // Dispatched by js/auth.js on every onAuthStateChanged call.
  document.addEventListener('ie:auth-state', (e) => {
    currentUser = e.detail.user;
    loadAccountData(currentUser);
  });
})();
