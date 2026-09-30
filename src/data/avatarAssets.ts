/**
 * The avatar system's ASSET RESOLUTION layer — deliberately kept separate
 * from AVATAR STATE (src/types/avatar.ts, src/hooks/useAvatar.ts) and
 * AVATAR RENDERING (src/components/avatar/Avatar.tsx):
 *
 *   STATE        — what the user picked (an AvatarConfig — just ids) plus
 *                  which mood expression is active (an ExpressionSpec)
 *   RENDERING    — how a resolved set of layers gets drawn (SVG layer
 *                  order, positioning, expression switching)
 *   RESOLUTION   — turning ids from AvatarConfig/ExpressionSpec into the
 *                  concrete things the renderer needs to draw them — this
 *                  module
 *
 * Nothing outside this file should hardcode an "/assets/avatars/..." path,
 * string-concatenate a layer + id into a filename, or reach into
 * avatarOptions.ts's swatch lists to pull out a `.hex` by hand. Application/
 * renderer code asks this module instead, one layer at a time:
 *
 *   getHairAsset(avatar.hairStyle)          -> { path, tint: "hair" }
 *   resolveHairColor(avatar.hairColor)      -> "#4a3226"
 *   resolveLayer(getHairAsset(...), avatar) -> { path, color: "#4a3226" }
 *
 * ---------------------------------------------------------------------
 * WHY LAYERS ARE SPLIT INTO "STYLE/SHAPE" + "COLOR/TINT" (read this before
 * producing or wiring in real artwork):
 *
 * Every identity field on AvatarConfig is either a SHAPE choice (which
 * silhouette to draw — a hairstyle, an eye style, a clothing cut) or a
 * COLOR choice (what hue to render that silhouette in — a hair color, an
 * eye color, a clothing color). Today's vector renderer already keeps
 * these independent: e.g. `renderHairBack("coily", hairHex)` draws the
 * SAME coily silhouette regardless of `hairHex`, just filled with whatever
 * color was resolved. Production artwork MUST preserve that split instead
 * of collapsing it:
 *
 *   RIGHT: one greyscale/alpha "coily" silhouette (SVG path, or a PNG used
 *          as a mask/multiply layer) + a hex color applied at render time
 *          -> 7 hairstyles x 10 hair colors = 7 files, not 70.
 *   WRONG: a fully-colored "afro, platinum blonde" raster PNG, a separately
 *          exported "afro, jet black" raster PNG, etc. — a full cross-
 *          product of every shape x every color, which also can't be
 *          tinted to a color a user picks that nobody thought to pre-render.
 *
 * The same logic applies to eyes/eyebrows/mouth and EXPRESSION: those are
 * keyed by shape (an EyeShapeKey/EyebrowShapeKey/MouthShapeKey from the
 * active ExpressionSpec) crossed with the user's chosen STYLE
 * (EyeStyleId/EyebrowStyleId) — never by baking a specific eye COLOR or
 * skin tone into the expression artwork itself. A production illustrator
 * only ever needs to draw:
 *   - one shape per (eye style x eye expression) combination, uncolored
 *   - one shape per (eyebrow style x eyebrow expression) combination
 *   - one shape per mouth expression (mouths have no separate "style" today)
 * and this module supplies the color for each at render time from the
 * user's identity — never from the expression.
 *
 * See "Production art brief" in README.md for the full illustrated-asset
 * checklist this module's API is designed around.
 */
import {
  SKIN_TONES,
  HAIR_COLORS,
  EYE_COLORS,
  CLOTHING_COLORS,
} from "./avatarOptions";
import type {
  AvatarConfig,
  EyeShapeKey,
  EyebrowShapeKey,
  MouthShapeKey,
  EyeStyleId,
  EyebrowStyleId,
  HairStyleId,
  PresetCharacterId,
  FacialHairId,
  ClothingStyleId,
  AccessoryId,
} from "../types/avatar";

/** Mirrors the public/assets/avatars/<layer>/ folder structure. */
export type AvatarAssetLayer =
  | "base"
  | "hair"
  | "eyes"
  | "eyebrows"
  | "mouths"
  | "facial-hair"
  | "clothing"
  | "lower-body"
  | "accessories"
  | "effects";

