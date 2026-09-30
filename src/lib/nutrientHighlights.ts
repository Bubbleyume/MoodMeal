import type { Food } from "../types";

/**
 * Turns a food's nutrient list into one short, evidence-conscious highlight
 * line for the food-discovery cards. Deliberately avoids simplistic
 * "boosts serotonin" / mood-cure phrasing — see README.md "Health & safety"
 * — in favor of the wellness-safe phrasing patterns the product spec calls
 * for (e.g. "Vitamin B6 supports normal neurotransmitter synthesis",
 * "Rich in magnesium", "Source of omega-3 fatty acids").
 */
const NUTRIENT_HIGHLIGHTS: { match: RegExp; highlight: string }[] = [
  { match: /vitamin b6/i, highlight: "Vitamin B6 supports normal neurotransmitter synthesis" },
  { match: /magnesium/i, highlight: "Rich in magnesium" },
  { match: /omega-3/i, highlight: "Source of omega-3 fatty acids" },
  { match: /folate/i, highlight: "Provides folate and other essential nutrients" },
  { match: /probiotic/i, highlight: "Contains live cultures that support gut health" },
  { match: /vitamin c/i, highlight: "A good source of vitamin C" },
  { match: /iron/i, highlight: "Rich in iron" },
  { match: /protein/i, highlight: "A satisfying source of protein" },
  { match: /fiber/i, highlight: "High in fiber" },
  { match: /antioxidant/i, highlight: "Packed with antioxidants" },
  { match: /potassium/i, highlight: "A good source of potassium" },
  { match: /tryptophan/i, highlight: "Contains tryptophan, an amino acid the body uses normally" },
  { match: /complex carbohydrate/i, highlight: "Provides steady, complex carbohydrates" },
];

export function getNutrientHighlight(food: Food): string {
  for (const nutrient of food.nutrients) {
    const found = NUTRIENT_HIGHLIGHTS.find((entry) => entry.match.test(nutrient));
    if (found) return found.highlight;
  }
  return "Part of a balanced, nutrient-rich diet";
}
