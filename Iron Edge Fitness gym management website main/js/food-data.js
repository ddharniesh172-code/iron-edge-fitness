/* ============================================================
   IRON EDGE FITNESS — food-data.js
   Food database used by diet-planner.html for search, nutrition
   facts, and meal logging. Mix of Indian staples + common
   international foods, calories/macros per stated serving.
   ============================================================ */

const FOOD_DATA = [

  /* ================= PROTEIN ================= */
  { id: "chicken-breast", name: "Chicken Breast (Grilled)", category: "protein", serving: "100g", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: "egg-whole", name: "Whole Egg (Boiled)", category: "protein", serving: "1 large", calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3 },
  { id: "egg-white", name: "Egg White", category: "protein", serving: "1 large", calories: 17, protein: 3.6, carbs: 0.2, fat: 0.1 },
  { id: "paneer", name: "Paneer (Cottage Cheese)", category: "protein", serving: "100g", calories: 265, protein: 18.3, carbs: 3.4, fat: 20.8 },
  { id: "tofu", name: "Tofu (Firm)", category: "protein", serving: "100g", calories: 144, protein: 15.8, carbs: 2.8, fat: 8.7 },
  { id: "fish-rohu", name: "Rohu Fish (Steamed)", category: "protein", serving: "100g", calories: 97, protein: 16.6, carbs: 0, fat: 3 },
  { id: "salmon", name: "Salmon (Grilled)", category: "protein", serving: "100g", calories: 208, protein: 20, carbs: 0, fat: 13 },
  { id: "chana-boiled", name: "Boiled Chickpeas (Chana)", category: "protein", serving: "1 cup", calories: 269, protein: 14.5, carbs: 45, fat: 4.3 },
  { id: "rajma", name: "Rajma (Kidney Beans, Cooked)", category: "protein", serving: "1 cup", calories: 225, protein: 15.3, carbs: 40, fat: 0.9 },
  { id: "moong-dal", name: "Moong Dal (Cooked)", category: "protein", serving: "1 cup", calories: 212, protein: 14.2, carbs: 38.7, fat: 0.8 },
  { id: "toor-dal", name: "Toor Dal (Cooked)", category: "protein", serving: "1 cup", calories: 203, protein: 13, carbs: 36, fat: 1.2 },
  { id: "whey-protein", name: "Whey Protein Scoop", category: "protein", serving: "1 scoop (30g)", calories: 120, protein: 24, carbs: 3, fat: 1.5 },
  { id: "soya-chunks", name: "Soya Chunks (Cooked)", category: "protein", serving: "100g", calories: 345, protein: 52, carbs: 33, fat: 0.5 },
  { id: "greek-yogurt", name: "Greek Yogurt (Plain)", category: "protein", serving: "170g cup", calories: 100, protein: 17, carbs: 6, fat: 0.7 },

  /* ================= CARBS ================= */
  { id: "white-rice", name: "White Rice (Cooked)", category: "carbs", serving: "1 cup", calories: 205, protein: 4.3, carbs: 44.5, fat: 0.4 },
  { id: "brown-rice", name: "Brown Rice (Cooked)", category: "carbs", serving: "1 cup", calories: 216, protein: 5, carbs: 45, fat: 1.8 },
  { id: "roti", name: "Whole Wheat Roti", category: "carbs", serving: "1 piece", calories: 104, protein: 3.1, carbs: 18, fat: 2.5 },
  { id: "chapati-oil-free", name: "Chapati (No Oil)", category: "carbs", serving: "1 piece", calories: 71, protein: 2.6, carbs: 15, fat: 0.4 },
  { id: "oats", name: "Rolled Oats (Dry)", category: "carbs", serving: "40g", calories: 150, protein: 5.3, carbs: 27, fat: 2.6 },
  { id: "idli", name: "Idli", category: "carbs", serving: "2 pieces", calories: 78, protein: 2, carbs: 16, fat: 0.4 },
  { id: "dosa-plain", name: "Plain Dosa", category: "carbs", serving: "1 piece", calories: 133, protein: 2.7, carbs: 22, fat: 3.7 },
  { id: "poha", name: "Poha (Flattened Rice, Cooked)", category: "carbs", serving: "1 cup", calories: 180, protein: 3.5, carbs: 30, fat: 5 },
  { id: "quinoa", name: "Quinoa (Cooked)", category: "carbs", serving: "1 cup", calories: 222, protein: 8.1, carbs: 39.4, fat: 3.6 },
  { id: "sweet-potato", name: "Sweet Potato (Boiled)", category: "carbs", serving: "1 medium", calories: 112, protein: 2, carbs: 26, fat: 0.1 },
  { id: "brown-bread", name: "Brown Bread", category: "carbs", serving: "1 slice", calories: 69, protein: 3.5, carbs: 12, fat: 1 },
  { id: "sooji-upma", name: "Sooji Upma", category: "carbs", serving: "1 cup", calories: 220, protein: 5, carbs: 35, fat: 7 },
  { id: "pasta-wheat", name: "Whole Wheat Pasta (Cooked)", category: "carbs", serving: "1 cup", calories: 174, protein: 7.5, carbs: 37, fat: 0.8 },

  /* ================= FRUIT ================= */
  { id: "banana", name: "Banana", category: "fruit", serving: "1 medium", calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { id: "apple", name: "Apple", category: "fruit", serving: "1 medium", calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  { id: "orange", name: "Orange", category: "fruit", serving: "1 medium", calories: 62, protein: 1.2, carbs: 15.4, fat: 0.2 },
  { id: "papaya", name: "Papaya", category: "fruit", serving: "1 cup cubed", calories: 62, protein: 0.7, carbs: 16, fat: 0.4 },
  { id: "mango", name: "Mango", category: "fruit", serving: "1 cup sliced", calories: 99, protein: 1.4, carbs: 25, fat: 0.6 },
  { id: "watermelon", name: "Watermelon", category: "fruit", serving: "1 cup diced", calories: 46, protein: 0.9, carbs: 11.5, fat: 0.2 },
  { id: "grapes", name: "Grapes", category: "fruit", serving: "1 cup", calories: 104, protein: 1.1, carbs: 27.3, fat: 0.2 },
  { id: "pomegranate", name: "Pomegranate Seeds", category: "fruit", serving: "1 cup", calories: 144, protein: 2.9, carbs: 32.5, fat: 2 },
  { id: "guava", name: "Guava", category: "fruit", serving: "1 medium", calories: 37, protein: 1.4, carbs: 8, fat: 0.5 },

  /* ================= VEGETABLE ================= */
  { id: "spinach-cooked", name: "Spinach (Cooked)", category: "vegetable", serving: "1 cup", calories: 41, protein: 5.3, carbs: 6.8, fat: 0.5 },
  { id: "broccoli", name: "Broccoli (Steamed)", category: "vegetable", serving: "1 cup", calories: 55, protein: 3.7, carbs: 11.2, fat: 0.6 },
  { id: "mixed-veg-curry", name: "Mixed Vegetable Curry", category: "vegetable", serving: "1 cup", calories: 120, protein: 3, carbs: 14, fat: 6 },
  { id: "cauliflower", name: "Cauliflower (Steamed)", category: "vegetable", serving: "1 cup", calories: 29, protein: 2.3, carbs: 5.3, fat: 0.3 },
  { id: "carrot", name: "Carrot (Raw)", category: "vegetable", serving: "1 cup chopped", calories: 52, protein: 1.2, carbs: 12.3, fat: 0.3 },
  { id: "cucumber", name: "Cucumber", category: "vegetable", serving: "1 cup sliced", calories: 16, protein: 0.7, carbs: 3.8, fat: 0.1 },
  { id: "salad-green", name: "Green Salad (No Dressing)", category: "vegetable", serving: "1 bowl", calories: 45, protein: 2, carbs: 8, fat: 0.5 },
  { id: "bhindi-fry", name: "Bhindi Fry (Okra)", category: "vegetable", serving: "1 cup", calories: 130, protein: 3, carbs: 12, fat: 8 },

  /* ================= DAIRY ================= */
  { id: "milk-toned", name: "Toned Milk", category: "dairy", serving: "1 cup (240ml)", calories: 122, protein: 8.1, carbs: 11.4, fat: 4.8 },
  { id: "curd", name: "Curd / Dahi (Plain)", category: "dairy", serving: "1 cup", calories: 98, protein: 11, carbs: 4, fat: 4.3 },
  { id: "cheese-slice", name: "Cheese Slice", category: "dairy", serving: "1 slice (20g)", calories: 70, protein: 4, carbs: 0.4, fat: 5.5 },
  { id: "buttermilk", name: "Buttermilk (Chaas)", category: "dairy", serving: "1 glass (240ml)", calories: 40, protein: 2.6, carbs: 4.8, fat: 1 },
  { id: "paneer-bhurji", name: "Paneer Bhurji", category: "dairy", serving: "1 cup", calories: 300, protein: 19, carbs: 6, fat: 22 },

  /* ================= SNACK ================= */
  { id: "almonds", name: "Almonds", category: "snack", serving: "10 pieces", calories: 70, protein: 2.6, carbs: 2.5, fat: 6 },
  { id: "peanuts-roasted", name: "Roasted Peanuts", category: "snack", serving: "30g", calories: 170, protein: 7, carbs: 5, fat: 14 },
  { id: "walnuts", name: "Walnuts", category: "snack", serving: "5 halves", calories: 65, protein: 1.5, carbs: 1.4, fat: 6.5 },
  { id: "makhana-roasted", name: "Roasted Makhana (Fox Nuts)", category: "snack", serving: "1 cup", calories: 106, protein: 3.6, carbs: 22, fat: 0.4 },
  { id: "protein-bar", name: "Protein Bar", category: "snack", serving: "1 bar (50g)", calories: 200, protein: 20, carbs: 22, fat: 6 },
  { id: "sprouts-salad", name: "Sprouts Salad", category: "snack", serving: "1 cup", calories: 110, protein: 8, carbs: 18, fat: 1 },
  { id: "dark-chocolate", name: "Dark Chocolate (70%+)", category: "snack", serving: "20g", calories: 110, protein: 1.4, carbs: 9, fat: 8 },
  { id: "roasted-chana", name: "Roasted Chana", category: "snack", serving: "1/4 cup", calories: 120, protein: 7, carbs: 20, fat: 2 }
];

const FOOD_CATEGORIES = ["all", "protein", "carbs", "fruit", "vegetable", "dairy", "snack"];

/* ============================================================
   HELPERS
   ============================================================ */
function getFoodById(id) {
  return FOOD_DATA.find(f => f.id === id) || null;
}

function searchFoods(query, category) {
  const q = (query || "").trim().toLowerCase();
  return FOOD_DATA.filter(f => {
    const matchesQuery = !q || f.name.toLowerCase().includes(q);
    const matchesCategory = !category || category === "all" || f.category === category;
    return matchesQuery && matchesCategory;
  });
}

function scaleFoodByServings(food, servings) {
  const s = Number(servings) || 1;
  return {
    id: food.id,
    name: food.name,
    serving: food.serving,
    servings: s,
    calories: Math.round(food.calories * s),
    protein: Math.round(food.protein * s * 10) / 10,
    carbs: Math.round(food.carbs * s * 10) / 10,
    fat: Math.round(food.fat * s * 10) / 10
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { FOOD_DATA, FOOD_CATEGORIES, getFoodById, searchFoods, scaleFoodByServings };
}
