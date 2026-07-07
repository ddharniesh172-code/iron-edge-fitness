/* ==========================================================================
   IRON EDGE FITNESS — firebase/shop.js
   Firestore service layer for the Shop module: cart, wishlist, orders and
   product reviews — all scoped to the signed-in user. Consumed by
   js/shop.js on pages/shop.html, pages/cart.html, pages/wishlist.html.

   Loaded as an ES module:
     import { ... } from '../firebase/shop.js';

   Firestore schema
   ----------------
   carts/{uid}
     items: [{ productId, quantity, addedAt }], updatedAt

   wishlists/{uid}
     productIds: [string], updatedAt

   orders/{auto-id}
     uid, invoiceId, items: [{productId,name,price,quantity}],
     subtotal, discount, couponCode, shipping, total, status,
     shippingAddress, createdAt

   reviews/{auto-id}
     productId, uid, userName, rating, comment, createdAt

   Guest (logged-out) cart/wishlist state lives in localStorage — see
   js/shop.js — and is merged into Firestore the moment a user logs in via
   mergeLocalCartIntoFirestore() / mergeLocalWishlistIntoFirestore() below.
   ========================================================================== */

import { db } from '../firebase/firebase-config.js';
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

/* ================================================================= CART */
export async function getCart(uid) {
  if (!uid) return [];
  const snap = await getDoc(doc(db, 'carts', uid));
  return snap.exists() ? snap.data().items || [] : [];
}

export async function saveCart(uid, items) {
  if (!uid) return;
  await setDoc(doc(db, 'carts', uid), { items, updatedAt: serverTimestamp() }, { merge: true });
}

export async function addToCart(uid, productId, quantity = 1) {
  const items = await getCart(uid);
  const existing = items.find((i) => i.productId === productId);
  if (existing) existing.quantity += quantity;
  else items.push({ productId, quantity, addedAt: Timestamp.now() });
  await saveCart(uid, items);
  return items;
}

export async function updateCartQuantity(uid, productId, quantity) {
  let items = await getCart(uid);
  if (quantity <= 0) {
    items = items.filter((i) => i.productId !== productId);
  } else {
    const existing = items.find((i) => i.productId === productId);
    if (existing) existing.quantity = quantity;
  }
  await saveCart(uid, items);
  return items;
}

export async function removeFromCart(uid, productId) {
  const items = (await getCart(uid)).filter((i) => i.productId !== productId);
  await saveCart(uid, items);
  return items;
}

export async function clearCart(uid) {
  await saveCart(uid, []);
}

/** Merge a guest's localStorage cart into Firestore right after login. */
export async function mergeLocalCartIntoFirestore(uid, localItems) {
  if (!uid || !localItems?.length) return getCart(uid);
  const remoteItems = await getCart(uid);
  localItems.forEach(({ productId, quantity }) => {
    const existing = remoteItems.find((i) => i.productId === productId);
    if (existing) existing.quantity += quantity;
    else remoteItems.push({ productId, quantity, addedAt: Timestamp.now() });
  });
  await saveCart(uid, remoteItems);
  return remoteItems;
}

/* ============================================================= WISHLIST */
export async function getWishlist(uid) {
  if (!uid) return [];
  const snap = await getDoc(doc(db, 'wishlists', uid));
  return snap.exists() ? snap.data().productIds || [] : [];
}

async function saveWishlist(uid, productIds) {
  await setDoc(doc(db, 'wishlists', uid), { productIds, updatedAt: serverTimestamp() }, { merge: true });
}

/** Adds if absent, removes if present. Returns the updated list + new state. */
export async function toggleWishlist(uid, productId) {
  const list = await getWishlist(uid);
  const idx = list.indexOf(productId);
  let isNowSaved;
  if (idx === -1) { list.push(productId); isNowSaved = true; }
  else { list.splice(idx, 1); isNowSaved = false; }
  await saveWishlist(uid, list);
  return { list, isNowSaved };
}

export async function removeFromWishlist(uid, productId) {
  const list = (await getWishlist(uid)).filter((id) => id !== productId);
  await saveWishlist(uid, list);
  return list;
}

/** Merge a guest's localStorage wishlist into Firestore right after login. */
export async function mergeLocalWishlistIntoFirestore(uid, localIds) {
  if (!uid || !localIds?.length) return getWishlist(uid);
  const remote = await getWishlist(uid);
  const merged = Array.from(new Set([...remote, ...localIds]));
  await saveWishlist(uid, merged);
  return merged;
}

/* ================================================================ ORDERS */
export function generateOrderInvoiceId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `IEF-ORD-${stamp}-${rand}`;
}

/**
 * Persist a completed (or simulated) shop order.
 * @param {object} order { uid, items, subtotal, discount, couponCode, shipping, total, shippingAddress, status }
 */
export async function addOrder(order) {
  const invoiceId = generateOrderInvoiceId();
  const record = {
    ...order,
    invoiceId,
    status: order.status || 'placed',
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, 'orders'), record);
  return { id: ref.id, ...record, createdAt: new Date() };
}

/** Fetch a user's order history, most recent first. */
export async function getOrderHistory(uid) {
  if (!uid) return [];
  try {
    const q = query(collection(db, 'orders'), where('uid', '==', uid), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    // Falls back to an unordered read until the composite index finishes building.
    console.warn('[IronEdge firestore] ordered order-history query failed, retrying unordered:', err);
    const q = query(collection(db, 'orders'), where('uid', '==', uid));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }
}

/* =============================================================== REVIEWS */
/** Add a user review for a product. */
export async function addReview({ productId, uid, userName, rating, comment }) {
  const record = {
    productId,
    uid,
    userName: userName || 'Iron Edge Member',
    rating: Math.min(5, Math.max(1, Number(rating) || 5)),
    comment: String(comment || '').slice(0, 600),
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, 'reviews'), record);
  return { id: ref.id, ...record, createdAt: new Date() };
}

/** Fetch live Firestore reviews for a product, most recent first. */
export async function getProductReviews(productId) {
  try {
    const q = query(collection(db, 'reviews'), where('productId', '==', productId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('[IronEdge firestore] ordered review query failed, retrying unordered:', err);
    const q = query(collection(db, 'reviews'), where('productId', '==', productId));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }
}
