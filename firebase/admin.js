/* ==========================================================================
   IRON EDGE FITNESS — firebase/admin.js
   Firestore data layer for the Admin Panel: role checks, user management,
   membership/plan management, shop/product/order management, and
   analytics aggregation. Consumed by js/admin.js and each admin/*.html
   page's inline module script.

   Loaded as an ES module:
     import { ... } from '../firebase/admin.js';

   Firestore collections touched here (in addition to the ones already
   established in js/firebase.js and firebase/shop.js):
     users/{uid}          — written by js/auth.js, managed here
     plans/{planId}        — admin-editable membership plans (optional
                              override/extension of the static catalog in
                              js/firebase.js's PLAN_CATALOG)
     products/{productId}  — admin-editable product catalog (mirrors /
                              overrides js/product-data.js for the storefront)
     categories/{catId}    — admin-editable shop categories
     memberships/{uid}     — read/written by js/firebase.js already
     orders/{auto-id}      — read/written by firebase/shop.js already
     payments/{auto-id}    — read/written by js/firebase.js already

   IMPORTANT — client-side limitation: deleting a *Firestore* user profile
   here does NOT delete the person's actual Firebase Auth account or block
   them from logging in again. Fully removing an account (or minting a
   custom "admin" auth claim) requires the Firebase Admin SDK running in a
   trusted backend (e.g. a Cloud Function), which is outside the scope of
   this client-only project. `deleteUserRecord()` below removes the
   Firestore profile and is paired with `suspendUser()`, which is the
   practical, fully client-side way to cut off a member's access (the
   membership/booking UI should treat status:'suspended' as blocked).
   ========================================================================== */

