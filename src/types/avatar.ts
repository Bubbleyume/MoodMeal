// Preset identity is stored in baseStyle. Skin/hair fields remain for backward
// compatibility but do not affect the fixed PNG artwork or appear in the chooser.
import type { EmotionId } from "./index";

/** Body, outfit, and pose presentation. Independent of hairstyle. */
export type BaseStyleId = "feminine" | "masculine" | "androgynous";

export type SkinToneId = "fair" | "light" | "medium" | "tan" | "deep" | "rich";

export type HairStyleId =
  | "long-wavy"
  | "straight"
  | "braids"
  | "short-curly"
  | "short-straight"
  | "buzz-cut"
  | "bald";

export interface AvatarConfig {
  baseStyle: BaseStyleId;
  skinTone: SkinToneId;
  hairStyle: HairStyleId;
}

// --- Expression layer -------------------------------------------------
// Purely presentational shape keys the Avatar renderer knows how to draw.

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
