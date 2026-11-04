import type { Provenance, GoalId, ReviewOrigin, ReviewStatus } from "../types/library";

export interface SourceReview {
  reviewStatus: ReviewStatus;
  reviewOrigin: ReviewOrigin;
}
/** New records are not published until someone decides they should be. */
export const PENDING_REVIEW: SourceReview = { reviewStatus: "needs-review", reviewOrigin: "unspecified" };
/** The seeded 2026-10-13 records: published after an AI-assisted source check only. */
export const SEEDED_AI_REVIEW: SourceReview = { reviewStatus: "published", reviewOrigin: "ai-assisted" };

export function source(
  sourceTitle: string,
  sourceURL: string,
  pageOrSection: string,
  claimType: Provenance["claimType"] = "nutrient-function",
  review: SourceReview = PENDING_REVIEW,
): Provenance {
  return {
    sourceTitle,
    sourceURL,
    pageOrSection,
    author: sourceURL.includes("ods.od")
      ? "NIH Office of Dietary Supplements"
      : sourceURL.includes("niddk")
        ? "National Institute of Diabetes and Digestive and Kidney Diseases"
        : sourceURL.includes("nimh")
          ? "National Institute of Mental Health"
          : sourceURL.includes("nccih")
            ? "National Center for Complementary and Integrative Health"
            : sourceURL.includes("foodsafety")
              ? "FoodSafety.gov"
              : sourceURL.includes("fda.gov")
                ? "U.S. Food and Drug Administration"
                : "U.S. National Library of Medicine",
    ...(review.reviewOrigin === "ai-assisted"
      ? { reviewedDate: "2026-10-13", reviewedBy: "MoodMeal source check (AI-assisted; not clinical review)" }
      : {}),
    reviewOrigin: review.reviewOrigin,
    evidenceStatus: "source-supported",
    claimType,
    reviewStatus: review.reviewStatus,
  };
}
const ods = (name: string, slug: string) =>
  source(
    name,
    `https://ods.od.nih.gov/factsheets/${slug}-HealthProfessional/`,
    "Introduction and food sources",
    "nutrient-function",
    SEEDED_AI_REVIEW,
  );
export const NUTRIENTS: Record<
  string,
  { label: string; explanation: string; source: Provenance }
> = {
  protein: {
    label: "Protein",
    explanation:
      "Provides building blocks for making and repairing body tissues.",
    source: source(
      "Protein in diet",
      "https://medlineplus.gov/ency/article/002467.htm",
      "Function; Food sources",
      "nutrient-function",
      SEEDED_AI_REVIEW,
    ),
  },
  fiber: {
    label: "Fiber",
    explanation:
      "A type of carbohydrate in plant foods that helps normal digestion.",
    source: source(
      "Dietary Fiber",
      "https://medlineplus.gov/dietaryfiber.html",
      "Summary",
      "nutrient-function",
      SEEDED_AI_REVIEW,
    ),
  },
  b12: {
    label: "Vitamin B12",
    explanation:
      "Needed for healthy red blood cells and normal nervous-system function.",
    source: ods("Vitamin B12", "VitaminB12"),
  },
  iron: {
    label: "Iron",
    explanation:
      "Helps make hemoglobin, the protein that carries oxygen in blood.",
    source: ods("Iron", "Iron"),
  },
  magnesium: {
    label: "Magnesium",
    explanation:
      "Involved in normal muscle and nerve function and energy production.",
    source: ods("Magnesium", "Magnesium"),
  },
  "vitamin-c": {
    label: "Vitamin C",
    explanation:
      "Helps make collagen and helps the body absorb iron from plant foods.",
    source: ods("Vitamin C", "VitaminC"),
  },
  "omega-3": {
    label: "Omega-3",
    explanation:
      "A family of fats used in cell membranes. Plant ALA and fish EPA/DHA are different forms.",
    source: ods("Omega-3 Fatty Acids", "Omega3FattyAcids"),
  },
  calcium: {
    label: "Calcium",
    explanation:
      "Helps maintain bones and teeth and supports normal muscle and nerve function.",
    source: ods("Calcium", "Calcium"),
  },
  b6: {
    label: "Vitamin B6",
    explanation:
      "Participates in normal metabolism and the formation of neurotransmitters.",
    source: ods("Vitamin B6", "VitaminB6"),
  },
  water: {
    label: "Water",
    explanation:
      "Needed for normal body temperature regulation and fluid balance. Needs vary.",
    source: source(
      "Water in diet",
      "https://medlineplus.gov/ency/article/002471.htm",
      "Function; Food sources",
      "nutrient-function",
      SEEDED_AI_REVIEW,
    ),
  },
};
export const SELF_CARE_SOURCE = source(
  "Caring for Your Mental Health",
  "https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health",
  "How can I take care of my mental health?",
  "wellness-education",
  SEEDED_AI_REVIEW,
);
export const GOALS: Record<
  GoalId,
  {
    label: string;
    nutrients: string[];
    explanation: string;
    sourceProvenance: Provenance[];
  }