/**
 * Which resolver (if any) supplies this layer's color at render time.
 * "ink" is the contrast-adaptive line-art color from `resolveInkColor` —
 * used for line-art layers (eyebrows, mouth) that must stay legible across
 * every skin tone rather than tracking a single identity color.
 */
export type AvatarTint = "skin" | "hair" | "eye" | "clothing" | "ink";

/** A style/shape asset reference, plus which color it should be tinted with. */
export interface AvatarLayerAsset {
  layer: AvatarAssetLayer;
  /** Where the un-tinted shape file would live once production art exists. */
  path: string;
  /** Omitted for layers with no single identity color (e.g. accessories, effects). */
  tint?: AvatarTint;
}

const AVATAR_ASSET_ROOT = "/assets/avatars";

function assetRef(layer: AvatarAssetLayer, filename: string, tint?: AvatarTint): AvatarLayerAsset {
  return { layer, path: `${AVATAR_ASSET_ROOT}/${layer}/${filename}.svg`, tint };
}

// --- Style/shape getters (identity) ------------------------------------
// One of these per (style [x expression]) combination — never per color.

/**
 * One complete body, outfit, and pose asset per base model.
 */
export function getBaseAsset(presetId: PresetCharacterId): AvatarLayerAsset {
  return assetRef("base", presetId, "skin");
}

export function getHairAsset(hairStyle: HairStyleId): AvatarLayerAsset {
  return assetRef("hair", hairStyle, "hair");
}

/**
 * Optional lower-body export for art pipelines that keep each model split
 * into upper and lower files.
 */
export function getLowerBodyAsset(presetId: PresetCharacterId): AvatarLayerAsset {
  return assetRef("lower-body", presetId);
}

/** Fixed jeans/shoe colors for the MVP's one standard outfit — not part of
 * AvatarConfig and not user-editable, unlike the shirt (which is still
 * tinted via `resolveClothingColor`, just locked to one value for now by
 * `STANDARD_OUTFIT` in avatarOptions.ts). */
export const JEANS_COLOR = "#5b7fa6";
export const SHOE_COLOR = "#33323d";

/** Eye SHAPE depends on both the user's chosen style and the active mood's
 * eye expression — the same "almond" eyes look different smiling vs. wide
 * with worry — but never on eye COLOR, which is resolved separately. */
export function getEyeAsset(eyeStyle: EyeStyleId, eyesExpression: EyeShapeKey): AvatarLayerAsset {
  return assetRef("eyes", `${eyeStyle}--${eyesExpression}`, "eye");
}

/** Same pattern as eyes: style x expression, tinted with `ink` (not hair
 * color) so eyebrows stay legible regardless of skin tone. */
export function getEyebrowAsset(eyebrowStyle: EyebrowStyleId, eyebrowsExpression: EyebrowShapeKey): AvatarLayerAsset {
  return assetRef("eyebrows", `${eyebrowStyle}--${eyebrowsExpression}`, "ink");
}

/** Mouths have no separate identity "style" today — only an expression. */
export function getMouthAsset(mouthExpression: MouthShapeKey): AvatarLayerAsset {
  return assetRef("mouths", mouthExpression, "ink");
}

export function getFacialHairAsset(facialHair: FacialHairId): AvatarLayerAsset | null {
  if (facialHair === "none") return null;
  return assetRef("facial-hair", facialHair, "hair");
}

export function getClothingAsset(clothingStyle: ClothingStyleId): AvatarLayerAsset {
  return assetRef("clothing", clothingStyle, "clothing");
}

/** Accessories (glasses/earrings/headband/freckles) render in a fixed
 * palette or the adaptive ink color, never a user-chosen identity color. */
export function getAccessoryAsset(accessory: AccessoryId): AvatarLayerAsset {
  return assetRef("accessories", accessory, accessory === "freckles" ? "ink" : undefined);
}

/** Expression effects (blush/tears/sweat drop) are fixed-palette overlays,
 * not tinted from any identity field. */
