/**
 * Converts whatever is stored under `moodmeal:avatar` into a current
 * AvatarConfig ({ baseStyle, skinTone, hairStyle }). localStorage is not
 * type-checked, so this accepts `unknown` and is defensive about every
 * field. Safe (and a no-op) on an already-current config. See
 * src/hooks/useAvatar.ts for where it runs — on every read, self-healing
 * the stored copy once.
 *
 * Stored shapes it understands, newest first:
 *   - Phase 1:  { baseStyle, skinTone, hairStyle }
 *   - Presets:  { presetId, skinTone, hairStyle, hairColor, faceShape, ... }
 *               Each of the seven retired presets maps to the base style
 *               and hairstyle it was drawn with, so the avatar looks as
 *               close as possible to what the user last saw.
 *   - 3 models: { baseModel, hairStyle, ... }
 *   - Phase 2C: { frame: "soft" | "bold", pose, hairStyle, ... }
 *   - Phase 2B: { hairStyle, skinTone, ... } with the older 12-style
 *               hairstyle ids and the "porcelain" skin tone.
 * Modular configurations retain validated per-character appearances.
 * Every retired top-level field (hairColor, faceShape, eye/eyebrow styles, facial
 * hair, clothing, accessories, frame, pose, presetId, baseModel) is
 * dropped from the result.
 *
 * Returns null for anything that isn't an object — the caller treats that
 * as "no avatar yet".
 */
import { appearanceFor, validStyle } from "./avatarAppearance";
import { BASE_STYLE_IDS, DEFAULT_AVATAR_CONFIG, HAIR_STYLE_IDS, SKIN_TONE_IDS } from "./avatarOptions";
import type { AvatarConfig, BaseStyleId, HairStyleId, SkinToneId } from "../types/avatar";

const LEGACY_SKIN_TONE_MAP: Record<string, SkinToneId> = {
  porcelain: "fair",
};

/** Phase 2B's 12-style set -> nearest current style (same texture/length). */
const LEGACY_HAIR_STYLE_MAP: Record<string, HairStyleId> = {
  buzz: "buzz-cut",
  short: "short-straight",
  "short-cut": "short-straight",
  "straight-long": "straight",
  "wavy-long": "long-wavy",
  curly: "short-curly",
  coily: "short-curly",
  "curly-short": "short-curly",
  "curly-long": "short-curly",
  "coily-afro": "short-curly",
  twists: "braids",
  locs: "braids",
  bun: "long-wavy",
};

/** The seven retired presets -> the body and hair each one was drawn with. */
const LEGACY_PRESET_MAP: Record<string, { baseStyle: BaseStyleId; hairStyle: HairStyleId }> = {
  feminine: { baseStyle: "feminine", hairStyle: "long-wavy" },
  masculine: { baseStyle: "masculine", hairStyle: "short-straight" },
  androgynous: { baseStyle: "androgynous", hairStyle: "short-straight" },
  braids: { baseStyle: "feminine", hairStyle: "braids" },
  seated: { baseStyle: "masculine", hairStyle: "short-curly" },
  bold: { baseStyle: "androgynous", hairStyle: "buzz-cut" },
  classic: { baseStyle: "masculine", hairStyle: "short-straight" },
};

/** Hairstyle used when nothing usable was stored. */
const DEFAULT_HAIR_FOR_BASE: Record<BaseStyleId, HairStyleId> = {
  feminine: "long-wavy",
  masculine: "short-straight",
  androgynous: "short-straight",
};

function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (list as readonly string[]).includes(value);
}

function ownValue<T>(map: Record<string, T>, key: unknown): T | undefined {
  return typeof key === "string" && Object.prototype.hasOwnProperty.call(map, key) ? map[key] : undefined;
}

export function normalizeAvatarConfig(raw: unknown): AvatarConfig | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;

  const skinTone: SkinToneId = isOneOf(SKIN_TONE_IDS, r.skinTone)
    ? r.skinTone
    : ownValue(LEGACY_SKIN_TONE_MAP, r.skinTone) ?? DEFAULT_AVATAR_CONFIG.skinTone;

  // A preset avatar's hair was dictated by the preset, not by the stored
  // hairStyle field, so the preset wins when there's no current baseStyle.
  const preset = !isOneOf(BASE_STYLE_IDS, r.baseStyle) && typeof r.presetId === "string"
    ? ownValue(LEGACY_PRESET_MAP, r.presetId)
    : undefined;

  const baseStyle: BaseStyleId = isOneOf(BASE_STYLE_IDS, r.baseStyle)
    ? r.baseStyle
    : preset
      ? preset.baseStyle
      : isOneOf(BASE_STYLE_IDS, r.baseModel)
        ? r.baseModel
        : r.frame === "bold"
          ? "masculine"
          : DEFAULT_AVATAR_CONFIG.baseStyle;

  const hairStyle: HairStyleId = preset
    ? preset.hairStyle
    : isOneOf(HAIR_STYLE_IDS, r.hairStyle)
      ? r.hairStyle
      : ownValue(LEGACY_HAIR_STYLE_MAP, r.hairStyle) ?? DEFAULT_HAIR_FOR_BASE[baseStyle];

  if (r.artworkVersion === "modular-v1" && baseStyle !== "androgynous") {
    const config: AvatarConfig = { artworkVersion: "modular-v1", baseStyle, skinTone, hairStyle: validStyle(baseStyle, r.hairStyle) };
    if (r.appearances && typeof r.appearances === "object" && !Array.isArray(r.appearances)) {
      const entries = r.appearances as Record<string, unknown>;
      config.appearances = {};
      for (const character of ["feminine", "masculine"] as const) {
        const saved = entries[character];
        if (saved && typeof saved === "object" && !Array.isArray(saved)) {
          config.appearances[character] = appearanceFor({...config, appearances: {[character]: saved} as AvatarConfig["appearances"]}, character);
        }
      }
      config.hairStyle = appearanceFor(config, baseStyle).hairStyle;
    }
    return config;
  }
  // Do not opt existing users into new artwork without their choice.
  return { baseStyle, skinTone, hairStyle };
}
