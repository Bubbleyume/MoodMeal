// Types for MoodMeal's user-created avatar system.
//
// An avatar's IDENTITY (preset character and skin tone) is chosen once
// and never changes on its own. Only the EXPRESSION layer (see
// avatarExpressions.ts) changes when the user's mood changes — same
// person, different face.
//
// Phase 2E uses seven complete preset characters. Each preset owns its hair,
// hair color, outfit, pose, and accessibility details. Skin tone is the only
// part edited separately.
// The full option set below is intentionally still modeled here — several
// fields (`faceShape`, `eyeStyle`, `eyeColor`, `eyebrowStyle`, `facialHair`,
// `clothingStyle`, `clothingColor`, `accessories`) are no longer exposed for
// editing in the current Creator (see AvatarCreator.tsx) but keep working
// exactly as before in the renderer, fixed at a sensible default, so a
// future "advanced customization" mode can re-expose them without any data
// migration or renderer rework. See src/data/avatarMigration.ts for how a
// pre-2C saved avatar is normalized into this shape.

import type { EmotionId } from "./index";

/**
 * Complete body, outfit, and pose presentations. The selected hairstyle and
 * skin tone can be used with every base model.
 */
export type PresetCharacterId =
  | "feminine"
  | "masculine"
  | "androgynous"
  | "braids"
  | "seated"
  | "bold"
  | "classic";

export type SkinToneId =
  | "fair"
  | "light"
  | "medium"
  | "tan"
  | "deep"
  | "rich";

export type FaceShapeId = "round" | "oval" | "heart";

// Phase 2D starter hairstyle set.
export type HairStyleId =
  | "long-wavy"
  | "straight"
  | "braids"
  | "short-curly"
  | "short-straight"
  | "buzz-cut"
  | "bald";

export type HairColorId =
  | "black"
  | "dark-brown"
  | "brown"
  | "auburn"
  | "blonde"
  | "platinum"
  | "gray"
  | "pink"
  | "blue"
  | "purple";

export type EyeStyleId = "round" | "almond" | "wide-set";

export type EyeColorId = "brown" | "dark-brown" | "hazel" | "green" | "blue" | "gray" | "amber";

export type EyebrowStyleId = "natural" | "thin" | "thick" | "arched";

export type FacialHairId = "none" | "stubble" | "mustache" | "goatee" | "full-beard";

export type ClothingStyleId = "crew-neck" | "hoodie" | "v-neck" | "collared";

export type ClothingColorId =
  | "brand-purple"
  | "brand-pink"
  | "mood-green"
  | "coral"
  | "sky"
  | "sunny"
  | "slate"
  | "white";

export type AccessoryId = "glasses" | "earrings" | "headband" | "freckles";

export interface AvatarConfig {
  // --- Editable in the current simplified Creator UI ---
  presetId: PresetCharacterId;
  skinTone: SkinToneId;
  // --- Fixed by the selected preset for now ---
  hairStyle: HairStyleId;
  // Fixed for now, retained internally so color customization can return
  // later without another storage migration.
  hairColor: HairColorId;

  // --- Modeled and fully rendered, but not currently exposed for editing
  // — fixed at a sensible default by DEFAULT_AVATAR_CONFIG for new avatars,
  // and preserved as-is for avatars created before Phase 2C. Kept here
  // rather than deleted so a future advanced-customization mode can
  // re-expose any of these without a data migration. ---
  faceShape: FaceShapeId;
  eyeStyle: EyeStyleId;
  eyeColor: EyeColorId;
  eyebrowStyle: EyebrowStyleId;
  facialHair: FacialHairId;
  /** MVP ships one standard outfit ("MoodMeal shirt" + jeans); these two
   * fields are normalized to that standard outfit's fixed values (see
   * avatarOptions.ts `STANDARD_OUTFIT`) rather than user-chosen for now. */
  clothingStyle: ClothingStyleId;
  clothingColor: ClothingColorId;
  accessories: AccessoryId[];
}

// --- Expression layer -------------------------------------------------
// Purely presentational shape keys the Avatar renderer knows how to draw.
// Adding a real illustrated asset later means mapping these same keys to
// image files instead of vector paths — the rest of the app never needs
// to change.

export type EyeShapeKey =
  | "happy-arc"
  | "gentle-down"
  | "sleepy"
  | "wide"
  | "squint"
  | "half-lidded"
  | "nervous-wave"
  | "spiral-playful"
  | "worried-wide";

export type EyebrowShapeKey =
  | "relaxed"
  | "raised-inner"
  | "raised"
  | "lowered"
  | "worried"
  | "playful"
  | "flat"
  | "raised-inner-angled";

export type MouthShapeKey =
  | "smile-big"
  | "frown"
  | "flat-yawn"
  | "open-o-small"
  | "frown-sharp"
  | "wavy"
  | "small-smile"
  | "grin-big-open"
  | "flat"
  | "tongue"
  | "concerned"
  | "uncomfortable-wavy";

export interface ExpressionSpec {
  eyes: EyeShapeKey;
  eyebrows: EyebrowShapeKey;
  mouth: MouthShapeKey;
  blush?: boolean;
  tears?: boolean;
  sweatDrop?: boolean;
}

export type ExpressionMap = Record<EmotionId, ExpressionSpec>;
