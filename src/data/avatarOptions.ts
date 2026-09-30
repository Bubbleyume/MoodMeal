// The customization menu for MoodMeal's avatar creator. Each list is the
// single source of truth for both the picker UI (label + swatch color) and
// the SVG renderer (which reads the `id` to pick a shape/fill). Extending
// any of these — e.g. adding a new hair style — only means adding an entry
// here plus a matching case in the renderer; nothing else has to change.
import type {
  AccessoryId,
  AvatarConfig,
  ClothingColorId,
  ClothingStyleId,
  EyeColorId,
  EyeStyleId,
  EyebrowStyleId,
  FaceShapeId,
  FacialHairId,
  HairColorId,
  HairStyleId,
  PresetCharacterId,
  SkinToneId,
} from "../types/avatar";

export interface SwatchOption<T extends string> {
  id: T;
  label: string;
  /** Hex color for a color-swatch picker; omitted for shape-only options. */
  hex?: string;
}

// --- Phase 2C simplified Creator UI's option lists ----------------------

/** Complete preset characters from the approved MoodMeal lineup. */
export const PRESET_CHARACTERS: SwatchOption<PresetCharacterId>[] = [
  { id: "feminine", label: "Feminine" },
  { id: "masculine", label: "Masculine" },
  { id: "androgynous", label: "Androgynous" },
  { id: "braids", label: "Braids" },
  { id: "seated", label: "Seated Hoodie" },
  { id: "bold", label: "Bold & Unique" },
  { id: "classic", label: "Classic Tee" },
];

// Starter range for MVP: 6 tones spanning very light through very deep.
export const SKIN_TONES: SwatchOption<SkinToneId>[] = [
  { id: "fair", label: "Fair", hex: "#f4c99a" },
  { id: "light", label: "Light", hex: "#e0ac76" },
  { id: "medium", label: "Medium", hex: "#c68a5b" },
  { id: "tan", label: "Tan", hex: "#a5673f" },
  { id: "deep", label: "Deep", hex: "#7a4526" },
  { id: "rich", label: "Rich", hex: "#4a2a18" },
];

// Starter range for MVP: 7 styles covering a meaningful spread of textures
// and lengths without the larger Phase 2B set's full cross-section.
export const HAIR_STYLES: SwatchOption<HairStyleId>[] = [
  { id: "long-wavy", label: "Long Wavy" },
  { id: "straight", label: "Straight" },
  { id: "braids", label: "Braids" },
  { id: "short-curly", label: "Short Curly" },
  { id: "short-straight", label: "Short Straight" },
  { id: "buzz-cut", label: "Buzz Cut" },
  { id: "bald", label: "Bald" },
];

// --- Modeled but not currently shown in the simplified Creator UI --------
// (kept for a future advanced-customization mode — see types/avatar.ts)

export const FACE_SHAPES: SwatchOption<FaceShapeId>[] = [
  { id: "round", label: "Round" },
  { id: "oval", label: "Oval" },
  { id: "heart", label: "Heart" },
];

export const HAIR_COLORS: SwatchOption<HairColorId>[] = [
  { id: "black", label: "Black", hex: "#2b1b12" },
  { id: "dark-brown", label: "Dark Brown", hex: "#4a3226" },
  { id: "brown", label: "Brown", hex: "#6b4a34" },
  { id: "auburn", label: "Auburn", hex: "#8a4b32" },
  { id: "blonde", label: "Blonde", hex: "#d9b268" },
  { id: "platinum", label: "Platinum", hex: "#e8dfc8" },
  { id: "gray", label: "Gray", hex: "#b9b4ad" },
  { id: "pink", label: "Pink", hex: "#e879e0" },
  { id: "blue", label: "Blue", hex: "#4fa8f0" },
  { id: "purple", label: "Purple", hex: "#8b5cf6" },
];

export const EYE_STYLES: SwatchOption<EyeStyleId>[] = [
  { id: "round", label: "Round" },
  { id: "almond", label: "Almond" },
  { id: "wide-set", label: "Wide-set" },
];

export const EYE_COLORS: SwatchOption<EyeColorId>[] = [
  { id: "brown", label: "Brown", hex: "#4a2f1a" },
  { id: "dark-brown", label: "Dark Brown", hex: "#2e1c10" },
  { id: "hazel", label: "Hazel", hex: "#6b4a23" },
  { id: "green", label: "Green", hex: "#3f7a4f" },
  { id: "blue", label: "Blue", hex: "#3f7fc4" },
  { id: "gray", label: "Gray", hex: "#8a95a1" },
  { id: "amber", label: "Amber", hex: "#b5711e" },
];

export const EYEBROW_STYLES: SwatchOption<EyebrowStyleId>[] = [
  { id: "natural", label: "Natural" },
  { id: "thin", label: "Thin" },
  { id: "thick", label: "Thick" },
  { id: "arched", label: "Arched" },
];

export const FACIAL_HAIR_STYLES: SwatchOption<FacialHairId>[] = [
  { id: "none", label: "None" },
  { id: "stubble", label: "Stubble" },
  { id: "mustache", label: "Mustache" },
  { id: "goatee", label: "Goatee" },
  { id: "full-beard", label: "Full Beard" },
];

export const CLOTHING_STYLES: SwatchOption<ClothingStyleId>[] = [
  { id: "crew-neck", label: "Crew Neck" },
  { id: "hoodie", label: "Hoodie" },
  { id: "v-neck", label: "V-Neck" },
  { id: "collared", label: "Collared" },
];

export const CLOTHING_COLORS: SwatchOption<ClothingColorId>[] = [
  { id: "brand-purple", label: "Purple", hex: "#7c3aed" },
  { id: "brand-pink", label: "Pink", hex: "#d559d9" },
  { id: "mood-green", label: "Green", hex: "#7fd858" },
  { id: "coral", label: "Coral", hex: "#ff6f61" },
  { id: "sky", label: "Sky", hex: "#4fa8f0" },
  { id: "sunny", label: "Sunny", hex: "#ffc107" },
  { id: "slate", label: "Slate", hex: "#64748b" },
  { id: "white", label: "White", hex: "#f4f4f5" },
];

export const ACCESSORIES: SwatchOption<AccessoryId>[] = [
  { id: "glasses", label: "Glasses" },
  { id: "earrings", label: "Earrings" },
  { id: "headband", label: "Headband" },
  { id: "freckles", label: "Freckles" },
];

/**
 * Hidden face and color defaults shared by all three base models.
 */
export const STANDARD_OUTFIT: { clothingStyle: ClothingStyleId; clothingColor: ClothingColorId } = {
  clothingStyle: "crew-neck",
  clothingColor: "brand-purple",
};

/** A reasonable, inclusive starting point shown the first time someone
 * opens the Avatar Creator. Only preset character and skin tone are editable.
 * The remaining fields are fixed/reserved — see types/avatar.ts. */
export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  presetId: "feminine",
  skinTone: "medium",
  hairStyle: "long-wavy",
  hairColor: "dark-brown",
  faceShape: "round",
  eyeStyle: "round",
  eyeColor: "brown",
  eyebrowStyle: "natural",
  facialHair: "none",
  ...STANDARD_OUTFIT,
  accessories: [],
};
