// The Avatar Creator's option lists. Each list is the single source of
// truth for both the picker UI (label + swatch color) and the renderer
// (src/components/avatar/Avatar.tsx reads the `id` to pick a shape/fill).
import type { AvatarConfig, BaseStyleId, HairStyleId, SkinToneId } from "../types/avatar";

export interface AvatarOption<T extends string> {
  id: T;
  label: string;
  /** Hex color for a color-swatch picker; omitted for shape-only options. */
  hex?: string;
}

export const BASE_STYLES: AvatarOption<BaseStyleId>[] = [
  { id: "feminine", label: "Feminine" },
  { id: "masculine", label: "Masculine" },
  { id: "androgynous", label: "Androgynous" },
];

// 6 tones spanning very light through very deep.
export const SKIN_TONES: AvatarOption<SkinToneId>[] = [
  { id: "fair", label: "Fair", hex: "#f4c99a" },
  { id: "light", label: "Light", hex: "#e0ac76" },
  { id: "medium", label: "Medium", hex: "#c68a5b" },
  { id: "tan", label: "Tan", hex: "#a5673f" },
  { id: "deep", label: "Deep", hex: "#7a4526" },
  { id: "rich", label: "Rich", hex: "#4a2a18" },
];

export const HAIR_STYLES: AvatarOption<HairStyleId>[] = [
  { id: "long-wavy", label: "Long Wavy" },
  { id: "straight", label: "Straight" },
  { id: "braids", label: "Braids" },
  { id: "short-curly", label: "Short Curly" },
  { id: "short-straight", label: "Short Straight" },
  { id: "buzz-cut", label: "Buzz Cut" },
  { id: "bald", label: "Bald" },
];

export const BASE_STYLE_IDS = BASE_STYLES.map((o) => o.id);
export const SKIN_TONE_IDS = SKIN_TONES.map((o) => o.id);
export const HAIR_STYLE_IDS = HAIR_STYLES.map((o) => o.id);

/** The starting point shown the first time someone opens the Creator, and
 * what "Skip for now" saves during onboarding. */
export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  baseStyle: "feminine",
  skinTone: "medium",
  hairStyle: "long-wavy",
};
