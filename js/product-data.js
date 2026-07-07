/* ==========================================================================
   IRON EDGE FITNESS — js/product-data.js
   Static product catalog for the Shop module. Consumed by pages/shop.html,
   pages/cart.html, pages/wishlist.html via js/shop.js.

   This is plain data (no Firebase calls here — see firebase/shop.js for the
   Firestore-backed cart / wishlist / orders / reviews layer, which merges
   live user reviews on top of the seed reviews defined here).
   ========================================================================== */

export const CATEGORIES = [
  { id: 'supplements',        name: 'Supplements',        icon: 'fa-solid fa-capsules' },
  { id: 'protein-powder',     name: 'Protein Powder',     icon: 'fa-solid fa-jar' },
  { id: 'pre-workout',        name: 'Pre-Workout',        icon: 'fa-solid fa-bolt' },
  { id: 'creatine',           name: 'Creatine',           icon: 'fa-solid fa-flask' },
  { id: 'vitamins',           name: 'Vitamins',           icon: 'fa-solid fa-tablets' },
  { id: 'gym-accessories',    name: 'Gym Accessories',    icon: 'fa-solid fa-mitten' },
  { id: 'fitness-equipment',  name: 'Fitness Equipment',  icon: 'fa-solid fa-dumbbell' },
  { id: 'apparel',            name: 'Apparel',            icon: 'fa-solid fa-shirt' },
];

const IMG = {
  supp1: 'https://images.unsplash.com/photo-1579722820930-2e9c1b0c6d2f?auto=format&fit=crop&w=800&q=80',
  supp2: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=800&q=80',
  protein1: 'https://images.unsplash.com/photo-1579722821273-0f6c1b0c6d3a?auto=format&fit=crop&w=800&q=80',
  protein2: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
  pre1: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?auto=format&fit=crop&w=800&q=80',
  pre2: 'https://images.unsplash.com/photo-1579758682665-53a1a3c8a1c8?auto=format&fit=crop&w=800&q=80',
  creatine1: 'https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?auto=format&fit=crop&w=800&q=80',
  vitamins1: 'https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&w=800&q=80',
  vitamins2: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=800&q=80',
  gloves: 'https://images.unsplash.com/photo-1517344884509-a0c97ec11bcc?auto=format&fit=crop&w=800&q=80',
  strap: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80',
  bottle: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
  bench: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
  dumbbellset: 'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?auto=format&fit=crop&w=800&q=80',
  kettlebell: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=800&q=80',
  tshirt: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
  hoodie: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80',
  leggings: 'https://images.unsplash.com/photo-1506629905607-c28b47e8b8fd?auto=format&fit=crop&w=800&q=80',
};

/**
 * Product shape:
 * id, name, category, brand, price, discountPercent (0 if none), stock
 * ('in-stock' | 'low-stock' | 'out-of-stock'), rating, reviewCount,
 * images[] (gallery), description, highlights[], reviews[]
 */
