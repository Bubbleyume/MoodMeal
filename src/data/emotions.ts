import type { Emotion } from "../types";

// The 12 supported emotions. This is the single source of truth for emotion
// metadata used across mood selection, results, and history screens.
export const EMOTIONS: Emotion[] = [
  {
    id: "happy",
    name: "Happy",
    emoji: "😊",
    color: "#f5a524",
    gradient: "from-sunny-300 to-coral-300",
    description:
      "You're feeling good! Let's keep that energy up with bright, nutrient-rich foods that match your mood.",
    nutrientFocus: ["Vitamin C", "Antioxidants", "Protein", "Fiber"],
    exampleFoods: ["Dark Chocolate", "Mixed Berries", "Strawberries"],
    exampleMeals: ["Berry Yogurt Parfait", "Dark Chocolate Trail Mix"],
  },
  {
    id: "sad",
    name: "Sad",
    emoji: "😢",
    color: "#4fa8f0",
    gradient: "from-sky-300 to-brand-200",
    description:
      "It's okay to feel down sometimes. Warm, nourishing foods with omega-3s and complex carbs can be a gentle part of taking care of yourself.",
    nutrientFocus: ["Omega-3", "Complex Carbs", "B Vitamins", "Magnesium"],
    exampleFoods: ["Wild Salmon", "Walnuts", "Steel-Cut Oats"],
    exampleMeals: ["Salmon & Quinoa Bowl", "Warm Oatmeal with Berries"],
  },
  {
    id: "tired",
    name: "Tired",
    emoji: "😴",
    color: "#818cf8",
    gradient: "from-indigo-200 to-brand-200",
    description:
      "Running low on energy? Iron, B vitamins, and steady-releasing carbs can help support normal energy metabolism.",
    nutrientFocus: ["Iron", "B Vitamins", "Complex Carbs", "Protein"],
    exampleFoods: ["Spinach", "Lean Beef", "Quinoa"],
    exampleMeals: ["Energizing Power Bowl", "Iron-Rich Beef Stir-Fry"],
  },
  {
    id: "scared",
    name: "Scared",
    emoji: "😱",
    color: "#a78bfa",
    gradient: "from-brand-200 to-slate-200",
    description:
      "Feeling uneasy? Warm, comforting foods and calming herbal tea can be part of a soothing, grounding routine.",
    nutrientFocus: ["Magnesium", "Complex Carbs", "Calming Herbs"],
    exampleFoods: ["Chamomile Tea", "Sweet Potato", "Banana"],
    exampleMeals: ["Chamomile & Sweet Potato Toast", "Cozy Sweet Potato Hash"],
  },
  {
    id: "angry",
    name: "Angry",
    emoji: "😠",
    color: "#f4511e",
    gradient: "from-coral-400 to-coral-200",
    description:
      "Feeling heated? Cooling, hydrating foods and magnesium-rich greens can support a sense of balance.",
    nutrientFocus: ["Hydration", "Magnesium", "Potassium", "Iron"],
    exampleFoods: ["Cucumber", "Watermelon", "Swiss Chard"],
    exampleMeals: ["Cooling Cucumber & Watermelon Salad", "Steak & Swiss Chard"],
  },
  {
    id: "nervous",
    name: "Nervous",
    emoji: "😬",
    color: "#2dbe8e",
    gradient: "from-mint-300 to-sky-200",
    description:
      "A little on edge? Probiotic and magnesium-rich foods support your gut, which is closely connected to overall wellness.",
    nutrientFocus: ["Probiotics", "Magnesium", "Antioxidants"],
    exampleFoods: ["Blueberries", "Kefir", "Brown Rice"],
    exampleMeals: ["Calming Kefir Smoothie", "Brown Rice Veggie Bowl"],
  },
  {
    id: "shy",
    name: "Shy",
    emoji: "😳",
    color: "#f472b6",
    gradient: "from-blush-300 to-brand-100",
    description:
      "Feeling a little reserved today? Gentle, comforting foods can offer quiet, steady support.",
    nutrientFocus: ["Tryptophan", "Healthy Fats", "Protein"],
    exampleFoods: ["Avocado", "Turkey Breast", "Almonds"],
    exampleMeals: ["Gentle Avocado Toast", "Turkey Lettuce Wraps"],
  },
  {
    id: "excited",
    name: "Excited",
    emoji: "🤩",
    color: "#ff6f61",
    gradient: "from-coral-400 to-sunny-300",
    description:
      "Big energy! Balanced meals with natural sugars and electrolytes can help you ride the wave sustainably.",
    nutrientFocus: ["Electrolytes", "Vitamin C", "Natural Sugars", "Fiber"],
    exampleFoods: ["Mixed Berries", "Coconut Water", "Pineapple"],
    exampleMeals: ["Tropical Energy Smoothie", "Quinoa Fruit Salad"],
  },
  {
    id: "bored",
    name: "Bored",
    emoji: "😐",
    color: "#94a3b8",
    gradient: "from-slate-200 to-slate-100",
    description:
      "Craving a little novelty? Crunchy textures and bold flavors can make snack time more interesting.",
    nutrientFocus: ["Fiber", "Magnesium", "Whole Grains"],
    exampleFoods: ["Apple", "Pumpkin Seeds", "Air-Popped Popcorn"],
    exampleMeals: ["Crunchy Veggie Snack Plate", "Loaded Popcorn Trail Mix"],
  },
  {
    id: "silly",
    name: "Silly",
    emoji: "🤪",
    color: "#f472b6",
    gradient: "from-blush-400 to-sunny-300",
    description:
      "Feeling playful? Colorful, fun foods match your energy and add a little joy to the plate.",
    nutrientFocus: ["Vitamin C", "Antioxidants", "Fun Textures"],
    exampleFoods: ["Strawberries", "Rainbow Carrots", "Pineapple"],
    exampleMeals: ["Rainbow Fruit Skewers", "Sunshine Banana Pancakes"],
  },
  {
    id: "worried",
    name: "Worried",
    emoji: "😟",
    color: "#5fd8ab",
    gradient: "from-mint-300 to-brand-200",
    description:
      "Mind racing a bit? Magnesium-rich, grounding foods and calming tea can support a sense of ease.",
    nutrientFocus: ["Magnesium", "L-theanine", "Fiber"],
    exampleFoods: ["Swiss Chard", "Pumpkin Seeds", "Green Tea"],
    exampleMeals: ["Magnesium-Rich Grounding Bowl", "Green Tea Energy Bites"],
  },
  {
    id: "sick",
    name: "Sick",
    emoji: "🤒",
    color: "#7cc4ff",
    gradient: "from-sky-300 to-mint-200",
    description:
      "Not feeling well? Gentle, vitamin C-rich foods and warm, hydrating dishes can support your body's general wellness.",
    nutrientFocus: ["Vitamin C", "Zinc", "Hydration", "Protein"],
    exampleFoods: ["Oranges", "Fresh Ginger", "Garlic"],
    exampleMeals: ["Ginger Citrus Soup", "Immune-Support Smoothie"],
  },
];

export function getEmotionById(id: string) {
  return EMOTIONS.find((e) => e.id === id);
}
