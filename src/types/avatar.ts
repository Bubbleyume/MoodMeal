// Unversioned configurations retain their legacy preset artwork.
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
  | "bald"
  | "ponytail"
  | "side-part"
  | "short-twists"
  | "short-textured"
  | "long-straight";

export type CharacterId = "feminine" | "masculine";
export type HairColorId = "original" | "black" | "brown" | "blonde" | "auburn" | "silver" | "purple";
export type EyeColorId = "original" | "blue" | "green" | "hazel" | "gray";
export interface CharacterAppearance {
  hairStyle: HairStyleId;
  hairColor: HairColorId;
  eyeColor: EyeColorId;
}
export interface AvatarConfig {
  appearances?: Partial<Record<CharacterId, CharacterAppearance>>;
  artworkVersion?: "modular-v1";
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