import { db } from '../firebase/firebase-config.js';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/* ================================================================== ROLE */
export async function getUserProfile(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function isAdmin(uid) {
  const profile = await getUserProfile(uid);
  return !!profile && profile.role === 'admin' && profile.status !== 'suspended';
}

/* ========================================================= USER MANAGEMENT */
export async function listAllUsers() {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateUserRecord(uid, data) {
  await updateDoc(doc(db, 'users', uid), data);
}

export async function suspendUser(uid) {
  await updateDoc(doc(db, 'users', uid), { status: 'suspended', suspendedAt: serverTimestamp() });
}

export async function activateUser(uid) {
  await updateDoc(doc(db, 'users', uid), { status: 'active', suspendedAt: null });
}

export async function setUserRole(uid, role) {
  await updateDoc(doc(db, 'users', uid), { role });
}

/** Removes the Firestore profile only — see the file header note on why the
 *  Auth account itself can't be deleted from client-side code. */
export async function deleteUserRecord(uid) {
  await deleteDoc(doc(db, 'users', uid));
}

/* ================================================= MEMBERSHIP MANAGEMENT */
export async function getAllMemberships() {
  const snap = await getDocs(collection(db, 'memberships'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function setMembershipStatus(uid, status) {
  await updateDoc(doc(db, 'memberships', uid), { status, updatedAt: serverTimestamp() });
}

/** Extends a membership's expiry by `months` from today (or from its
 *  current expiry if that's still in the future), used by the admin
 *  "Renew Membership" action. */
export async function renewMembershipByAdmin(uid, months = 1) {
  const ref = doc(db, 'memberships', uid);
  const snap = await getDoc(ref);
  const now = new Date();
  const currentExpiry = snap.exists() && snap.data().expiryDate?.toDate ? snap.data().expiryDate.toDate() : now;
  const base = currentExpiry > now ? currentExpiry : now;
  const newExpiry = new Date(base);
  newExpiry.setMonth(newExpiry.getMonth() + months);

  await updateDoc(ref, {
    expiryDate: Timestamp.fromDate(newExpiry),
    status: 'active',
    updatedAt: serverTimestamp(),
  });
  return newExpiry;
}

/** Memberships expiring within `days` days — used for the expiry-alerts panel. */
export async function getExpiringMemberships(days = 7) {
  const all = await getAllMemberships();
  const now = new Date();
  const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return all.filter((m) => {
    if (!m.expiryDate?.toDate) return false;
    const expiry = m.expiryDate.toDate();
    return expiry >= now && expiry <= cutoff;
  });
}

/* -------------------------------------------------------- plan catalog */
export async function getAdminPlans() {
  const snap = await getDocs(collection(db, 'plans'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createPlan(planId, data) {
  await setDoc(doc(db, 'plans', planId), { ...data, createdAt: serverTimestamp() });
}

export async function updatePlan(planId, data) {
  await updateDoc(doc(db, 'plans', planId), { ...data, updatedAt: serverTimestamp() });
}

export async function deletePlan(planId) {
  await deleteDoc(doc(db, 'plans', planId));
}

/** One-time helper: pushes the static PLAN_CATALOG (js/firebase.js) into
 *  Firestore so the admin panel has editable rows to start from. */
export async function seedPlansFromCatalog(planCatalog) {
  const batch = writeBatch(db);
  Object.values(planCatalog).forEach((plan) => {
    batch.set(doc(db, 'plans', plan.id), { ...plan, createdAt: serverTimestamp() }, { merge: true });
  });
  await batch.commit();
}

/* ======================================================= SHOP MANAGEMENT */
export async function getAdminProducts() {
  const snap = await getDocs(collection(db, 'products'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addProduct(productId, data) {
  await setDoc(doc(db, 'products', productId), { ...data, createdAt: serverTimestamp() });
}

export async function updateProduct(productId, data) {
  await updateDoc(doc(db, 'products', productId), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteProduct(productId) {
  await deleteDoc(doc(db, 'products', productId));
}

export async function updateProductStock(productId, stock) {
  await updateDoc(doc(db, 'products', productId), { stock, updatedAt: serverTimestamp() });
}

/** One-time helper: pushes the static PRODUCTS catalog (js/product-data.js)
 *  into Firestore so the admin panel has editable rows to start from. */
export async function seedProductsFromCatalog(products) {
  const batch = writeBatch(db);
  products.forEach((p) => {
    batch.set(doc(db, 'products', p.id), { ...p, createdAt: serverTimestamp() }, { merge: true });
  });
  await batch.commit();
}

/* -------------------------------------------------------------- categories */
export async function getAdminCategories() {
  const snap = await getDocs(collection(db, 'categories'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addCategory(categoryId, data) {
  await setDoc(doc(db, 'categories', categoryId), data);
}

export async function deleteCategory(categoryId) {
  await deleteDoc(doc(db, 'categories', categoryId));
}

export async function seedCategoriesFromCatalog(categories) {
  const batch = writeBatch(db);
  categories.forEach((c) => batch.set(doc(db, 'categories', c.id), c, { merge: true }));
  await batch.commit();
}

/* -------------------------------------------------------------- orders */
export async function getAllOrders() {
  try {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('[IronEdge admin] ordered orders query failed, retrying unordered:', err);
    const snap = await getDocs(collection(db, 'orders'));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }
}

export async function updateOrderStatus(orderId, status) {
  await updateDoc(doc(db, 'orders', orderId), { status, updatedAt: serverTimestamp() });
}

/* ==================================================================== TRAINERS */
export async function getAdminTrainers() {
  const snap = await getDocs(collection(db, 'trainers'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addTrainer(trainerId, data) {
  await setDoc(doc(db, 'trainers', trainerId), { ...data, createdAt: serverTimestamp() });
}

export async function updateTrainer(trainerId, data) {
  await updateDoc(doc(db, 'trainers', trainerId), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteTrainer(trainerId) {
  await deleteDoc(doc(db, 'trainers', trainerId));
}

/* ================================================================ ANALYTICS */
function toDate(ts) {
  return ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null;
}
function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * One aggregation pass over users / memberships / payments / orders that
 * powers the dashboard overview cards. At this project's scale a client-side
 * pass is fine; at real production volume this should move to scheduled
 * Cloud Functions writing rollups into an `analytics` collection instead of
 * reading every document on every dashboard load.
 */
export async function getDashboardStats() {
  const [users, memberships, paymentsSnap, ordersSnap] = await Promise.all([
    listAllUsers(),
    getAllMemberships(),
    getDocs(collection(db, 'payments')).catch(() => ({ docs: [] })),
    getDocs(collection(db, 'orders')).catch(() => ({ docs: [] })),
  ]);

  const payments = paymentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const orders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const now = new Date();
  let activeMemberships = 0;
  let expiredMemberships = 0;
  memberships.forEach((m) => {
    const expiry = toDate(m.expiryDate);
    if (expiry && expiry > now) activeMemberships++;
    else expiredMemberships++;
  });

  const membershipRevenue = payments.reduce((sum, p) => sum + (p.total || 0), 0);
  const shopRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalRevenue = membershipRevenue + shopRevenue;

  const todayRevenue = [...payments, ...orders].reduce((sum, r) => {
    const d = toDate(r.createdAt);
    return d && isSameDay(d, now) ? sum + (r.total || 0) : sum;
  }, 0);

  const monthNow = monthKey(now);
  const monthRevenue = [...payments, ...orders].reduce((sum, r) => {
    const d = toDate(r.createdAt);
    return d && monthKey(d) === monthNow ? sum + (r.total || 0) : sum;
  }, 0);

  const productSalesCount = orders.reduce((sum, o) => sum + (o.items?.reduce((n, i) => n + (i.quantity || 0), 0) || 0), 0);

  const recentUsers = users
    .slice()
    .sort((a, b) => (toDate(b.lastLogin)?.getTime() || 0) - (toDate(a.lastLogin)?.getTime() || 0))
    .slice(0, 8);

  return {
    totalMembers: users.length,
    activeMemberships,
    expiredMemberships,
    totalRevenue,
    todayRevenue,
    monthRevenue,
    productSalesCount,
    totalOrders: orders.length,
    totalPayments: payments.length,
    recentUsers,
  };
}

/** Revenue (memberships + shop) grouped by month for the last `months` months. */
export async function getRevenueByMonth(months = 6) {
  const [paymentsSnap, ordersSnap] = await Promise.all([
    getDocs(collection(db, 'payments')).catch(() => ({ docs: [] })),
    getDocs(collection(db, 'orders')).catch(() => ({ docs: [] })),
  ]);
  const records = [...paymentsSnap.docs, ...ordersSnap.docs].map((d) => d.data());

  const buckets = {};
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets[monthKey(d)] = { label: d.toLocaleDateString('en-US', { month: 'short' }), total: 0 };
  }
  records.forEach((r) => {
    const d = toDate(r.createdAt);
    if (!d) return;
    const key = monthKey(d);
    if (buckets[key]) buckets[key].total += r.total || 0;
  });
  return Object.values(buckets);
}

/** New user signups grouped by month for the last `months` months. */
export async function getUserGrowth(months = 6) {
  const users = await listAllUsers();
  const buckets = {};
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets[monthKey(d)] = { label: d.toLocaleDateString('en-US', { month: 'short' }), count: 0 };
  }
  users.forEach((u) => {
    const d = toDate(u.createdAt);
    if (!d) return;
    const key = monthKey(d);
    if (buckets[key]) buckets[key].count += 1;
  });
  return Object.values(buckets);
}

/** New memberships started, grouped by month for the last `months` months. */
export async function getMembershipGrowth(months = 6) {
  const memberships = await getAllMemberships();
  const buckets = {};
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets[monthKey(d)] = { label: d.toLocaleDateString('en-US', { month: 'short' }), count: 0 };
  }
  memberships.forEach((m) => {
    const d = toDate(m.startDate);
    if (!d) return;
    const key = monthKey(d);
    if (buckets[key]) buckets[key].count += 1;
  });
  return Object.values(buckets);
}

/**
 * Workout completion stats. Reads a `completedWorkouts` collection that the
 * (still in-progress) Workout module will populate — safe to call before
 * that collection exists, since an empty read just yields zeros rather
 * than an error.
 */
export async function getWorkoutStats() {
  try {
    const snap = await getDocs(collection(db, 'completedWorkouts'));
    const docs = snap.docs.map((d) => d.data());
    const byBodyPart = {};
    docs.forEach((w) => { byBodyPart[w.bodyPart] = (byBodyPart[w.bodyPart] || 0) + 1; });
    return {
      totalSessions: docs.length,
      totalCaloriesBurned: docs.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0),
      byBodyPart,
    };
  } catch (err) {
    console.warn('[IronEdge admin] workout stats unavailable yet:', err);
    return { totalSessions: 0, totalCaloriesBurned: 0, byBodyPart: {} };
  }
}

/**
 * Diet logging stats. Reads a `dietLogs` collection that the (still
 * in-progress) Diet module will populate — same safe-empty-read behavior
 * as getWorkoutStats().
 */
export async function getDietStats() {
  try {
    const snap = await getDocs(collection(db, 'dietLogs'));
    const docs = snap.docs.map((d) => d.data());
    return {
      totalLogs: docs.length,
      avgCalories: docs.length ? Math.round(docs.reduce((sum, d) => sum + (d.calories || 0), 0) / docs.length) : 0,
    };
  } catch (err) {
    console.warn('[IronEdge admin] diet stats unavailable yet:', err);
    return { totalLogs: 0, avgCalories: 0 };
  }
}
