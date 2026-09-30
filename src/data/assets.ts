// Centralized image-asset paths for MoodMeal.
//
// This is the single place that maps a domain id (an emotion, a food, a
// meal, the mascot, a branding mark) to where its real artwork *would* live
// under /public/assets once transparent, production-ready PNG/WebP files
// are available. Nothing in this app invents a remote image URL — every
// path here is local, and every consumer (AssetImage) falls back to the
// existing hand-drawn/emoji representation when the file doesn't exist yet,
// so the UI never shows a broken image.
//
// To swap in a real supplied asset later: drop the file at the path below
// (matching the id) and it starts rendering automatically — no component
// changes required.

import type { EmotionId } from "../types";

export const EMOTION_IMAGE_MAP: Record<EmotionId, string> = {
  happy: "/assets/emotions/happy.png",
  sad: "/assets/emotions/sad.png",
  tired: "/assets/emotions/tired.png",
  scared: "/assets/emotions/scared.png",
  angry: "/assets/emotions/angry.png",
  nervous: "/assets/emotions/nervous.png",
  shy: "/assets/emotions/shy.png",
  excited: "/assets/emotions/excited.png",
  bored: "/assets/emotions/bored.png",
  silly: "/assets/emotions/silly.png",
  worried: "/assets/emotions/worried.png",
  sick: "/assets/emotions/sick.png",
};

/** Food/meal image paths are derived from their id: /assets/foods/<id>.png */
export function foodImagePath(foodId: string): string {
  return `/assets/foods/${foodId}.png`;
}

export function mealImagePath(mealId: string): string {
  return `/assets/meals/${mealId}.png`;
}

/**
 * The official MoodMeal logo: a rounded-square pink→purple→violet gradient
 * mark with a white smiling face/fork glyph, a green leaf, and the white
 * "MoodMeal" wordmark baked in. This is the canonical brand identity —
 * MoodMeal has no separate mascot character; the only two visual identities
 * in the product are this logo and the user's own personalized avatar (see
 * src/components/avatar/Avatar.tsx and src/components/EmotionFace.tsx, which
 * applies mood expressions to that same avatar). Used sparingly (app
 * icon/favicon, a small brand mark on Welcome/loading/About), never
 * resized non-uniformly, cropped, recolored, or overlaid with text.
 */
export const BRANDING = {
  logo: "/assets/branding/moodmeal-logo.png",
};
