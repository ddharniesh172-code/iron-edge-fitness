/* ==========================================================================
   IRON EDGE FITNESS — js/firebase.js
   Firestore service layer for the Membership & Payment module.
   Consumed by js/membership.js and js/payment.js.

   Loaded as an ES module:
     import { ... } from '../js/firebase.js';

   Firestore schema
   ----------------
   memberships/{uid}
     uid, plan, duration, price, startDate, expiryDate, status,
     autoRenew, updatedAt

   payments/{auto-id}
     uid, invoiceId, plan, duration, basePrice, discount, couponCode,
     total, status, createdAt

   coupons/{CODE}                (optional Firestore-managed coupons)
     type: 'percent' | 'flat', value: number, active: boolean,
     minPlan?: string, expiresAt?: Timestamp
   ========================================================================== */

import { db, auth } from '../firebase/firebase-config.js';
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/* =========================================================== PLAN CATALOG */
// Base monthly price per plan. Quarterly/yearly apply a discount multiplier
// so longer commitments are visibly cheaper per month.
export const DURATIONS = {
  monthly:   { label: 'Monthly',   months: 1,  multiplier: 1,    discountLabel: null },
  quarterly: { label: 'Quarterly', months: 3,  multiplier: 2.7,  discountLabel: 'Save 10%' },
  yearly:    { label: 'Yearly',    months: 12, multiplier: 9.6,  discountLabel: 'Save 20%' },
};

export const PLAN_CATALOG = {
  basic: {
    id: 'basic',
    name: 'Basic',
    tagline: 'Get moving',
    monthlyPrice: 19,
    badge: null,
    color: '#8f887f',
    features: [
      { label: 'Gym floor access', included: true },
      { label: 'Locker room access', included: true },
      { label: 'BMI / BMR / Calorie tools', included: true },
      { label: 'AI Workout Planner', included: false },
      { label: 'Diet Planner', included: false },
      { label: 'Personal training sessions', included: false },
      { label: 'Priority booking', included: false },
      { label: '1-on-1 trainer chat', included: false },
    ],
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    tagline: 'Train with a plan',
    monthlyPrice: 35,
    badge: null,
    color: '#4ecbff',
    features: [
      { label: 'Gym floor access', included: true },
      { label: 'Locker room access', included: true },
      { label: 'BMI / BMR / Calorie tools', included: true },
      { label: 'AI Workout Planner', included: true },
      { label: 'Diet Planner', included: true },
      { label: 'Personal training sessions', included: false },
      { label: 'Priority booking', included: false },
      { label: '1-on-1 trainer chat', included: false },
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    tagline: 'Most popular',
    monthlyPrice: 49,
    badge: 'Most Popular',
    color: '#ff8f3f',
    features: [
      { label: 'Gym floor access', included: true },
      { label: 'Locker room access', included: true },
      { label: 'BMI / BMR / Calorie tools', included: true },
      { label: 'AI Workout Planner', included: true },
      { label: 'Diet Planner', included: true },
      { label: 'Personal training sessions', included: '2 / month' },
      { label: 'Priority booking', included: true },
      { label: '1-on-1 trainer chat', included: false },
    ],
  },
  vip: {
    id: 'vip',
    name: 'VIP',
    tagline: 'All access',
    monthlyPrice: 89,
    badge: 'Best Value',
    color: '#ffb347',
    features: [
      { label: 'Gym floor access', included: true },
      { label: 'Locker room access', included: true },
      { label: 'BMI / BMR / Calorie tools', included: true },
      { label: 'AI Workout Planner', included: true },
      { label: 'Diet Planner', included: true },
      { label: 'Personal training sessions', included: 'Unlimited' },
      { label: 'Priority booking', included: true },
      { label: '1-on-1 trainer chat', included: true },
    ],
  },
};

export function getPlanPrice(planId, duration) {
  const plan = PLAN_CATALOG[planId];
  const dur = DURATIONS[duration];
  if (!plan || !dur) return 0;
  return Math.round(plan.monthlyPrice * dur.multiplier * 100) / 100;
}

/* ================================================================ COUPONS */
// Local fallback catalog so checkout works out-of-the-box before you've
// seeded a `coupons` collection in Firestore. Firestore is checked first.
const LOCAL_COUPONS = {
  IRON10:  { type: 'percent', value: 10, active: true },
  EDGE20:  { type: 'percent', value: 20, active: true },
  FIRST50: { type: 'flat',    value: 50, active: true },
  WELCOME: { type: 'percent', value: 15, active: true },
};

/**
 * Validate a coupon code against Firestore (preferred) or the local
 * fallback table, and compute the discount for a given subtotal.
 * @returns {Promise<{valid:boolean, code:string, type?:string, value?:number, discountAmount:number, message:string}>}
 */
export async function validateCoupon(rawCode, subtotal) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) {
    return { valid: false, code, discountAmount: 0, message: 'Enter a coupon code.' };
  }

  let entry = null;
  try {
    const snap = await getDoc(doc(db, 'coupons', code));
    if (snap.exists()) entry = snap.data();
  } catch (err) {
    console.warn('[IronEdge firestore] coupon lookup failed, using local table:', err);
  }
  if (!entry) entry = LOCAL_COUPONS[code] || null;

  if (!entry || entry.active === false) {
    return { valid: false, code, discountAmount: 0, message: 'That coupon code is invalid or has expired.' };
  }
  if (entry.expiresAt && entry.expiresAt.toDate && entry.expiresAt.toDate() < new Date()) {
    return { valid: false, code, discountAmount: 0, message: 'That coupon code has expired.' };
  }

  const discountAmount =
    entry.type === 'flat'
      ? Math.min(entry.value, subtotal)
      : Math.round(subtotal * (entry.value / 100) * 100) / 100;

  return {
    valid: true,
    code,
    type: entry.type,
    value: entry.value,
    discountAmount,
    message:
      entry.type === 'flat'
        ? `$${entry.value} off applied.`
        : `${entry.value}% discount applied.`,
  };
}