export const PRODUCTS = [
  // ------------------------------------------------------------ SUPPLEMENTS
  {
    id: 'bcaa-recovery-matrix', name: 'BCAA Recovery Matrix', category: 'supplements', brand: 'Iron Edge Labs',
    price: 34.99, discountPercent: 15, stock: 'in-stock', rating: 4.6, reviewCount: 128,
    images: [IMG.supp1, IMG.supp2, IMG.bottle],
    description: 'A 2:1:1 branched-chain amino acid blend to reduce soreness and speed up recovery between sessions.',
    highlights: ['7g BCAAs per serving', 'Sugar-free', '30 servings', 'Watermelon flavor'],
    reviews: [
      { user: 'Marcus R.', rating: 5, comment: 'Noticeably less soreness after leg day. Mixes clean too.', date: '2026-05-02' },
      { user: 'Priya N.', rating: 4, comment: 'Good flavor, wish the tub was bigger for the price.', date: '2026-04-18' },
    ],
  },
  {
    id: 'omega-3-fish-oil', name: 'Omega-3 Fish Oil', category: 'supplements', brand: 'Iron Edge Labs',
    price: 19.99, discountPercent: 0, stock: 'in-stock', rating: 4.7, reviewCount: 84,
    images: [IMG.supp2, IMG.vitamins1],
    description: 'High-potency EPA/DHA softgels supporting joint health, recovery, and cardiovascular function.',
    highlights: ['1000mg per softgel', 'Molecularly distilled', '90 softgels', 'No fishy aftertaste'],
    reviews: [
      { user: 'Devon H.', rating: 5, comment: 'No burps, no fishy taste. Been taking these for months.', date: '2026-03-22' },
    ],
  },

  // ------------------------------------------------------------ PROTEIN
  {
    id: 'whey-isolate-choc', name: 'Whey Isolate — Chocolate', category: 'protein-powder', brand: 'Iron Edge Labs',
    price: 49.99, discountPercent: 20, stock: 'in-stock', rating: 4.8, reviewCount: 312,
    images: [IMG.protein1, IMG.protein2, IMG.supp1],
    description: 'Fast-absorbing whey protein isolate with 25g protein per scoop and minimal fat/carbs — built for lean gains.',
    highlights: ['25g protein / scoop', '2g sugar', '30 servings', 'Mixes with a shaker, no clumps'],
    reviews: [
      { user: 'Elena C.', rating: 5, comment: 'Best chocolate protein I\'ve tried — tastes like a milkshake.', date: '2026-05-10' },
      { user: 'Aman T.', rating: 5, comment: 'Digests easy, no bloating like other brands.', date: '2026-04-29' },
    ],
  },
  {
    id: 'plant-protein-vanilla', name: 'Plant Protein — Vanilla', category: 'protein-powder', brand: 'Iron Edge Labs',
    price: 44.99, discountPercent: 10, stock: 'low-stock', rating: 4.3, reviewCount: 96,
    images: [IMG.protein2, IMG.supp2],
    description: 'A pea and rice protein blend delivering a complete amino acid profile — 100% plant-based.',
    highlights: ['22g protein / scoop', 'Vegan & gluten-free', '25 servings'],
    reviews: [
      { user: 'Sara N.', rating: 4, comment: 'Great for a plant protein, a little gritty but good flavor.', date: '2026-03-14' },
    ],
  },

  // --------------------------------------------------------- PRE-WORKOUT
  {
    id: 'ignite-pre-workout', name: 'Ignite Pre-Workout', category: 'pre-workout', brand: 'Iron Edge Labs',
    price: 39.99, discountPercent: 0, stock: 'in-stock', rating: 4.5, reviewCount: 201,
    images: [IMG.pre1, IMG.pre2],
    description: 'A balanced pre-workout with caffeine, citrulline malate, and beta-alanine for energy and pumps without the crash.',
    highlights: ['200mg caffeine', '6g citrulline malate', '30 servings', 'Blue raspberry'],
    reviews: [
      { user: 'Riya K.', rating: 5, comment: 'Strong but no jitters, and the pumps are real.', date: '2026-05-01' },
      { user: 'Jordan D.', rating: 4, comment: 'Great energy, tingles are intense if you\'re sensitive to beta-alanine.', date: '2026-04-02' },
    ],
  },
  {
    id: 'pump-formula-stim-free', name: 'Pump Formula (Stim-Free)', category: 'pre-workout', brand: 'Iron Edge Labs',
    price: 36.99, discountPercent: 5, stock: 'in-stock', rating: 4.4, reviewCount: 67,
    images: [IMG.pre2, IMG.pre1],
    description: 'A caffeine-free pump and focus formula for evening training or stim-sensitive athletes.',
    highlights: ['0mg caffeine', 'L-citrulline + nitrates', '25 servings'],
    reviews: [
      { user: 'Aman T.', rating: 4, comment: 'Perfect for my late gym sessions, sleep is unaffected.', date: '2026-02-27' },
    ],
  },

  // ----------------------------------------------------------- CREATINE
  {
    id: 'creatine-monohydrate', name: 'Creatine Monohydrate', category: 'creatine', brand: 'Iron Edge Labs',
    price: 24.99, discountPercent: 0, stock: 'in-stock', rating: 4.9, reviewCount: 415,
    images: [IMG.creatine1, IMG.supp1],
    description: 'Pure micronized creatine monohydrate — the most studied supplement for strength and power output.',
    highlights: ['5g per serving', '100 servings', 'Unflavored, mixes into anything', 'Third-party tested'],
    reviews: [
      { user: 'Marcus R.', rating: 5, comment: 'Cheapest and most effective supplement I own. Just works.', date: '2026-05-15' },
      { user: 'Devon H.', rating: 5, comment: 'Zero stomach issues, dissolves fully in water.', date: '2026-04-11' },
    ],
  },

  // ------------------------------------------------------------ VITAMINS
  {
    id: 'daily-multivitamin', name: 'Daily Multivitamin', category: 'vitamins', brand: 'Iron Edge Labs',
    price: 22.99, discountPercent: 0, stock: 'in-stock', rating: 4.5, reviewCount: 143,
    images: [IMG.vitamins1, IMG.vitamins2],
    description: 'A complete multivitamin formulated for active lifestyles, covering the gaps a busy training schedule leaves behind.',
    highlights: ['23 vitamins & minerals', '60 capsules', 'Non-GMO'],
    reviews: [
      { user: 'Priya N.', rating: 4, comment: 'Easy to swallow, no weird aftertaste like some multis.', date: '2026-03-30' },
    ],
  },
  {
    id: 'vitamin-d3-k2', name: 'Vitamin D3 + K2', category: 'vitamins', brand: 'Iron Edge Labs',
    price: 17.99, discountPercent: 10, stock: 'in-stock', rating: 4.7, reviewCount: 58,
    images: [IMG.vitamins2, IMG.supp2],
    description: 'A synergistic D3/K2 blend supporting bone density, immune health, and calcium metabolism.',
    highlights: ['5000 IU D3', '100mcg K2 (MK-7)', '90 softgels'],
    reviews: [
      { user: 'Sara N.', rating: 5, comment: 'My blood work improved noticeably after 3 months.', date: '2026-02-19' },
    ],
  },

  // ------------------------------------------------------- GYM ACCESSORIES
  {
    id: 'lifting-straps', name: 'Lifting Straps', category: 'gym-accessories', brand: 'Iron Edge Gear',
    price: 14.99, discountPercent: 0, stock: 'in-stock', rating: 4.6, reviewCount: 176,
    images: [IMG.strap, IMG.gloves],
    description: 'Heavy-duty cotton lifting straps to extend your grip endurance on pulls and rows.',
    highlights: ['Reinforced stitching', 'One size fits most', 'Sold as a pair'],
    reviews: [
      { user: 'Elena C.', rating: 5, comment: 'Grip is no longer my limiting factor on deadlifts.', date: '2026-04-05' },
    ],
  },
  {
    id: 'training-gloves', name: 'Training Gloves', category: 'gym-accessories', brand: 'Iron Edge Gear',
    price: 19.99, discountPercent: 0, stock: 'low-stock', rating: 4.2, reviewCount: 89,
    images: [IMG.gloves, IMG.strap],
    description: 'Breathable padded gloves that protect your palms without killing your grip feel.',
    highlights: ['Padded palm', 'Adjustable wrist strap', 'Machine washable'],
    reviews: [
      { user: 'Jordan D.', rating: 4, comment: 'Good padding, runs slightly small so size up.', date: '2026-01-27' },
    ],
  },
  {
    id: 'shaker-bottle', name: 'Shaker Bottle 700ml', category: 'gym-accessories', brand: 'Iron Edge Gear',
    price: 9.99, discountPercent: 0, stock: 'in-stock', rating: 4.4, reviewCount: 210,
    images: [IMG.bottle, IMG.supp1],
    description: 'Leak-proof shaker with a wire whisk ball for lump-free protein shakes on the go.',
    highlights: ['700ml capacity', 'BPA-free', 'Dishwasher safe'],
    reviews: [
      { user: 'Riya K.', rating: 4, comment: 'Does the job, lid seal is solid — no leaks in my gym bag.', date: '2026-03-08' },
    ],
  },

  // ------------------------------------------------------- FITNESS EQUIPMENT
  {
    id: 'adjustable-dumbbell-set', name: 'Adjustable Dumbbell Set', category: 'fitness-equipment', brand: 'Iron Edge Gear',
    price: 249.99, discountPercent: 12, stock: 'low-stock', rating: 4.7, reviewCount: 61,
    images: [IMG.dumbbellset, IMG.bench],
    description: 'Space-saving adjustable dumbbells that replace an entire rack — 5 to 52.5 lbs per hand.',
    highlights: ['Adjusts in 2.5lb increments', 'Sold as a pair', 'Compact storage tray included'],
    reviews: [
      { user: 'Marcus R.', rating: 5, comment: 'Replaced 8 pairs of dumbbells in my home gym. Worth it.', date: '2026-02-14' },
    ],
  },
  {
    id: 'flat-bench', name: 'Flat Utility Bench', category: 'fitness-equipment', brand: 'Iron Edge Gear',
    price: 129.99, discountPercent: 0, stock: 'in-stock', rating: 4.5, reviewCount: 44,
    images: [IMG.bench, IMG.dumbbellset],
    description: 'A sturdy flat bench rated for heavy pressing, rows, and step-ups — the backbone of any home setup.',
    highlights: ['600lb weight capacity', 'Textured non-slip pad', 'Foldable for storage'],
    reviews: [
      { user: 'Devon H.', rating: 4, comment: 'Solid and stable even under heavy dumbbell presses.', date: '2026-01-30' },
    ],
  },
  {
    id: 'kettlebell-16kg', name: 'Cast Iron Kettlebell 16kg', category: 'fitness-equipment', brand: 'Iron Edge Gear',
    price: 54.99, discountPercent: 0, stock: 'in-stock', rating: 4.8, reviewCount: 73,
    images: [IMG.kettlebell, IMG.bench],
    description: 'A single-piece cast iron kettlebell with a smooth handle for swings, cleans, and carries.',
    highlights: ['16kg / 35lb', 'Flat base for floor stability', 'Powder-coated finish'],
    reviews: [
      { user: 'Aman T.', rating: 5, comment: 'Great finish, handle isn\'t rough like cheaper kettlebells.', date: '2026-03-19' },
    ],
  },

  // ------------------------------------------------------------- APPAREL
  {
    id: 'performance-tshirt', name: 'Performance T-Shirt', category: 'apparel', brand: 'Iron Edge Apparel',
    price: 24.99, discountPercent: 0, stock: 'in-stock', rating: 4.4, reviewCount: 132,
    images: [IMG.tshirt, IMG.hoodie],
    description: 'Moisture-wicking training tee designed to move with you through any workout.',
    highlights: ['Quick-dry fabric', 'Flatlock seams', 'Sizes XS–XXL'],
    reviews: [
      { user: 'Elena C.', rating: 4, comment: 'Fits true to size, holds up well after many washes.', date: '2026-04-24' },
    ],
  },
  {
    id: 'iron-edge-hoodie', name: 'Iron Edge Hoodie', category: 'apparel', brand: 'Iron Edge Apparel',
    price: 54.99, discountPercent: 15, stock: 'in-stock', rating: 4.7, reviewCount: 98,
    images: [IMG.hoodie, IMG.tshirt],
    description: 'A heavyweight fleece hoodie for warm-ups, cool-downs, and everything in between.',
    highlights: ['380gsm heavyweight fleece', 'Kangaroo pocket', 'Sizes XS–XXL'],
    reviews: [
      { user: 'Sara N.', rating: 5, comment: 'Thick, warm, and the embroidered logo looks premium.', date: '2026-03-02' },
    ],
  },
  {
    id: 'training-leggings', name: 'Training Leggings', category: 'apparel', brand: 'Iron Edge Apparel',
    price: 39.99, discountPercent: 0, stock: 'out-of-stock', rating: 4.6, reviewCount: 154,
    images: [IMG.leggings, IMG.tshirt],
    description: 'Squat-proof, high-waisted leggings with a hidden pocket for your phone or key.',
    highlights: ['4-way stretch fabric', 'Squat-proof, opaque', 'Hidden waistband pocket'],
    reviews: [
      { user: 'Riya K.', rating: 5, comment: 'Genuinely squat-proof, and the pocket fits my phone.', date: '2026-02-08' },
    ],
  },
];

/* -------------------------------------------------------------- lookups */
export function getProductById(id) {
  return PRODUCTS.find((p) => p.id === id) || null;
}

export function getProductsByCategory(categoryId) {
  return PRODUCTS.filter((p) => p.category === categoryId);
}

export function getCategoryById(id) {
  return CATEGORIES.find((c) => c.id === id) || null;
}

export function getFinalPrice(product) {
  if (!product.discountPercent) return product.price;
  return Math.round(product.price * (1 - product.discountPercent / 100) * 100) / 100;
}

export function getRelatedProducts(product, limit = 4) {
  return PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, limit);
}

export function searchProducts(term) {
  const q = String(term || '').trim().toLowerCase();
  if (!q) return PRODUCTS;
  return PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
  );
}
