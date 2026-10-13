import { STYLE_OPTIONS, appearanceFor, HAIR_COLORS, EYE_COLORS } from "./avatarAppearance";
import type { AvatarConfig, HairStyleId } from "../types/avatar";
import type { EmotionId } from "../types";
import { getAvatarPreset } from "./avatarPresets";
export const AVATAR_MOODS: (EmotionId | "neutral")[] = ["neutral", "happy", "sad", "tired", "scared", "angry", "nervous", "shy", "excited", "bored", "silly", "worried", "sick"];
export const CHARACTERS = [{ id: "feminine" as const, label: "Soft Frame" }, { id: "masculine" as const, label: "Bold Frame" }];
export const TONE_IDS = { fair: "s01", light: "s02", medium: "s03", tan: "s04", deep: "s05", rich: "s06" };
export function isModular(config: AvatarConfig) {
  return config.artworkVersion === "modular-v1" && config.baseStyle !== "androgynous";
}
export function getAvatarLabel(config: AvatarConfig) {
  return isModular(config) ? (config.baseStyle === "masculine" ? "Bold Frame" : "Soft Frame") : (config.baseStyle === "masculine" ? "Bold Frame" : config.baseStyle === "feminine" ? "Soft Frame" : "Classic Frame");
}
export function hairOptions(base: AvatarConfig["baseStyle"]): { id: HairStyleId; label: string }[] {
  return STYLE_OPTIONS[base === "masculine" ? "masculine" : "feminine"];
}
export function avatarSource(config: AvatarConfig, mood: EmotionId | "neutral" = "neutral") {
  if (!isModular(config)) return getAvatarPreset(config.baseStyle).src;
  const boy = config.baseStyle === "masculine";
  const hair = `${boy ? "b" : "g"}0${config.hairStyle === "short-curly" ? 2 : 1}`;
  const tone = TONE_IDS[config.skinTone] ?? "s03";
  const expression = AVATAR_MOODS.includes(mood) ? mood : "neutral";
  return `/assets/avatars/modular-v1/${boy ? "boy" : "girl"}/${tone}/${hair}/${expression}.webp`;
}

export function avatarLayers(config: AvatarConfig, mood: EmotionId | "neutral" = "neutral") {
  const character = config.baseStyle === "masculine" ? "masculine" : "feminine";
  const appearance = appearanceFor(config, character);
  const hair = STYLE_OPTIONS[character].find(s => s.id === appearance.hairStyle)!.asset;
  const root = `/assets/avatars/layers-v1/${character === "masculine" ? "boy" : "girl"}`;
  const expression = AVATAR_MOODS.includes(mood) ? mood : "neutral";
  const hairFilter = HAIR_COLORS.find(c => c.id === appearance.hairColor)!.filter;
  const eyeFilter = EYE_COLORS.find(c => c.id === appearance.eyeColor)!.filter;
  return [
    {src:`${root}/scalps/${hair}-${TONE_IDS[config.skinTone] ?? "s03"}.webp`,filter:"none",part:"scalp"},
    {src:`${root}/hair/${hair}-back.webp`,filter:hairFilter,part:"hair-back"},
    {src:`${root}/bases/${TONE_IDS[config.skinTone] ?? "s03"}.webp`,filter:"none",part:"base"},
    {src:`${root}/expressions/${expression}.webp`,filter:"none",part:"expression"},
    {src:`${root}/irises/${expression}.webp`,filter:eyeFilter,part:"irises"},
    {src:`${root}/hair/${hair}-front.webp`,filter:hairFilter,part:"hair-front"},
  ];
}