/* ============================================================ MEMBERSHIP */
export function computeExpiryDate(startDate, duration) {
  const months = DURATIONS[duration]?.months || 1;
  const expiry = new Date(startDate);
  expiry.setMonth(expiry.getMonth() + months);
  return expiry;
}

/** Read the current user's membership document (or null if none yet). */
export async function getUserMembership(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, 'memberships', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Create or overwrite the caller's membership document, automatically
 * computing status ('active' | 'expired') from the expiry date.
 */
export async function upsertMembership(uid, { plan, duration, price, startDate = new Date() }) {
  const expiryDate = computeExpiryDate(startDate, duration);
  const payload = {
    uid,
    plan,
    duration,
    price,
    startDate: Timestamp.fromDate(new Date(startDate)),
    expiryDate: Timestamp.fromDate(expiryDate),
    status: 'active',
    autoRenew: false,
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'memberships', uid), payload, { merge: true });
  return payload;
}

/**
 * Derive a display-ready status from a membership record without waiting
 * on a server timestamp — expiry is compared against the local clock so
 * the UI reflects reality even if `status` in Firestore is stale (ideally
 * a scheduled Cloud Function flips `status` to 'expired' server-side too).
 */
export function computeMembershipStatus(membership) {
  if (!membership || !membership.expiryDate) {
    return { state: 'none', daysLeft: 0, expiryDate: null };
  }
  const expiry = membership.expiryDate.toDate ? membership.expiryDate.toDate() : new Date(membership.expiryDate);
  const now = new Date();
  const msLeft = expiry.getTime() - now.getTime();
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
  return {
    state: daysLeft > 0 ? 'active' : 'expired',
    daysLeft: Math.max(daysLeft, 0),
    expiryDate: expiry,
  };
}

/* ============================================================== PAYMENTS */
export function generateInvoiceId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `IEF-${stamp}-${rand}`;
}

/** Persist a completed (or simulated) payment to the `payments` collection. */
export async function addPaymentRecord({
  uid,
  plan,
  duration,
  basePrice,
  discount = 0,
  couponCode = null,
  total,
  status = 'paid',
}) {
  const invoiceId = generateInvoiceId();
  const record = {
    uid,
    invoiceId,
    plan,
    duration,
    basePrice,
    discount,
    couponCode,
    total,
    status,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, 'payments'), record);
  return { id: ref.id, ...record, createdAt: new Date() };
}

/** Fetch a user's payment history, most recent first. */
export async function getPaymentHistory(uid) {
  if (!uid) return [];
  try {
    const q = query(collection(db, 'payments'), where('uid', '==', uid), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    // Firestore requires a composite index for where()+orderBy() on first run;
    // fall back to an unordered read so the page still works before it's created.
    console.warn('[IronEdge firestore] ordered history query failed, retrying unordered:', err);
    const q = query(collection(db, 'payments'), where('uid', '==', uid));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }
}

/** Convenience: is a user currently signed in? Used by page guards. */
export function currentUser() {
  return auth.currentUser;
}
