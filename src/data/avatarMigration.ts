/**
 * Normalizes a saved AvatarConfig that may predate the three-model MVP
 * option set, or come straight out of localStorage where nothing is
 * type-checked at the boundary — into a config valid for the CURRENT
 * option set. Safe to call on an already-current config (a no-op in that
 * case). See src/hooks/useAvatar.ts for where this runs (on every read, and
 * self-healing the stored copy once).
 *
 * What changes on an older avatar:
 *   - old frame and pose fields map to a complete base model.
 *   - `skinTone`: Phase 2B's "porcelain" is folded into "fair" (the new
 *     lightest starter tone) — everything else maps 1:1.
 *   - `hairStyle`: Phase 2B's 12-style set maps onto the 7-style MVP set
 *     below (see LEGACY_HAIR_STYLE_MAP for exactly which style each old one
 *     becomes — every mapping keeps the same general texture/length).
 *   - `clothingStyle`/`clothingColor` are normalized to the one standard
 *     "MoodMeal shirt" outfit — the MVP no longer varies clothing, so an
 *     avatar that previously wore a hoodie or a different color now wears
 *     the same standard shirt as every other avatar.
 *   - Everything else (hairColor, faceShape, eyeStyle, eyeColor,
 *     eyebrowStyle, facialHair, accessories) is untouched — those fields
 *     didn't change shape in Phase 2C, so whatever the user previously
 *     chose keeps rendering exactly as before, even though the Creator no
 *     longer offers a picker for it.
 */
import { DEFAULT_AVATAR_CONFIG, STANDARD_OUTFIT } from "./avatarOptions";
import type { AvatarConfig, HairStyleId, PresetCharacterId, SkinToneId } from "../types/avatar";

const VALID_SKIN_TONES: SkinToneId[] = ["fair", "light", "medium", "tan", "deep", "rich"];
const LEGACY_SKIN_TONE_MAP: Record<string, SkinToneId> = {
  porcelain: "fair",
};

const VALID_HAIR_STYLES: HairStyleId[] = [
  "long-wavy",
  "straight",
  "braids",
  "short-curly",
  "short-straight",
  "buzz-cut",
  "bald",
];
const LEGACY_HAIR_STYLE_MAP: Record<string, HairStyleId> = {
  bald: "bald",
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

const VALID_PRESETS: PresetCharacterId[] = [
  "feminine",
  "masculine",
  "androgynous",
  "braids",
  "seated",
  "bold",
  "classic",
];

/** Accepts an untyped value (e.g. straight from `JSON.parse`, or an
 * already-valid `AvatarConfig`) on purpose — that's the actual shape of
 * data coming out of localStorage, and this function's whole job is to be
 * defensive about it regardless of which shape it's handed. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeAvatarConfig(raw: any): AvatarConfig {
  const rawSkinTone = raw.skinTone as string | undefined;
  const skinTone: SkinToneId = VALID_SKIN_TONES.includes(rawSkinTone as SkinToneId)
    ? (rawSkinTone as SkinToneId)
    : LEGACY_SKIN_TONE_MAP[rawSkinTone ?? ""] ?? DEFAULT_AVATAR_CONFIG.skinTone;

  const rawHairStyle = raw.hairStyle as string | undefined;
  const hairStyle: HairStyleId = VALID_HAIR_STYLES.includes(rawHairStyle as HairStyleId)
    ? (rawHairStyle as HairStyleId)
    : LEGACY_HAIR_STYLE_MAP[rawHairStyle ?? ""] ?? DEFAULT_AVATAR_CONFIG.hairStyle;

  const presetId: PresetCharacterId = VALID_PRESETS.includes(raw.presetId as PresetCharacterId)
    ? (raw.presetId as PresetCharacterId)
    : raw.baseModel === "masculine" || raw.frame === "bold"
      ? "masculine"
      : raw.baseModel === "androgynous"
        ? "androgynous"
        : DEFAULT_AVATAR_CONFIG.presetId;

  const presetHair: Record<PresetCharacterId, HairStyleId> = {
    feminine: "long-wavy",
    masculine: "short-straight",
    androgynous: "short-straight",
    braids: "braids",
    seated: "short-curly",
    bold: "buzz-cut",
    classic: "short-straight",
  };

  return {
    ...DEFAULT_AVATAR_CONFIG,
    ...(raw as Partial<AvatarConfig>),
    presetId,
    skinTone,
    hairStyle: presetHair[presetId],
    hairColor: DEFAULT_AVATAR_CONFIG.hairColor,
    faceShape: DEFAULT_AVATAR_CONFIG.faceShape,
    eyeStyle: DEFAULT_AVATAR_CONFIG.eyeStyle,
    eyeColor: DEFAULT_AVATAR_CONFIG.eyeColor,
    eyebrowStyle: DEFAULT_AVATAR_CONFIG.eyebrowStyle,
    facialHair: DEFAULT_AVATAR_CONFIG.facialHair,
    accessories: DEFAULT_AVATAR_CONFIG.accessories,
    ...STANDARD_OUTFIT,
  };
}
