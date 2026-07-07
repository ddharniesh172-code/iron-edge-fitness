/* ==========================================================================
   IRON EDGE FITNESS — js/shop.js
   Page logic for pages/shop.html, pages/cart.html, pages/wishlist.html.
   Detects which page it's on by checking for that page's DOM anchors, so
   one module can safely be included everywhere (same pattern as main.js).

   Loaded as an ES module:
     <script type="module" src="../js/shop.js"></script>

   Guest (logged-out) cart/wishlist state lives in localStorage under
   'ie-guest-cart' / 'ie-guest-wishlist' and is merged into Firestore via
   firebase/shop.js the moment a user logs in.
   ========================================================================== */

import {
  PRODUCTS,
  CATEGORIES,
  getProductById,
  getCategoryById,
  getFinalPrice,
  searchProducts,
  getRelatedProducts,
} from '../js/product-data.js';

import {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  mergeLocalCartIntoFirestore,
  getWishlist,
  toggleWishlist,
  mergeLocalWishlistIntoFirestore,
  addOrder,
  getOrderHistory,
  addReview,
  getProductReviews,
} from '../firebase/shop.js';

(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const GUEST_CART_KEY = 'ie-guest-cart';
  const GUEST_WISHLIST_KEY = 'ie-guest-wishlist';
  const FREE_SHIPPING_THRESHOLD = 75;
  const FLAT_SHIPPING = 6.99;

  const state = {
    currentUser: null,
    cart: [],       // [{ productId, quantity }]
    wishlist: [],   // [productId]
    searchTerm: '',
    category: 'all',
    sort: 'featured',
    activeProductId: null,
  };

  const money = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);

  /* ------------------------------------------------------------ localStorage */
  function readLocal(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch { return fallback; }
  }
  function writeLocal(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /* ==================================================================== CART */
  async function loadCart() {
    state.cart = state.currentUser ? await getCart(state.currentUser.uid) : readLocal(GUEST_CART_KEY, []);
  }

  async function addItemToCart(productId, quantity = 1) {
    if (state.currentUser) {
      state.cart = await addToCart(state.currentUser.uid, productId, quantity);
    } else {
      const items = readLocal(GUEST_CART_KEY, []);
      const existing = items.find((i) => i.productId === productId);
      if (existing) existing.quantity += quantity;
      else items.push({ productId, quantity });
      writeLocal(GUEST_CART_KEY, items);
      state.cart = items;
    }
    renderCartBadgeAware();
  }

  async function setItemQuantity(productId, quantity) {
    if (state.currentUser) {
      state.cart = await updateCartQuantity(state.currentUser.uid, productId, quantity);
    } else {
      let items = readLocal(GUEST_CART_KEY, []);
      if (quantity <= 0) items = items.filter((i) => i.productId !== productId);
      else {
        const existing = items.find((i) => i.productId === productId);
        if (existing) existing.quantity = quantity;
      }
      writeLocal(GUEST_CART_KEY, items);
      state.cart = items;
    }
    renderCartBadgeAware();
  }

  async function removeItemFromCart(productId) {
    if (state.currentUser) {
      state.cart = await removeFromCart(state.currentUser.uid, productId);
    } else {
      const items = readLocal(GUEST_CART_KEY, []).filter((i) => i.productId !== productId);
      writeLocal(GUEST_CART_KEY, items);
      state.cart = items;
    }
    renderCartBadgeAware();
  }

  async function emptyCart() {
    if (state.currentUser) await clearCart(state.currentUser.uid);
    writeLocal(GUEST_CART_KEY, []);
    state.cart = [];
    renderCartBadgeAware();
  }

  function renderCartBadgeAware() {
    if ($('#ie-cart-view')) renderCartPage();
  }

  /* ================================================================ WISHLIST */
  async function loadWishlist() {
    state.wishlist = state.currentUser ? await getWishlist(state.currentUser.uid) : readLocal(GUEST_WISHLIST_KEY, []);
  }

  async function toggleWishlistItem(productId) {
    let isNowSaved;
    if (state.currentUser) {
      const result = await toggleWishlist(state.currentUser.uid, productId);
      state.wishlist = result.list;
      isNowSaved = result.isNowSaved;
    } else {
      const list = readLocal(GUEST_WISHLIST_KEY, []);
      const idx = list.indexOf(productId);
      if (idx === -1) { list.push(productId); isNowSaved = true; }
      else { list.splice(idx, 1); isNowSaved = false; }
      writeLocal(GUEST_WISHLIST_KEY, list);
      state.wishlist = list;
    }
    $$(`[data-wishlist-toggle="${productId}"]`).forEach((btn) => {
      btn.classList.toggle('is-active', isNowSaved);
      btn.innerHTML = isNowSaved ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-regular fa-heart"></i>';
    });
    if ($('#ie-wishlist-grid')) renderWishlistPage();
    return isNowSaved;
  }

  /* ---------------------------------------------------------- guest -> account sync */
  async function syncGuestDataOnLogin() {
    const localCart = readLocal(GUEST_CART_KEY, []);
    const localWishlist = readLocal(GUEST_WISHLIST_KEY, []);
    if (localCart.length) {
      await mergeLocalCartIntoFirestore(state.currentUser.uid, localCart);
      writeLocal(GUEST_CART_KEY, []);
    }
    if (localWishlist.length) {
      await mergeLocalWishlistIntoFirestore(state.currentUser.uid, localWishlist);
      writeLocal(GUEST_WISHLIST_KEY, []);
    }
  }

  /* ============================================================== HELPERS === */
  function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    let html = '';
    for (let i = 0; i < full; i++) html += '<i class="fa-solid fa-star"></i>';
    if (half) html += '<i class="fa-solid fa-star-half-stroke"></i>';
    for (let i = full + (half ? 1 : 0); i < 5; i++) html += '<i class="fa-regular fa-star"></i>';
    return html;
  }

  function toast(message) {
    const el = $('#ie-toast');
    if (!el) return;
    $('#ie-toast-text').textContent = message;
    el.classList.add('is-visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('is-visible'), 2400);
  }

  function stockLabel(stock) {
    return { 'in-stock': 'In Stock', 'low-stock': 'Low Stock', 'out-of-stock': 'Out of Stock' }[stock] || stock;
  }

  /* =========================================================== PRODUCT CARD */
  function productCardHtml(product, { showMoveToCart = false } = {}) {
    const finalPrice = getFinalPrice(product);
    const isWished = state.wishlist.includes(product.id);
    const outOfStock = product.stock === 'out-of-stock';

    return `
      <div class="ie-glass ie-card ie-product-card" data-reveal>
        <div class="ie-product-card__media" data-open-product="${product.id}">
          <img src="${product.images[0]}" alt="${product.name}" loading="lazy">
          ${product.discountPercent ? `<span class="ie-product-card__discount">-${product.discountPercent}%</span>` : ''}
          <span class="ie-product-card__stock" data-stock="${product.stock}">${stockLabel(product.stock)}</span>
          <button type="button" class="ie-wishlist-toggle ${isWished ? 'is-active' : ''}" data-wishlist-toggle="${product.id}" aria-label="Toggle wishlist">
            <i class="fa-${isWished ? 'solid' : 'regular'} fa-heart"></i>
          </button>
        </div>
        <div class="ie-product-card__body">
          <p class="ie-product-card__category">${getCategoryById(product.category)?.name || product.category}</p>
          <h3 class="ie-product-card__name" data-open-product="${product.id}">${product.name}</h3>
          <div class="ie-product-card__rating"><span class="stars">${renderStars(product.rating)}</span> (${product.reviewCount})</div>
          <div class="ie-product-card__price-row">
            <span class="ie-product-card__price">${money(finalPrice)}</span>
            ${product.discountPercent ? `<span class="ie-product-card__price--strike">${money(product.price)}</span>` : ''}
          </div>
          <div class="ie-product-card__footer">
            ${showMoveToCart
              ? `<button type="button" class="ie-add-cart-btn" data-move-to-cart="${product.id}" ${outOfStock ? 'disabled' : ''}>
                   <i class="fa-solid fa-cart-plus"></i> Move to Cart
                 </button>`
              : `<button type="button" class="ie-add-cart-btn" data-add-cart="${product.id}" ${outOfStock ? 'disabled' : ''}>
                   <i class="fa-solid fa-cart-plus"></i> ${outOfStock ? 'Out of Stock' : 'Add to Cart'}
                 </button>`}
          </div>
        </div>
      </div>`;
  }

  function wireProductCardEvents(scope) {
    $$('[data-open-product]', scope).forEach((el) =>
      el.addEventListener('click', () => openProductModal(el.dataset.openProduct))
    );
    $$('[data-wishlist-toggle]', scope).forEach((btn) =>
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleWishlistItem(btn.dataset.wishlistToggle).then((saved) =>
          toast(saved ? 'Added to wishlist' : 'Removed from wishlist')
        );
      })
    );
    $$('[data-add-cart]', scope).forEach((btn) =>
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (btn.disabled) return;
        await addItemToCart(btn.dataset.addCart, 1);
        toast('Added to cart');
      })
    );
    $$('[data-move-to-cart]', scope).forEach((btn) =>
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (btn.disabled) return;
        await addItemToCart(btn.dataset.moveToCart, 1);
        await toggleWishlistItem(btn.dataset.moveToCart);
        toast('Moved to cart');
      })
    );
  }

  /* ================================================================ SHOP PAGE */
  function initShopPage() {
    const grid = $('#ie-product-grid');
    if (!grid) return;

    const rail = $('#ie-category-rail');
    CATEGORIES.forEach((cat) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ie-category-chip';
      btn.dataset.category = cat.id;
      btn.innerHTML = `<i class="${cat.icon}"></i> ${cat.name}`;
      rail.appendChild(btn);
    });

    rail.addEventListener('click', (e) => {
      const chip = e.target.closest('.ie-category-chip');
      if (!chip) return;
      state.category = chip.dataset.category;
      $$('.ie-category-chip', rail).forEach((c) => c.classList.toggle('is-active', c === chip));
      renderShopGrid();
    });

    let searchTimer;
    $('#ie-shop-search-input').addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.searchTerm = e.target.value;
        renderShopGrid();
      }, 200);
    });

    $('#ie-shop-sort').addEventListener('change', (e) => {
      state.sort = e.target.value;
      renderShopGrid();
    });

    renderShopGrid();
  }

  function renderShopGrid() {
    const grid = $('#ie-product-grid');
    if (!grid) return;

    let list = state.searchTerm ? searchProducts(state.searchTerm) : PRODUCTS.slice();
    if (state.category !== 'all') list = list.filter((p) => p.category === state.category);

    if (state.sort === 'price-low') list.sort((a, b) => getFinalPrice(a) - getFinalPrice(b));
    else if (state.sort === 'price-high') list.sort((a, b) => getFinalPrice(b) - getFinalPrice(a));
    else if (state.sort === 'rating') list.sort((a, b) => b.rating - a.rating);

    $('#ie-shop-result-count').textContent = `${list.length} product${list.length === 1 ? '' : 's'}`;

    if (!list.length) {
      grid.innerHTML = `
        <div class="ie-shop-empty">
          <i class="fa-solid fa-magnifying-glass"></i>
          <p>No products match your search or filters.</p>
        </div>`;
      return;
    }

    grid.innerHTML = list.map((p) => productCardHtml(p)).join('');
    wireProductCardEvents(grid);
  }

  /* ============================================================ PRODUCT MODAL */
  async function openProductModal(productId) {
    const modal = $('#ie-product-modal');
    if (!modal) return;
    const product = getProductById(productId);
    if (!product) return;
    state.activeProductId = productId;

    const finalPrice = getFinalPrice(product);
    const isWished = state.wishlist.includes(product.id);
    let qty = 1;

    $('#ie-modal-body').innerHTML = `
      <div>
        <div class="ie-gallery-main"><img src="${product.images[0]}" alt="${product.name}" id="ie-gallery-main-img"></div>
        <div class="ie-gallery-thumbs">
          ${product.images.map((img, i) => `<img src="${img}" class="${i === 0 ? 'is-active' : ''}" data-thumb="${img}" alt="${product.name} view ${i + 1}">`).join('')}
        </div>
      </div>
      <div>
        <p class="ie-modal-brand">${product.brand}</p>
        <h2 class="ie-modal-title">${product.name}</h2>
        <div class="ie-modal-price-row">
          <span class="ie-modal-price">${money(finalPrice)}</span>
          ${product.discountPercent ? `<span class="ie-modal-price--strike">${money(product.price)}</span>` : ''}
        </div>
        <p class="ie-modal-stock" data-stock="${product.stock}"><i class="fa-solid fa-circle" style="font-size:6px; vertical-align:middle;"></i> ${stockLabel(product.stock)}</p>
        <p class="ie-modal-desc">${product.description}</p>
        <ul class="ie-modal-highlights">
          ${product.highlights.map((h) => `<li><i class="fa-solid fa-check"></i> ${h}</li>`).join('')}
        </ul>

        <div class="ie-qty-stepper" id="ie-modal-qty-stepper">
          <button type="button" data-qty="dec">−</button>
          <span id="ie-modal-qty-value">1</span>
          <button type="button" data-qty="inc">+</button>
        </div>

        <div class="ie-modal-actions">
          <button type="button" class="ie-btn ie-btn-primary" id="ie-modal-add-cart" ${product.stock === 'out-of-stock' ? 'disabled' : ''}>
            <i class="fa-solid fa-cart-plus"></i> Add to Cart
          </button>
          <button type="button" class="ie-btn ie-btn-ghost" id="ie-modal-wishlist-btn" data-wishlist-toggle="${product.id}">
            <i class="fa-${isWished ? 'solid' : 'regular'} fa-heart"></i> ${isWished ? 'Saved' : 'Save'}
          </button>
        </div>

        <div class="ie-modal-tabs">
          <button type="button" class="ie-modal-tab is-active" data-tab="desc">Description</button>
          <button type="button" class="ie-modal-tab" data-tab="reviews">Reviews (${product.reviewCount})</button>
        </div>
        <div class="ie-modal-tabpanel is-active" data-tabpanel="desc">
          <p style="font-size:0.87rem; color:var(--ie-text-muted);">Target audience: everyday training use. Store in a cool, dry place. See packaging for full usage instructions.</p>
        </div>
        <div class="ie-modal-tabpanel" data-tabpanel="reviews" id="ie-modal-reviews-panel">
          <p style="font-size:0.85rem; color:var(--ie-ash);">Loading reviews…</p>
        </div>
      </div>
    `;

    modal.classList.add('is-open');
    document.documentElement.style.overflow = 'hidden';

    // gallery thumbs
    $$('.ie-gallery-thumbs img', modal).forEach((thumb) => {
      thumb.addEventListener('click', () => {
        $('#ie-gallery-main-img').src = thumb.dataset.thumb;
        $$('.ie-gallery-thumbs img', modal).forEach((t) => t.classList.toggle('is-active', t === thumb));
      });
    });

    // qty stepper
    $('#ie-modal-qty-stepper').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-qty]');
      if (!btn) return;
      qty = btn.dataset.qty === 'inc' ? qty + 1 : Math.max(1, qty - 1);
      $('#ie-modal-qty-value').textContent = qty;
    });

    // add to cart
    $('#ie-modal-add-cart').addEventListener('click', async () => {
      await addItemToCart(product.id, qty);
      toast(`Added ${qty} × ${product.name} to cart`);
    });

    // wishlist toggle inside modal
    $('#ie-modal-wishlist-btn').addEventListener('click', async () => {
      const saved = await toggleWishlistItem(product.id);
      $('#ie-modal-wishlist-btn').innerHTML = `<i class="fa-${saved ? 'solid' : 'regular'} fa-heart"></i> ${saved ? 'Saved' : 'Save'}`;
    });

    // tabs
    $$('.ie-modal-tab', modal).forEach((tab) => {
      tab.addEventListener('click', () => {
        $$('.ie-modal-tab', modal).forEach((t) => t.classList.toggle('is-active', t === tab));
        $$('.ie-modal-tabpanel', modal).forEach((p) => p.classList.toggle('is-active', p.dataset.tabpanel === tab.dataset.tab));
      });
    });

    loadReviewsIntoModal(product);
  }

  async function loadReviewsIntoModal(product) {
    const panel = $('#ie-modal-reviews-panel');
    let liveReviews = [];
    try { liveReviews = await getProductReviews(product.id); }
    catch (err) { console.warn('[IronEdge shop] live reviews failed to load:', err); }

    const seedReviews = product.reviews.map((r) => ({ ...r, userName: r.user }));
    const allReviews = [...liveReviews, ...seedReviews];

    const reviewsHtml = allReviews
      .map(
        (r) => `
      <div class="ie-review-item">
        <div class="ie-review-item__top">
          <span class="ie-review-item__user">${r.userName || r.user}</span>
          <span class="ie-review-item__date">${r.date || (r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : '')}</span>
        </div>
        <div class="ie-review-item__stars">${renderStars(r.rating)}</div>
        <p class="ie-review-item__comment">${r.comment}</p>
      </div>`
      )
      .join('');

    const formHtml = state.currentUser
      ? `
      <form class="ie-review-form" id="ie-review-form">
        <label style="font-size:0.85rem; font-weight:600;">Your rating</label>
        <div class="ie-star-input" id="ie-review-star-input">
          ${[1, 2, 3, 4, 5].map((n) => `<i class="fa-solid fa-star" data-star="${n}"></i>`).join('')}
        </div>
        <input type="hidden" id="ie-review-rating-value" value="5">
        <textarea id="ie-review-comment" placeholder="Share how this product worked for you…" required></textarea>
        <button type="submit" class="ie-btn ie-btn-primary ie-btn-sm" style="margin-top:12px;">Submit Review</button>
      </form>`
      : `<p style="font-size:0.85rem; color:var(--ie-ash); margin-top:16px;"><a href="login.html" style="color:var(--ie-orange-400);">Log in</a> to leave a review.</p>`;

    panel.innerHTML = reviewsHtml + formHtml;

    if (state.currentUser) {
      let rating = 5;
      const stars = $$('#ie-review-star-input i', panel);
      const paintStars = () => stars.forEach((s, i) => s.classList.toggle('is-filled', i < rating));
      paintStars();
      stars.forEach((s, i) => s.addEventListener('click', () => { rating = i + 1; paintStars(); }));

      $('#ie-review-form', panel).addEventListener('submit', async (e) => {
        e.preventDefault();
        const comment = $('#ie-review-comment', panel).value.trim();
        if (!comment) return;
        await addReview({
          productId: product.id,
          uid: state.currentUser.uid,
          userName: state.currentUser.displayName || 'Iron Edge Member',
          rating,
          comment,
        });
        toast('Review submitted — thank you!');
        loadReviewsIntoModal(product);
      });
    }
  }

  function initProductModal() {
    const modal = $('#ie-product-modal');
    if (!modal) return;
    const close = () => {
      modal.classList.remove('is-open');
      document.documentElement.style.overflow = '';
    };
    $('#ie-modal-close').addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  /* ================================================================ CART PAGE */
  function initCartPage() {
    if (!$('#ie-cart-view')) return;

    $('#ie-proceed-checkout-btn').addEventListener('click', () => {
      if (!state.cart.length) return;
      showCheckoutView();
    });
    $('#ie-back-to-cart-btn').addEventListener('click', showCartView);
    initCheckoutForm();

    renderCartPage();
  }

  function cartLineItems() {
    return state.cart
      .map((item) => {
        const product = getProductById(item.productId);
        if (!product) return null;
        const price = getFinalPrice(product);
        return { product, quantity: item.quantity, price, lineTotal: price * item.quantity };
      })
      .filter(Boolean);
  }

  function cartTotals(lines) {
    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
    return { subtotal, shipping, total: subtotal + shipping };
  }

  function renderCartPage() {
    const panel = $('#ie-cart-items-panel');
    if (!panel) return;
    const lines = cartLineItems();

    if (!lines.length) {
      panel.innerHTML = `
        <div class="ie-empty-cart">
          <i class="fa-solid fa-cart-shopping"></i>
          <p>Your cart is empty.</p>
          <a href="shop.html" class="ie-btn ie-btn-primary">Browse the Shop</a>
        </div>`;
    } else {
      panel.innerHTML = lines
        .map(
          (l) => `
        <div class="ie-cart-item" data-cart-row="${l.product.id}">
          <div class="ie-cart-item__img"><img src="${l.product.images[0]}" alt="${l.product.name}"></div>
          <div>
            <p class="ie-cart-item__name">${l.product.name}</p>
            <p class="ie-cart-item__meta">${getCategoryById(l.product.category)?.name || ''}</p>
            <div class="ie-cart-item__row">
              <div class="ie-qty-stepper" data-cart-qty="${l.product.id}">
                <button type="button" data-qty="dec">−</button>
                <span>${l.quantity}</span>
                <button type="button" data-qty="inc">+</button>
              </div>
              <span class="ie-cart-item__price">${money(l.lineTotal)}</span>
              <button type="button" class="ie-cart-item__remove" data-remove-cart="${l.product.id}">
                <i class="fa-solid fa-trash"></i> Remove
              </button>
            </div>
          </div>
        </div>`
        )
        .join('');

      $$('[data-cart-qty]', panel).forEach((stepper) => {
        const id = stepper.dataset.cartQty;
        stepper.addEventListener('click', async (e) => {
          const btn = e.target.closest('[data-qty]');
          if (!btn) return;
          const current = state.cart.find((i) => i.productId === id)?.quantity || 1;
          const next = btn.dataset.qty === 'inc' ? current + 1 : current - 1;
          await setItemQuantity(id, next);
        });
      });
      $$('[data-remove-cart]', panel).forEach((btn) =>
        btn.addEventListener('click', async () => {
          await removeItemFromCart(btn.dataset.removeCart);
          toast('Item removed');
        })
      );
    }

    const totals = cartTotals(lines);
    $('#ie-cart-subtotal').textContent = money(totals.subtotal);
    $('#ie-cart-shipping').textContent = totals.shipping === 0 ? 'Free' : money(totals.shipping);
    $('#ie-cart-total').textContent = money(totals.total);
  }

  function showCheckoutView() {
    $('#ie-cart-view').classList.add('is-hidden');
    $('#ie-cart-checkout-view').classList.remove('is-hidden');
    const lines = cartLineItems();
    const totals = cartTotals(lines);

    $('#ie-checkout-summary-lines').innerHTML = `
      <div class="ie-summary-line"><span>Items (${lines.reduce((n, l) => n + l.quantity, 0)})</span><span>${money(totals.subtotal)}</span></div>
      <div class="ie-summary-line"><span>Shipping</span><span>${totals.shipping === 0 ? 'Free' : money(totals.shipping)}</span></div>
    `;
    $('#ie-checkout-total').textContent = money(totals.total);
    $('#ie-checkout-btn-total').textContent = money(totals.total);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showCartView() {
    $('#ie-cart-checkout-view').classList.add('is-hidden');
    $('#ie-cart-view').classList.remove('is-hidden');
  }

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
  function setLoading(form, isLoading) {
    const btn = form.querySelector('[data-submit-btn]');
    if (!btn) return;
    btn.disabled = isLoading;
    btn.classList.toggle('is-loading', isLoading);
  }
  function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()); }

  function initCheckoutForm() {
    const form = $('#ie-shop-checkout-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllErrors(form);

      if (!state.currentUser) {
        showBanner(form, 'Please log in to place your order — redirecting…', 'error');
        setTimeout(() => { window.location.href = 'login.html?redirect=cart.html'; }, 1200);
        return;
      }

      const fields = {
        name: $('#ie-ship-name'), email: $('#ie-ship-email'), address: $('#ie-ship-address'),
        city: $('#ie-ship-city'), zip: $('#ie-ship-zip'), country: $('#ie-ship-country'),
        card: $('#ie-ship-card'), expiry: $('#ie-ship-expiry'), cvv: $('#ie-ship-cvv'),
      };
      let valid = true;
      Object.values(fields).forEach((f) => { if (!f.value.trim()) { fieldError(f, 'Required.'); valid = false; } });
      if (fields.email.value && !isValidEmail(fields.email.value)) { fieldError(fields.email, 'Enter a valid email.'); valid = false; }
      if (fields.card.value.replace(/\D/g, '').length < 15) { fieldError(fields.card, 'Enter a valid card number.'); valid = false; }
      if (!valid) return;

      setLoading(form, true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1200)); // simulated charge

        const lines = cartLineItems();
        const totals = cartTotals(lines);
        const order = await addOrder({
          uid: state.currentUser.uid,
          items: lines.map((l) => ({ productId: l.product.id, name: l.product.name, price: l.price, quantity: l.quantity })),
          subtotal: totals.subtotal,
          discount: 0,
          couponCode: null,
          shipping: totals.shipping,
          total: totals.total,
          shippingAddress: {
            name: fields.name.value, email: fields.email.value, address: fields.address.value,
            city: fields.city.value, zip: fields.zip.value, country: fields.country.value,
          },
          status: 'paid',
        });

        await emptyCart();
        showOrderConfirmation(order, lines);
      } catch (err) {
        console.error('[IronEdge shop] order failed:', err);
        showBanner(form, 'Something went wrong placing your order. Please try again.', 'error');
      } finally {
        setLoading(form, false);
      }
    });
  }

  function showOrderConfirmation(order, lines) {
    $('#ie-cart-checkout-view').classList.add('is-hidden');
    $('#ie-order-confirmation').classList.add('is-visible');
    $('#ie-confirm-order-id').textContent = order.invoiceId;
    $('#ie-confirm-items').textContent = `${lines.reduce((n, l) => n + l.quantity, 0)} item(s)`;
    $('#ie-confirm-total').textContent = money(order.total);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    $('#ie-confirm-download-invoice').addEventListener('click', () => downloadOrderInvoice(order, lines), { once: true });
    renderOrderHistory();
  }

  function downloadOrderInvoice(order, lines) {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) { alert('PDF generator failed to load — check your connection and try again.'); return; }
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(255, 106, 0);
    doc.text('IRON EDGE FITNESS', 40, 50);
    doc.setFontSize(11); doc.setTextColor(40, 40, 40); doc.setFont('helvetica', 'normal');
    doc.text('Order Invoice', 40, 75);
    doc.setDrawColor(230, 230, 230); doc.line(40, 90, 555, 90);

    let y = 115;
    doc.setFont('helvetica', 'bold'); doc.text('Invoice ID', 40, y); doc.setFont('helvetica', 'normal'); doc.text(order.invoiceId, 220, y);
    y += 22;
    doc.setFont('helvetica', 'bold'); doc.text('Date', 40, y); doc.setFont('helvetica', 'normal'); doc.text(new Date().toLocaleDateString(), 220, y);
    y += 30;

    doc.setFont('helvetica', 'bold'); doc.text('Item', 40, y); doc.text('Qty', 320, y); doc.text('Price', 380, y); doc.text('Total', 470, y);
    y += 10; doc.line(40, y, 555, y); y += 18;
    doc.setFont('helvetica', 'normal');
    lines.forEach((l) => {
      doc.text(l.product.name.slice(0, 38), 40, y);
      doc.text(String(l.quantity), 320, y);
      doc.text(money(l.price), 380, y);
      doc.text(money(l.lineTotal), 470, y);
      y += 20;
    });

    y += 10; doc.line(40, y, 555, y); y += 24;
    doc.setFont('helvetica', 'bold'); doc.text('Total Paid', 380, y); doc.text(money(order.total), 470, y);

    doc.setFontSize(9); doc.setTextColor(150, 150, 150);
    doc.text('Thank you for shopping with Iron Edge Fitness.', 40, y + 30);

    doc.save(`${order.invoiceId}.pdf`);
  }

  async function renderOrderHistory() {
    const panel = $('#ie-order-history-panel');
    if (!panel) return;
    if (!state.currentUser) {
      panel.innerHTML = `
        <div class="ie-empty-cart">
          <i class="fa-solid fa-receipt"></i>
          <p>Log in to see your past orders.</p>
          <a href="login.html" class="ie-btn ie-btn-primary">Log In</a>
        </div>`;
      return;
    }
    const orders = await getOrderHistory(state.currentUser.uid);
    if (!orders.length) {
      panel.innerHTML = `<div class="ie-empty-cart"><i class="fa-solid fa-receipt"></i><p>No orders yet — your first order will show up here.</p></div>`;
      return;
    }
    panel.innerHTML = orders
      .map((o) => {
        const date = o.createdAt?.toDate ? o.createdAt.toDate() : new Date();
        return `
        <div class="ie-order-row">
          <div>
            <p class="ie-order-row__id">${o.invoiceId}</p>
            <p style="font-size:0.82rem; color:var(--ie-text-muted);">${o.items?.length || 0} item(s) · ${date.toLocaleDateString()}</p>
          </div>
          <span class="ie-order-status" data-status="${o.status}">${o.status}</span>
          <span style="font-family:var(--ie-font-mono); font-weight:600;">${money(o.total)}</span>
        </div>`;
      })
      .join('');
  }

  /* ============================================================= WISHLIST PAGE */
  function initWishlistPage() {
    if (!$('#ie-wishlist-grid')) return;
    renderWishlistPage();
  }

  function renderWishlistPage() {
    const grid = $('#ie-wishlist-grid');
    if (!grid) return;
    const products = state.wishlist.map((id) => getProductById(id)).filter(Boolean);
    $('#ie-wishlist-count').textContent = `${products.length} saved item${products.length === 1 ? '' : 's'}`;

    if (!products.length) {
      grid.innerHTML = `
        <div class="ie-empty-wishlist" style="grid-column:1/-1;">
          <i class="fa-solid fa-heart-crack"></i>
          <p>Nothing saved yet — tap the heart on any product to add it here.</p>
          <a href="shop.html" class="ie-btn ie-btn-primary">Browse the Shop</a>
        </div>`;
      return;
    }
    grid.innerHTML = products.map((p) => productCardHtml(p, { showMoveToCart: true })).join('');
    wireProductCardEvents(grid);
  }

  /* =================================================================== BOOTSTRAP */
  async function loadAccountData() {
    await loadCart();
    await loadWishlist();
    if ($('#ie-product-grid')) renderShopGrid();
    if ($('#ie-cart-view')) renderCartPage();
    if ($('#ie-wishlist-grid')) renderWishlistPage();
    if ($('#ie-order-history-panel')) renderOrderHistory();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initShopPage();
    initProductModal();
    initCartPage();
    initWishlistPage();
  });

  document.addEventListener('ie:auth-state', async (e) => {
    const wasLoggedOut = !state.currentUser;
    state.currentUser = e.detail.user;
    if (state.currentUser && wasLoggedOut) {
      await syncGuestDataOnLogin();
    }
    await loadAccountData();
  });
})();
