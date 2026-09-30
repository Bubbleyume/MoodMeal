// Types for MoodMeal's user-created avatar system.
//
// An avatar's IDENTITY (base style, skin tone, hairstyle) is chosen once
// and never changes on its own. Only the EXPRESSION layer (see
// avatarExpressions.ts) changes when the user's mood changes — same
// person, different face.
//
// Avatar Redesign Phase 1 reduced AvatarConfig to the three choices the
// Creator actually offers. Every older stored shape (Phase 2B/2C option
// sets, the seven-preset `presetId` model) is converted into this one by
// src/data/avatarMigration.ts — nothing else in the app has to know those
// older shapes existed.

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