export function getExpressionEffectAsset(effect: "blush" | "tears" | "sweatDrop"): AvatarLayerAsset {
  return assetRef("effects", effect);
}

// --- Color/tint resolvers (identity colors, never expression-dependent) --

function hexFor<T extends string>(
  list: { id: T; hex?: string }[],
  id: T,
  fallback: string
): string {
  return list.find((o) => o.id === id)?.hex ?? fallback;
}

export function resolveSkinColor(id: AvatarConfig["skinTone"]): string {
  return hexFor(SKIN_TONES, id, "#c68a5b");
}

export function resolveHairColor(id: AvatarConfig["hairColor"]): string {
  return hexFor(HAIR_COLORS, id, "#4a3226");
}

export function resolveEyeColor(id: AvatarConfig["eyeColor"]): string {
  return hexFor(EYE_COLORS, id, "#4a2f1a");
}

export function resolveClothingColor(id: AvatarConfig["clothingColor"]): string {
  return hexFor(CLOTHING_COLORS, id, "#7c3aed");
}

export interface ResolvedAvatarColors {
  skinHex: string;
  hairHex: string;
  eyeHex: string;
  clothingHex: string;
}

/** Resolves every color an identity layer needs in one call, from ids. */
export function resolveAvatarColors(config: AvatarConfig): ResolvedAvatarColors {
  return {
    skinHex: resolveSkinColor(config.skinTone),
    hairHex: resolveHairColor(config.hairColor),
    eyeHex: resolveEyeColor(config.eyeColor),
    clothingHex: resolveClothingColor(config.clothingColor),
  };
}

/** Perceptual luma (0-255) of a "#rrggbb" hex — higher means lighter. */
export function relativeLuma(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 255;
  const num = parseInt(m[1], 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/** Whether a "#rrggbb" hex reads as "light" above the given luma threshold. */
export function isLightColor(hex: string, threshold = 190): boolean {
  return relativeLuma(hex) > threshold;
}

/**
 * The renderer's facial line-art color (eyes/eyebrows/mouth/glasses)
 * adapts to skin tone luma so features stay readable across the whole
 * skin tone range — a fixed dark ink reads fine on light/medium skin but
 * nearly disappears against the two deepest tones, which would be a real
 * inclusivity bug in a system whose whole point is representing a broad
 * range of appearances clearly.
 */
export function resolveInkColor(skinHex: string): string {
  return isLightColor(skinHex, 115) ? "#3a2a4a" : "#fbeee2";
}

/** Darkens a "#rrggbb" hex by `amount` (0-1) — simple shading for vector layers. */
export function shade(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const num = parseInt(m[1], 16);
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 0xff) * (1 - amount)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// --- Compound resolution --------------------------------------------------
// Ties a style/shape getter's output to its resolved color in one step —
// this is the shape a future production-art renderer would actually consume
// per layer (a file to draw plus the color to tint it), and is exactly what
// lets Avatar.tsx eventually resolve "the coily-afro hair layer for THIS
// user" without any component needing to know how tinting works.

export interface ResolvedLayer {
  layer: AvatarAssetLayer;
  path: string;
  /** Undefined when the layer has no single identity tint (e.g. effects). */
  color?: string;
}

/** Resolves a tint kind to a concrete color for one avatar's identity. */
export function resolveTint(tint: AvatarTint | undefined, config: AvatarConfig): string | undefined {
  switch (tint) {
    case "skin":
      return resolveSkinColor(config.skinTone);
    case "hair":
      return resolveHairColor(config.hairColor);
    case "eye":
      return resolveEyeColor(config.eyeColor);
    case "clothing":
      return resolveClothingColor(config.clothingColor);
    case "ink":
      return resolveInkColor(resolveSkinColor(config.skinTone));
    default:
      return undefined;
  }
}

/** Combines a style/shape asset with its resolved color for one avatar. */
export function resolveLayer(asset: AvatarLayerAsset | null, config: AvatarConfig): ResolvedLayer | null {
  if (!asset) return null;
  return { layer: asset.layer, path: asset.path, color: resolveTint(asset.tint, config) };
}
