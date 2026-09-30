// Maps MoodMeal's 12 moods to an avatar EXPRESSION only — eyes, eyebrows,
// mouth, and a couple of optional details (blush/tears/a sweat drop).
// These are visual design descriptions, not medical or diagnostic
// definitions. Nothing here may reference skin tone, hair, clothing, or any
// other identity-defining part of the avatar; see src/types/avatar.ts.
import type { ExpressionMap } from "../types/avatar";

export const EXPRESSION_MAP: ExpressionMap = {
  happy: {
    eyes: "happy-arc",
    eyebrows: "relaxed",
    mouth: "smile-big",
    blush: true,
  },
  sad: {
    eyes: "gentle-down",
    eyebrows: "raised-inner",
    mouth: "frown",
    tears: true,
  },
  tired: {
    eyes: "sleepy",
    eyebrows: "relaxed",
    mouth: "flat-yawn",
  },
  scared: {
    eyes: "wide",
    eyebrows: "raised",
    mouth: "open-o-small",
    sweatDrop: true,
  },
  angry: {
    eyes: "squint",
    eyebrows: "lowered",
    mouth: "frown-sharp",
  },
  nervous: {
    eyes: "nervous-wave",
    eyebrows: "worried",
    mouth: "wavy",
    sweatDrop: true,
  },
  shy: {
    eyes: "gentle-down",
    eyebrows: "relaxed",
    mouth: "small-smile",
    blush: true,
  },
  excited: {
    eyes: "wide",
    eyebrows: "raised",
    mouth: "grin-big-open",
    blush: true,
  },
  bored: {
    eyes: "half-lidded",
    eyebrows: "flat",
    mouth: "flat",
  },
  silly: {
    eyes: "spiral-playful",
    eyebrows: "playful",
    mouth: "tongue",
  },
  worried: {
    eyes: "worried-wide",
    eyebrows: "raised-inner-angled",
    mouth: "concerned",
  },
  sick: {
    eyes: "sleepy",
    eyebrows: "worried",
    mouth: "uncomfortable-wavy",
  },
};

export function getExpression(emotionId: keyof ExpressionMap) {
  return EXPRESSION_MAP[emotionId];
}
