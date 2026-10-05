import type { BaseStyleId } from "../types/avatar";

// Ordered once for both onboarding and Profile. Original transparent PNGs.
export const AVATAR_PRESETS = [
  { id: "feminine", label: "Feminine", src: "/assets/avatars/presets/feminine.png" },
  { id: "androgynous", label: "Androgynous", src: "/assets/avatars/presets/androgynous.png" },
  { id: "masculine", label: "Masculine", src: "/assets/avatars/presets/masculine.png" },
] satisfies { id: BaseStyleId; label: string; src: string }[];

export function getAvatarPreset(id: unknown) {
  return AVATAR_PRESETS.find((preset) => preset.id === id) ?? AVATAR_PRESETS[0];
}
