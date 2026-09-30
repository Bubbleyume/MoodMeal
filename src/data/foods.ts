import type { Food } from "../types";

// Local structured food data. Nutrition framing intentionally avoids any
// medical or treatment claims — see README.md "Health & safety" section.
// This is the layer that would eventually be swapped for a Supabase table.

export const FOODS: Food[] = [
  {
    id: "wild-salmon",
    name: "Wild Salmon",
    emoji: "🐟",
    gradient: "from-sky-300 to-blue-200",
    category: "protein",
    nutrients: ["Omega-3 fatty acids", "Vitamin D", "Protein", "B12"],
    description:
      "A rich source of omega-3 fatty acids, which are involved in normal brain function and can be part of a balanced, nutrient-rich diet.",
    servingSuggestion: "3–4 oz grilled or baked, twice a week.",
    moodTags: ["sad", "worried", "tired", "nervous"],
  },
  {
    id: "walnuts",
    name: "Walnuts",
    emoji: "🌰",
    gradient: "from-amber-200 to-amber-100",
    category: "nuts-seeds",
    nutrients: ["Omega-3 (ALA)", "Magnesium", "Antioxidants"],
    description:
      "A plant-based source of omega-3s and magnesium, nutrients involved in normal nervous-system function.",
    servingSuggestion: "A small handful (about 1 oz) as a snack or salad topper.",
    moodTags: ["sad", "nervous", "worried", "bored"],
  },
  {
    id: "steel-cut-oats",
    name: "Steel-Cut Oats",
    emoji: "🥣",
    gradient: "from-amber-100 to-orange-100",
    category: "grain",
    nutrients: ["Complex carbohydrates", "Fiber", "B Vitamins"],
    description:
      "Slow-digesting complex carbs that support steady energy levels throughout the day.",
    servingSuggestion: "½ cup dry oats cooked with milk or a milk alternative.",
    moodTags: ["sad", "tired", "scared", "worried"],
  },
  {
    id: "dark-chocolate",
    name: "Dark Chocolate (70%+)",
    emoji: "🍫",
    gradient: "from-brand-300 to-brand-100",
    category: "other",
    nutrients: ["Flavonoids", "Magnesium", "Iron"],
    description:
      "Contains flavonoid antioxidants and magnesium; a small amount can be part of a balanced, nutrient-rich diet.",
    servingSuggestion: "1–2 small squares as a treat.",
    moodTags: ["happy", "silly", "excited", "sad"],
  },
  {
    id: "greek-yogurt",
    name: "Greek Yogurt",
    emoji: "🥛",
    gradient: "from-sky-100 to-white",
    category: "dairy",
    nutrients: ["Probiotics", "Protein", "Calcium"],
    description:
      "A source of live cultures that support gut health — a system closely linked to overall wellness.",
    servingSuggestion: "3/4 cup plain, topped with fruit or honey.",
    moodTags: ["happy", "nervous", "worried", "sick"],
  },
  {
    id: "mixed-berries",
    name: "Mixed Berries",
    emoji: "🫐",
    gradient: "from-blush-300 to-brand-200",
    category: "fruit",
    nutrients: ["Vitamin C", "Antioxidants", "Fiber"],
    description:
      "Bright, antioxidant-rich fruit that adds natural sweetness and vitamin C to any plate.",
    servingSuggestion: "1 cup fresh or frozen, blended or as a topping.",
    moodTags: ["happy", "excited", "silly", "nervous"],
  },
  {
    id: "citrus-orange",
    name: "Oranges",
    emoji: "🍊",
    gradient: "from-sunny-300 to-coral-400",
    category: "fruit",
    nutrients: ["Vitamin C", "Folate", "Fiber"],
    description:
      "A classic source of vitamin C, which supports the immune system as part of general wellness.",
    servingSuggestion: "1 medium orange, or a glass of fresh-squeezed juice.",
    moodTags: ["sick", "happy", "silly", "excited"],
  },
  {
    id: "ginger-root",
    name: "Fresh Ginger",
    emoji: "🫚",
    gradient: "from-sunny-200 to-amber-100",
    category: "other",
    nutrients: ["Gingerol compounds", "Antioxidants"],
    description:
      "Often used to make warm, soothing teas; a comforting addition to a wellness-focused routine.",
    servingSuggestion: "Steeped as tea, or grated into soups and stir-fries.",
    moodTags: ["sick", "scared", "tired"],
  },
  {
    id: "garlic",
    name: "Garlic",
    emoji: "🧄",
    gradient: "from-slate-100 to-slate-50",
    category: "vegetable",
    nutrients: ["Allicin compounds", "Vitamin C", "Manganese"],
    description:
      "A flavorful aromatic that's been a kitchen staple for supporting general wellness for centuries.",
    servingSuggestion: "1–2 cloves, minced into soups, broths, or roasted vegetables.",
    moodTags: ["sick"],
  },
  {
    id: "chamomile-tea",
    name: "Chamomile Tea",
    emoji: "🍵",
    gradient: "from-sunny-200 to-mint-300",
    category: "other",
    nutrients: ["Apigenin", "Antioxidants"],
    description:
      "A warm, caffeine-free herbal tea often enjoyed as part of a calming wind-down routine.",
    servingSuggestion: "1 warm cup, especially in the evening.",
    moodTags: ["scared", "worried", "nervous", "angry"],
  },
  {
    id: "sweet-potato",
    name: "Sweet Potato",
    emoji: "🍠",
    gradient: "from-coral-400 to-sunny-300",
    category: "vegetable",
    nutrients: ["Complex carbohydrates", "Vitamin A", "Fiber"],
    description:
      "A comforting root vegetable with steady-releasing carbohydrates and beta-carotene.",
    servingSuggestion: "1 medium, roasted or mashed.",
    moodTags: ["scared", "sad", "tired", "shy"],
  },
  {
    id: "banana",
    name: "Banana",
    emoji: "🍌",
    gradient: "from-sunny-300 to-sunny-100",
    category: "fruit",
    nutrients: ["Potassium", "Vitamin B6", "Natural sugars"],
    description:
      "An easy, portable source of quick energy and potassium, useful before or after activity.",
    servingSuggestion: "1 medium banana, on its own or sliced onto oats.",
    moodTags: ["scared", "excited", "tired", "shy"],
  },
  {
    id: "spinach",
    name: "Spinach",
    emoji: "🥬",
    gradient: "from-mint-400 to-mint-300",
    category: "vegetable",
    nutrients: ["Iron", "Folate", "Magnesium"],
    description:
      "A leafy green rich in iron and folate, nutrients involved in normal energy metabolism.",
    servingSuggestion: "1–2 cups raw in a salad, or wilted into a warm dish.",
    moodTags: ["tired", "angry", "worried"],
  },
  {
    id: "kale",
    name: "Kale",
    emoji: "🥗",
    gradient: "from-mint-400 to-brand-200",
    category: "vegetable",
    nutrients: ["Vitamin K", "Vitamin C", "Calcium"],
    description:
      "A hearty leafy green that adds volume, crunch, and a wide range of vitamins to a meal.",
    servingSuggestion: "1–2 cups massaged with olive oil for a salad base.",
    moodTags: ["angry", "bored", "tired"],
  },
  {
    id: "lean-beef",
    name: "Lean Beef",
    emoji: "🥩",
    gradient: "from-coral-500 to-coral-400",
    category: "protein",
    nutrients: ["Iron", "Zinc", "Protein", "B12"],
    description:
      "A dense source of iron and B12, nutrients involved in normal energy production.",
    servingSuggestion: "3–4 oz, grilled or pan-seared.",
    moodTags: ["tired", "angry"],
  },
  {
    id: "quinoa",
    name: "Quinoa",
    emoji: "🍚",
    gradient: "from-amber-100 to-mint-100",
    category: "grain",
    nutrients: ["Complete protein", "Magnesium", "Fiber"],
    description:
      "A complete plant protein and steady energy source that works in almost any bowl.",
    servingSuggestion: "½–1 cup cooked as a base for grain bowls.",
    moodTags: ["tired", "bored", "excited"],
  },
  {
    id: "eggs",
    name: "Eggs",
    emoji: "🥚",
    gradient: "from-sunny-200 to-amber-100",
    category: "protein",
    nutrients: ["Choline", "Protein", "B12", "Vitamin D"],
    description:
      "A versatile source of choline and protein, nutrients involved in normal brain function.",
    servingSuggestion: "2 eggs, any style, for breakfast or a quick meal.",
    moodTags: ["tired", "shy", "sick"],
  },
  {
    id: "blueberries",
    name: "Blueberries",
    emoji: "🫐",
    gradient: "from-brand-300 to-sky-300",
    category: "fruit",
    nutrients: ["Antioxidants", "Vitamin C", "Fiber"],
    description:
      "Small but mighty — packed with antioxidants that support overall cellular wellness.",
    servingSuggestion: "1 cup fresh, frozen, or blended into a smoothie.",
    moodTags: ["nervous", "worried", "happy"],
  },
  {
    id: "kefir",
    name: "Kefir",
    emoji: "🥤",
    gradient: "from-sky-200 to-white",
    category: "dairy",
    nutrients: ["Probiotics", "Protein", "Calcium"],
    description:
      "A tangy, fermented drink with a wide variety of live cultures for gut wellness.",
    servingSuggestion: "1 cup, plain or blended into a smoothie.",
    moodTags: ["nervous", "worried", "sick"],
  },
  {
    id: "brown-rice",
    name: "Brown Rice",
    emoji: "🍙",
    gradient: "from-amber-100 to-amber-50",
    category: "grain",
    nutrients: ["Complex carbohydrates", "Magnesium", "Fiber"],
    description:
      "A steady, grounding carbohydrate that pairs well with almost any protein and vegetable.",
    servingSuggestion: "½–1 cup cooked, as a base for a bowl.",
    moodTags: ["nervous", "worried", "angry"],
  },
  {
    id: "avocado",
    name: "Avocado",
    emoji: "🥑",
    gradient: "from-mint-300 to-sunny-200",
    category: "fruit",
    nutrients: ["Healthy fats", "Potassium", "Fiber", "B Vitamins"],
    description:
      "Creamy healthy fats and potassium make this a satisfying, mood-friendly staple.",
    servingSuggestion: "¼–½ avocado, sliced onto toast or added to a bowl.",
    moodTags: ["shy", "happy", "bored"],
  },
  {
    id: "turkey",
    name: "Turkey Breast",
    emoji: "🍗",
    gradient: "from-coral-300 to-amber-200",
    category: "protein",
    nutrients: ["Tryptophan", "Protein", "B6"],
    description:
      "A lean protein containing tryptophan, an amino acid involved in normal neurotransmitter function.",
    servingSuggestion: "3–4 oz roasted or sliced into a sandwich.",
    moodTags: ["shy", "tired"],
  },
  {
    id: "almonds",
    name: "Almonds",
    emoji: "🥜",
    gradient: "from-amber-200 to-sunny-100",
    category: "nuts-seeds",
    nutrients: ["Vitamin E", "Magnesium", "Protein"],
    description:
      "A crunchy, portable snack with healthy fats and magnesium for steady energy.",
    servingSuggestion: "A small handful (about 1 oz).",
    moodTags: ["excited", "bored", "shy"],
  },
  {
    id: "coconut-water",
    name: "Coconut Water",
    emoji: "🥥",
    gradient: "from-mint-200 to-sky-200",
    category: "other",
    nutrients: ["Potassium", "Electrolytes", "Hydration"],
    description:
      "A naturally refreshing way to rehydrate, especially after activity or excitement.",
    servingSuggestion: "1 cup chilled.",
    moodTags: ["excited", "sick", "angry"],
  },
  {
    id: "watermelon",
    name: "Watermelon",
    emoji: "🍉",
    gradient: "from-coral-400 to-mint-300",
    category: "fruit",
    nutrients: ["Hydration", "Vitamin C", "Lycopene"],
    description:
      "Mostly water with a naturally sweet crunch — cooling and refreshing any time of day.",
    servingSuggestion: "1–2 cups cubed and chilled.",
    moodTags: ["angry", "excited", "silly"],
  },
  {
    id: "cucumber",
    name: "Cucumber",
    emoji: "🥒",
    gradient: "from-mint-300 to-mint-100",
    category: "vegetable",
    nutrients: ["Hydration", "Vitamin K", "Potassium"],
    description:
      "Cool, crisp, and hydrating — a light way to add crunch to a plate.",
    servingSuggestion: "1 cup sliced, on its own or with hummus.",
    moodTags: ["angry", "bored"],
  },
  {
    id: "apple",
    name: "Apple",
    emoji: "🍎",
    gradient: "from-coral-400 to-coral-300",
    category: "fruit",
    nutrients: ["Fiber", "Vitamin C", "Natural sugars"],
    description:
      "A satisfying crunch with fiber that supports steady, sustained energy.",
    servingSuggestion: "1 medium apple, sliced with a nut butter for dipping.",
    moodTags: ["bored", "excited", "silly"],
  },
  {
    id: "pumpkin-seeds",
    name: "Pumpkin Seeds",
    emoji: "🎃",
    gradient: "from-sunny-400 to-coral-300",
    category: "nuts-seeds",
    nutrients: ["Magnesium", "Zinc", "Iron"],
    description:
      "Small seeds with a big nutrient profile, including magnesium and zinc.",
    servingSuggestion: "2 tbsp roasted, as a snack or salad topper.",
    moodTags: ["worried", "bored", "nervous"],
  },
  {
    id: "popcorn",
    name: "Air-Popped Popcorn",
    emoji: "🍿",
    gradient: "from-sunny-200 to-amber-100",
    category: "grain",
    nutrients: ["Whole grain", "Fiber"],
    description:
      "A whole-grain snack that's satisfying to crunch through when you need a little novelty.",
    servingSuggestion: "2–3 cups air-popped, lightly seasoned.",
    moodTags: ["bored", "silly", "excited"],
  },
  {
    id: "strawberries",
    name: "Strawberries",
    emoji: "🍓",
    gradient: "from-blush-400 to-coral-300",
    category: "fruit",
    nutrients: ["Vitamin C", "Antioxidants", "Fiber"],
    description:
      "Bright red, naturally sweet, and packed with vitamin C for a playful, colorful plate.",
    servingSuggestion: "1 cup sliced, fresh or dipped lightly in yogurt.",
    moodTags: ["silly", "happy", "excited"],
  },
  {
    id: "rainbow-carrots",
    name: "Rainbow Carrots",
    emoji: "🥕",
    gradient: "from-coral-300 to-sunny-300",
    category: "vegetable",
    nutrients: ["Beta-carotene", "Fiber", "Vitamin A"],
    description:
      "Crunchy, colorful, and fun to snack on — a playful way to add veggies to your day.",
    servingSuggestion: "1 cup sliced, with hummus for dipping.",
    moodTags: ["silly", "bored"],
  },
  {
    id: "pineapple",
    name: "Pineapple",
    emoji: "🍍",
    gradient: "from-sunny-400 to-sunny-200",
    category: "fruit",
    nutrients: ["Vitamin C", "Manganese", "Bromelain"],
    description:
      "Tropical, tangy-sweet, and a fun way to bring bright flavor to a snack or bowl.",
    servingSuggestion: "1 cup fresh chunks, chilled.",
    moodTags: ["silly", "happy", "excited"],
  },
  {
    id: "swiss-chard",
    name: "Swiss Chard",
    emoji: "🌿",
    gradient: "from-mint-400 to-brand-300",
    category: "vegetable",
    nutrients: ["Magnesium", "Vitamin K", "Iron"],
    description:
      "A leafy green rich in magnesium, a mineral involved in normal muscle and nerve function.",
    servingSuggestion: "1–2 cups sautéed with garlic and olive oil.",
    moodTags: ["worried", "angry"],
  },
  {
    id: "green-tea",
    name: "Green Tea",
    emoji: "🍵",
    gradient: "from-mint-300 to-mint-100",
    category: "other",
    nutrients: ["L-theanine", "Antioxidants", "Mild caffeine"],
    description:
      "Contains L-theanine, an amino acid often paired with a sense of calm alertness.",
    servingSuggestion: "1 warm cup, brewed 2–3 minutes.",
    moodTags: ["worried", "nervous", "tired"],
  },
  {
    id: "chia-pudding",
    name: "Chia Seeds",
    emoji: "🌱",
    gradient: "from-mint-200 to-amber-100",
    category: "nuts-seeds",
    nutrients: ["Omega-3 (ALA)", "Fiber", "Protein"],
    description:
      "Tiny seeds that swell into a pudding-like texture, rich in fiber and plant omega-3s.",
    servingSuggestion: "2 tbsp soaked in milk overnight.",
    moodTags: ["happy", "excited", "bored"],
  },
];

export function getFoodById(id: string): Food | undefined {
  return FOODS.find((f) => f.id === id);
}

/** Case-insensitive lookup used to give grocery-list items a matching
 * thumbnail when the item name happens to match a known food (e.g. items
 * added from a mood check-in or recipe). Manually-typed items that don't
 * match anything simply get the generic grocery-bag placeholder. */
export function getFoodByName(name: string): Food | undefined {
  const lower = name.trim().toLowerCase();
  return FOODS.find((f) => f.name.toLowerCase() === lower);
}