> = {
  "steady-energy": {
    label: "Steady Energy",
    nutrients: ["protein", "fiber", "b12", "iron", "b6"],
    explanation:
      "Food ideas for regular, varied meals. These picks are not a treatment for fatigue.",
    sourceProvenance: [SELF_CARE_SOURCE],
  },
  "calm-grounded": {
    label: "Calm & Grounded",
    nutrients: ["fiber", "protein", "magnesium"],
    explanation:
      "Make space for a regular meal and a manageable routine. Food is one part of self-care.",
    sourceProvenance: [SELF_CARE_SOURCE],
  },
  "focus-attention": {
    label: "Focus & Attention",
    nutrients: ["protein", "fiber", "water"],
    explanation:
      "Regular meals and hydration are practical basics during a busy day, not a promise of better concentration.",
    sourceProvenance: [SELF_CARE_SOURCE],
  },
  "wind-down": {
    label: "Wind Down",
    nutrients: ["fiber", "protein"],
    explanation:
      "Simple food ideas alongside a sleep routine. No food is being recommended as a sleep aid.",
    sourceProvenance: [SELF_CARE_SOURCE],
  },
  "balanced-nutrition": {
    label: "Balanced Nutrition",
    nutrients: ["protein", "fiber", "vitamin-c", "calcium", "iron", "omega-3"],
    explanation:
      "Explore variety across foods and meals, without labeling a mood as a nutrient deficiency.",
    sourceProvenance: [SELF_CARE_SOURCE],
  },
  hydration: {
    label: "Hydration",
    nutrients: ["water"],
    explanation:
      "Water and water-containing foods can contribute to daily fluids. Follow any individual fluid restrictions.",
    sourceProvenance: [NUTRIENTS.water.source],
  },
  "everyday-mood-support": {
    label: "Everyday Mood Support",
    nutrients: ["protein", "fiber", "vitamin-c", "omega-3"],
    explanation:
      "Everyday nourishment alongside rest, activity and connection. These foods do not treat a mood or condition.",
    sourceProvenance: [SELF_CARE_SOURCE],
  },
};
// Qualitative food composition only; never infer nutrient amounts from these tags.
// Owner-reviewed tags (stage D batch 1, 10% DV per FDA reference amount) and the
// tags withdrawn to needs-review are recorded in foodTagReviews.ts.
export const FOOD_FACTS: Record<string, string[]> = {
  "wild-salmon": ["protein", "b12", "omega-3"],
  walnuts: ["omega-3", "magnesium"],
  "steel-cut-oats": ["fiber", "magnesium"],
  "dark-chocolate": ["iron", "magnesium"],
  "greek-yogurt": ["protein", "calcium", "b12"],
  "mixed-berries": ["fiber"],
  "citrus-orange": ["vitamin-c", "fiber"],
  "ginger-root": [],
  garlic: [],
  "chamomile-tea": ["water"],
  "sweet-potato": ["b6"],
  banana: ["fiber", "b6"],
  spinach: ["iron", "magnesium", "vitamin-c"],
  kale: ["fiber"],
  "lean-beef": ["protein", "iron", "b12"],
  quinoa: ["protein", "fiber"],
  eggs: ["protein", "b12"],
  blueberries: ["fiber"],
  kefir: ["protein", "calcium"],
  "brown-rice": ["magnesium", "b6"],
  avocado: ["fiber"],
  turkey: ["protein", "b12", "b6"],
  almonds: ["protein", "magnesium", "fiber"],
  "coconut-water": ["water"],
  watermelon: ["water", "vitamin-c"],
  cucumber: ["water"],
  apple: ["fiber"],
  "pumpkin-seeds": ["magnesium", "protein"],
  popcorn: ["fiber"],
  strawberries: ["vitamin-c", "fiber"],
  "rainbow-carrots": [],
  pineapple: ["vitamin-c"],
  "swiss-chard": ["vitamin-c", "magnesium"],
  "green-tea": ["water"],
  "chia-pudding": ["omega-3", "fiber"],
};
