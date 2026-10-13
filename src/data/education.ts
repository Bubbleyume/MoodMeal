import { SELF_CARE_SOURCE, NUTRIENTS, source } from "./knowledge";
import type { Provenance } from "../types/library";
export interface Lesson {
  id: string;
  title: string;
  summary: string;
  paragraphs: string[];
  practice: string;
  sourceProvenance: Provenance[];
}
const entries: [string, string, string, string, string][] = [
  [
    "food-mood-basics",
    "Food & Mood Basics",
    "Food is one part of the picture.",
    "Mood is influenced by many things, including rest, activity, relationships, stress and the environment. Food routines can be part of looking after yourself; they do not explain every change in how you feel.",
    "Choose one manageable routine: a regular meal, a short walk or a check-in with someone you trust.",
  ],
  [
    "steady-energy",
    "Steady Energy",
    "Make regular meals easier.",
    "Regular meals and enough fluids are useful everyday habits. MoodMeal matches food composition to an editorial support goal; it does not identify deficiencies from a tired check-in.",
    "Plan one meal you can prepare with ingredients already at home.",
  ],
  [
    "focus-attention",
    "Focus & Attention",
    "Start with everyday basics.",
    "Sleep, movement, hydration and regular meals belong in the same conversation. A nutrient match is not evidence that an individual food improves attention.",
    "Set aside a meal break and keep water within reach.",
  ],
  [
    "wind-down",
    "Sleep & Wind-Down",
    "Build a routine around rest.",
    "Try a consistent sleep schedule and a relaxing evening activity. Notice how caffeine affects you. MoodMeal does not offer a food or supplement as a treatment for sleep difficulties.",
    "Pick a short screen-free activity to begin your evening routine.",
  ],
  [
    "calm-grounded",
    "Calm & Grounded",
    "Small steps count.",
    "Breathing exercises, time with others and relaxing activities may fit into self-care. Eating is only one part of your day; you do not need to find a perfect food for a feeling.",
    "Pause, breathe at a comfortable pace, and choose one practical next step.",
  ],
  [
    "cooking-self-care",
    "Cooking as Self-Care",
    "Make the kitchen work for you.",
    "A simple familiar dish can be a manageable project. Choose a difficulty and time limit that fit your day. Using frozen or pre-cut ingredients is a practical choice.",
    "Prepare one ingredient for a later meal, or assemble a no-cook snack.",
  ],
  [
    "gut-digestion",
    "Gut & Digestion",
    "Learn without miracle claims.",
    "Fiber is found in plant foods and contributes to normal digestion. Increase it gradually. Probiotic effects depend on the product and condition studied; a fermented food is not a proven treatment for a mood.",
    "Explore a familiar fiber-containing ingredient and notice your own tolerance.",
  ],
  [
    "sensitivities-diets",
    "Food Sensitivities & Special Diets",
    "Preferences and safety are different.",
    "Use food preferences to exclude listed allergens or foods you avoid. Labels, substitutions and cross-contact still need checking. Restrictive diets and unexplained symptoms deserve individual guidance from a qualified professional.",
    "Review ingredient packaging before using a recipe; save the specific ingredients you avoid.",
  ],
  [
    "balanced-nutrition",
    "Balanced Nutrition",
    "Variety over a perfect ingredient.",
    "Food groups contribute different nutrients. MoodMeal shows documented ingredient attributes without calculating a complete diet or claiming that a single food covers your needs.",
    "Include a variety of ingredients across meals that suit your preferences.",
  ],
  [
    "hydration",
    "Hydration",
    "Fluids come from more than drinks.",
    "Water is needed for normal body functions. Foods can also contribute water. Fluid needs vary, and any advice from your own care team takes priority.",
    "Make a drink available during your next meal.",
  ],
];
export const LESSONS: Lesson[] = entries.map(
  ([id, title, summary, text, practice]) => ({
    id,
    title,
    summary,
    paragraphs: [text],
    practice,
    sourceProvenance:
      id === "sensitivities-diets"
        ? [
            source(
              "Eating, Diet, & Nutrition for Celiac Disease",
              "https://www.niddk.nih.gov/health-information/digestive-diseases/celiac-disease/eating-diet-nutrition",
              "Cross-contact; food labels; guidance on restrictive diets",
              "wellness-education",
            ),
          ]
        : id === "gut-digestion"
          ? [
              NUTRIENTS.fiber.source,
              source(
                "Probiotics: Usefulness and Safety",
                "https://www.nccih.nih.gov/health/probiotics-usefulness-and-safety",
                "What do we know about effectiveness?",
                "wellness-education",
              ),
            ]
          : id === "hydration"
            ? [NUTRIENTS.water.source]
            : [SELF_CARE_SOURCE],
  }),
);
