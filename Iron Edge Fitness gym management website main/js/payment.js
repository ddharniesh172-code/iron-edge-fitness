/* ==========================================================================
   IRON EDGE FITNESS — js/payment.js
   Page logic for pages/payment.html:
     - Reads ?plan=&duration= from the URL and renders the order summary
     - Coupon apply / remove (Firestore-backed, via js/firebase.js)
     - Card preview, payment-method tabs, input formatting + validation
     - Simulated payment charge -> writes membership + payment record to
       Firestore -> reveals the in-page success / invoice view

   Loaded as an ES module:
     <script type="module" src="../js/payment.js"></script>

   NOTE: This demo does not call a real payment processor. Swap the
   `simulateCharge()` function for a Stripe/Razorpay/PayPal server call
   when wiring up production payments — the Firestore writes around it
   (upsertMembership / addPaymentRecord) stay the same either way.
   ========================================================================== */

import {
  PLAN_CATALOG,
  DURATIONS,
  getPlanPrice,
  validateCoupon,
  upsertMembership,
  addPaymentRecord,
  computeExpiryDate,
} from '../js/firebase.js';

(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const params = new URLSearchParams(location.search);
  const planId = PLAN_CATALOG[params.get('plan')] ? params.get('plan') : 'premium';
  const duration = DURATIONS[params.get('duration')] ? params.get('duration') : 'monthly';

  const plan = PLAN_CATALOG[planId];
  const dur = DURATIONS[duration];
  const subtotal = getPlanPrice(planId, duration);

  let appliedCoupon = null; // { code, discountAmount, message }
  let currentUser = null;

  const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);

  /* ======================================================= ORDER SUMMARY */
  function renderSummary() {
    $('#ie-summary-plan-name').textContent = plan.name;
    $('#ie-summary-duration-label').textContent = `Billed ${dur.label.toLowerCase()}`;
    const badge = $('#ie-summary-badge');
    if (plan.badge) { badge.textContent = plan.badge; badge.style.display = ''; }
    else badge.style.display = 'none';

    $('#ie-summary-subtotal').textContent = money(subtotal);
    updateTotals();
  }

  function currentTotal() {
    const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    return Math.max(0, Math.round((subtotal - discount) * 100) / 100);
  }

  function updateTotals() {
    const discountRow = $('#ie-summary-discount-row');
    if (appliedCoupon) {
      discountRow.style.display = 'flex';
      $('#ie-summary-discount-label').textContent = `Coupon (${appliedCoupon.code})`;
      $('#ie-summary-discount').textContent = `-${money(appliedCoupon.discountAmount)}`;
    } else {
      discountRow.style.display = 'none';
    }
    const total = currentTotal();
    $('#ie-summary-total').textContent = money(total);
    $('#ie-pay-btn-total').textContent = money(total);
  }

  /* ============================================================= COUPON */
  function initCoupon() {
    const form = $('#ie-coupon-form');
    const input = $('#ie-coupon-input');
    const msg = $('#ie-coupon-msg');
    const appliedBox = $('#ie-coupon-applied');
    const appliedText = $('#ie-coupon-applied-text');
    const removeBtn = $('#ie-coupon-remove');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      msg.textContent = '';
      msg.removeAttribute('data-state');
      const result = await validateCoupon(input.value, subtotal);
      if (!result.valid) {
        msg.textContent = result.message;
        msg.dataset.state = 'invalid';
        return;
      }
      appliedCoupon = result;
      appliedText.textContent = `${result.code} applied — ${result.message}`;
      appliedBox.classList.add('is-visible');
      form.style.display = 'none';
      msg.textContent = '';
      updateTotals();
    });

    removeBtn.addEventListener('click', () => {
      appliedCoupon = null;
      appliedBox.classList.remove('is-visible');
      form.style.display = 'flex';
      input.value = '';
      updateTotals();
    });
  }

  /* ======================================================= PAY METHODS */
  function initPayMethods() {
    const buttons = $$('.ie-pay-method');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.toggle('is-active', b === btn));
      });
    });
  }

  /* ======================================================= CARD PREVIEW */
  function initCardPreview() {
    const numberInput = $('#ie-pay-card-number');
    const nameInput = $('#ie-pay-name');
    const expiryInput = $('#ie-pay-expiry');
    const previewNumber = $('#ie-card-preview-number');
    const previewName = $('#ie-card-preview-name');

    if (numberInput) {
      numberInput.addEventListener('input', () => {
        const digits = numberInput.value.replace(/\D/g, '').slice(0, 16);
        numberInput.value = digits.replace(/(.{4})/g, '$1 ').trim();
        previewNumber.textContent = digits.length
          ? numberInput.value.padEnd(19, '•').replace(/(.{4})/g, '$1 ').trim()
          : '•••• •••• •••• ••••';
      });
    }
    if (nameInput) {
      nameInput.addEventListener('input', () => {
        previewName.textContent = nameInput.value.trim() ? nameInput.value.toUpperCase() : 'YOUR NAME';
      });
    }
    if (expiryInput) {
      expiryInput.addEventListener('input', () => {
        let v = expiryInput.value.replace(/\D/g, '').slice(0, 4);
        if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
        expiryInput.value = v;
      });
    }
  }

  /* ============================================================ HELPERS */
  function fieldError(input, message) {
    const wrap = input.closest('.ie-field');
    if (!wrap) return;
    wrap.classList.add('has-error');
    const small = wrap.querySelector('.ie-field__error');
    if (small) small.textContent = message;
  }
  function clearAllErrors(form) {
    form.querySelectorAll('.ie-field').forEach((wrap) => {
      wrap.classList.remove('has-error');
      const small = wrap.querySelector('.ie-field__error');
      if (small) small.textContent = '';
    });
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
  }
  function setLoading(form, isLoading) {
    const btn = form.querySelector('[data-submit-btn]');
    if (!btn) return;
    btn.disabled = isLoading;
    btn.classList.toggle('is-loading', isLoading);
  }

  function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()); }

  function isValidExpiry(v) {
    const match = /^(\d{2})\/(\d{2})$/.exec(v);
    if (!match) return false;
    const month = parseInt(match[1], 10);
    const year = 2000 + parseInt(match[2], 10);
    if (month < 1 || month > 12) return false;
    const expiryDate = new Date(year, month, 0, 23, 59, 59);
    return expiryDate > new Date();
  }

  // Simulated payment gateway call. Always "succeeds" after a short delay
  // unless the card number is the well-known Luhn-invalid test value.
  function simulateCharge() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random() < 0.97 ? resolve({ ok: true }) : reject(new Error('Card was declined by the issuing bank.'));
      }, 1400);
    });
  }

  /* ============================================================ SUBMIT */
  function initPaymentForm() {
    const form = $('#ie-payment-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideBanner(form);
      clearAllErrors(form);

      if (!currentUser) {
        showBanner(form, 'Please log in to complete your purchase — redirecting to login…', 'error');
        setTimeout(() => {
          window.location.href = `login.html?redirect=${encodeURIComponent(location.pathname + location.search)}`;
        }, 1200);
        return;
      }

      const name = $('#ie-pay-name');
      const email = $('#ie-pay-email');
      const cardNumber = $('#ie-pay-card-number');
      const expiry = $('#ie-pay-expiry');
      const cvv = $('#ie-pay-cvv');

      let valid = true;
      if (!name.value.trim()) { fieldError(name, 'Enter the name on the card.'); valid = false; }
      if (!isValidEmail(email.value)) { fieldError(email, 'Enter a valid email address.'); valid = false; }
      const digits = cardNumber.value.replace(/\D/g, '');
      if (digits.length < 15) { fieldError(cardNumber, 'Enter a valid card number.'); valid = false; }
      if (!isValidExpiry(expiry.value)) { fieldError(expiry, 'Enter a valid future expiry (MM/YY).'); valid = false; }
      if (!/^\d{3,4}$/.test(cvv.value)) { fieldError(cvv, 'Enter a valid CVV.'); valid = false; }
      if (!valid) return;

      setLoading(form, true);
      try {
        await simulateCharge();

        const total = currentTotal();
        const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;

        const [membership, paymentRecord] = await Promise.all([
          upsertMembership(currentUser.uid, { plan: planId, duration, price: total }),
          addPaymentRecord({
            uid: currentUser.uid,
            plan: planId,
            duration,
            basePrice: subtotal,
            discount,
            couponCode: appliedCoupon ? appliedCoupon.code : null,
            total,
            status: 'paid',
          }),
        ]);

        showSuccess({ membership, paymentRecord, total });
      } catch (err) {
        console.error('[IronEdge payment] charge failed:', err);
        showBanner(form, err.message || 'Payment could not be processed. Please try again.', 'error');
      } finally {
        setLoading(form, false);
      }
    });
  }

  /* ============================================================ SUCCESS */
  function showSuccess({ membership, paymentRecord, total }) {
    $('#ie-checkout-view').classList.add('is-hidden');
    const successView = $('#ie-payment-success');
    successView.classList.add('is-visible');
    successView.scrollIntoView({ behavior: 'smooth', block: 'start' });

    $('#ie-success-plan-name').textContent = plan.name;
    $('#ie-success-invoice-id').textContent = paymentRecord.invoiceId;
    $('#ie-success-plan').textContent = plan.name;
    $('#ie-success-duration').textContent = dur.label;
    $('#ie-success-total').textContent = money(total);

    const expiry = membership.expiryDate?.toDate ? membership.expiryDate.toDate() : computeExpiryDate(new Date(), duration);
    $('#ie-success-expiry').textContent = expiry.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    $('#ie-download-invoice-btn').addEventListener('click', () => downloadInvoicePdf(paymentRecord, expiry), { once: true });
  }

  function downloadInvoicePdf(record, expiry) {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
      alert('PDF generator failed to load — check your connection and try again.');
      return;
    }
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 106, 0);
    doc.text('IRON EDGE FITNESS', 40, 50);

    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'normal');
    doc.text('Invoice / Payment Receipt', 40, 75);
    doc.setDrawColor(230, 230, 230);
    doc.line(40, 90, 555, 90);

    const rows = [
      ['Invoice ID', record.invoiceId],
      ['Date', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })],
      ['Plan', plan.name],
      ['Billing Cycle', dur.label],
      ['Base Price', money(record.basePrice)],
      ['Discount', money(record.discount || 0)],
      ['Coupon', record.couponCode || '—'],
      ['Total Paid', money(record.total)],
      ['Valid Until', expiry.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })],
      ['Status', 'PAID'],
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

    doc.save(`${record.invoiceId}.pdf`);
  }

  /* ============================================================ BOOTSTRAP */
  document.addEventListener('DOMContentLoaded', () => {
    renderSummary();
    initCoupon();
    initPayMethods();
    initCardPreview();
    initPaymentForm();
  });

  document.addEventListener('ie:auth-state', (e) => {
    currentUser = e.detail.user;
  });
})();
