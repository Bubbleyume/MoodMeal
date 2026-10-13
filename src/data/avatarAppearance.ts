import type { AvatarConfig, CharacterId, CharacterAppearance, HairStyleId, HairColorId, EyeColorId } from "../types/avatar";

export const STYLE_OPTIONS: Record<CharacterId, {id: HairStyleId; label: string; asset: string}[]> = {
  feminine: [
    {id:"long-wavy",label:"Long waves",asset:"g01-r2"}, {id:"short-curly",label:"Short wavy",asset:"g02-r2"},
    {id:"straight",label:"Straight with bangs",asset:"g03"}, {id:"ponytail",label:"Ponytail",asset:"g04-r2"}, {id:"braids",label:"Braids",asset:"g05-r2"},
    {id:"short-textured",label:"Short",asset:"g06"}, {id:"long-straight",label:"Straight",asset:"g07"},
  ],
  masculine: [
    {id:"short-straight",label:"Tousled",asset:"b01"}, {id:"short-curly",label:"Short curls",asset:"b02"},
    {id:"buzz-cut",label:"Buzz cut",asset:"b03"}, {id:"side-part",label:"Side part",asset:"b04"}, {id:"short-twists",label:"Short twists",asset:"b05"},
    {id:"long-wavy",label:"Long wavy",asset:"b06"}, {id:"braids",label:"Braids",asset:"b07"},
  ],
};
// Filters apply only to isolated hair or iris artwork, never skin or clothing.
export const HAIR_COLORS: {id: HairColorId; label: string; hex: string; filter: string}[] = [
  {id:"original",label:"Original",hex:"#654338",filter:"none"},
  {id:"black",label:"Black",hex:"#242126",filter:"grayscale(1) brightness(.4)"},
  {id:"brown",label:"Brown",hex:"#65402b",filter:"grayscale(1) sepia(1) saturate(1.5) brightness(.8)"},
  {id:"blonde",label:"Blonde",hex:"#d6b16b",filter:"grayscale(1) brightness(2.1) sepia(.8) saturate(1.4)"},
  {id:"auburn",label:"Auburn",hex:"#9e4631",filter:"grayscale(1) sepia(1) saturate(3) hue-rotate(330deg) brightness(1.1)"},
  {id:"silver",label:"Silver",hex:"#b9bbc5",filter:"grayscale(1) brightness(2)"},
  {id:"purple",label:"Purple",hex:"#9553bc",filter:"grayscale(1) sepia(1) saturate(3) hue-rotate(220deg) brightness(1.3)"},
];
export const EYE_COLORS: {id: EyeColorId; label: string; hex: string; filter: string}[] = [
  {id:"original",label:"Brown",hex:"#784414",filter:"none"},
  {id:"blue",label:"Blue",hex:"#408cbe",filter:"grayscale(1) sepia(1) saturate(4) hue-rotate(160deg) brightness(1.5)"},
  {id:"green",label:"Green",hex:"#548a42",filter:"grayscale(1) sepia(1) saturate(3) hue-rotate(55deg) brightness(1.4)"},
  {id:"hazel",label:"Hazel",hex:"#a18539",filter:"grayscale(1) sepia(1) saturate(2) brightness(1.6)"},
  {id:"gray",label:"Gray",hex:"#818994",filter:"grayscale(1) brightness(1.6)"},
];
export function validStyle(character: CharacterId, value: unknown): HairStyleId {
  return STYLE_OPTIONS[character].find(s => s.id === value)?.id ?? STYLE_OPTIONS[character][0].id;
}
export function appearanceFor(config: AvatarConfig, character: CharacterId): CharacterAppearance {
  const saved = config.appearances?.[character];
  return {
    hairStyle: validStyle(character, saved?.hairStyle ?? (config.baseStyle === character ? config.hairStyle : undefined)),
    hairColor: HAIR_COLORS.find(c => c.id === saved?.hairColor)?.id ?? "original",
    eyeColor: EYE_COLORS.find(c => c.id === saved?.eyeColor)?.id ?? "original",
  };
}
export function selectCharacter(config: AvatarConfig, character: CharacterId): AvatarConfig {
  const current = config.baseStyle === "masculine" ? "masculine" : "feminine";
  const next = appearanceFor(config, character);
  return {...config, artworkVersion:"modular-v1", baseStyle:character, hairStyle:next.hairStyle,
    appearances:{...config.appearances, [current]:appearanceFor(config,current), [character]:next}};
}
export function updateAppearance(config: AvatarConfig, patch: Partial<CharacterAppearance>): AvatarConfig {
  const character = config.baseStyle === "masculine" ? "masculine" : "feminine";
  const next = {...appearanceFor(config,character),...patch};
  return {...config,hairStyle:next.hairStyle,appearances:{...config.appearances,[character]:next}};
}
