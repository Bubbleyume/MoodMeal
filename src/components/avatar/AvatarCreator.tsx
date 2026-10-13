import { appearanceFor, selectCharacter, updateAppearance, HAIR_COLORS, EYE_COLORS } from "../../data/avatarAppearance";
import { useState } from "react";
import Avatar from "./Avatar";
import AvatarPreview from "./AvatarPreview";
import AvatarRadioGroup from "./AvatarRadioGroup";
import Button from "../Button";
import { DEFAULT_AVATAR_CONFIG, SKIN_TONES } from "../../data/avatarOptions";
import { AVATAR_MOODS, CHARACTERS, hairOptions, isModular } from "../../data/modularAvatars";
import { normalizeAvatarConfig } from "../../data/avatarMigration";
import type { AvatarConfig } from "../../types/avatar";
import type { EmotionId } from "../../types";
interface AvatarCreatorProps {
  initialConfig?: AvatarConfig;
  mode?: "onboarding" | "edit";
  onSave: (config: AvatarConfig) => void;
  onSkip?: () => void;
}
const optionStyle = (checked: boolean) => `min-w-0 rounded-2xl border p-3 text-center ${checked ? "border-brand-500 bg-brand-50 ring-2 ring-brand-300" : "border-slate-200 bg-white hover:border-brand-200"}`;
export default function AvatarCreator({ initialConfig, mode = "onboarding", onSave, onSkip }: AvatarCreatorProps) {
  const initial = normalizeAvatarConfig(initialConfig) ?? DEFAULT_AVATAR_CONFIG;
  const [draft, setDraft] = useState<AvatarConfig>(initial);
  const [mood, setMood] = useState<EmotionId | "neutral">("neutral");
  const modular = isModular(draft);
  const appearance = appearanceFor(draft, draft.baseStyle === "masculine" ? "masculine" : "feminine");
  const choose = (baseStyle: "feminine" | "masculine") => setDraft(previous => selectCharacter(previous, baseStyle));
  return <div className="mx-auto max-w-lg">
    <AvatarPreview config={draft} emotion={mood === "neutral" ? undefined : mood} size={220} className="mb-4 mt-4" />
    {!modular && <div className="mb-4 rounded-2xl bg-brand-50 p-3 text-sm text-slate-700">
      Your saved avatar is still selected. Choose Soft Frame or Bold Frame to try the new styles, or save to keep your current avatar.
    </div>}
    <h2 id="avatar-character-heading" className="font-display text-sm font-bold text-slate-800">Choose your character</h2>
    {modular ? <AvatarRadioGroup labelledBy="avatar-character-heading" options={CHARACTERS} value={draft.baseStyle as "feminine" | "masculine"}
      onChange={choose} className="mt-3 grid grid-cols-2 gap-3" optionClassName={optionStyle}
      renderOption={option => <><Avatar config={selectCharacter(draft, option.id)} decorative className="h-28 w-full" /><span className="block text-sm font-semibold">{option.label}</span></>} />
      : <div className="mt-3 grid grid-cols-2 gap-3">{CHARACTERS.map(option => <button key={option.id} type="button" onClick={() => choose(option.id)} className={optionStyle(false)}>
        <Avatar config={{...DEFAULT_AVATAR_CONFIG, baseStyle: option.id, hairStyle: hairOptions(option.id)[0].id}} decorative className="h-28 w-full" /><span className="block text-sm font-semibold">{option.label}</span>
      </button>)}</div>}
    {modular && <>
      <h2 id="avatar-tone-heading" className="mt-5 text-sm font-bold text-slate-800">Skin tone</h2>
      <AvatarRadioGroup labelledBy="avatar-tone-heading" options={SKIN_TONES} value={draft.skinTone} onChange={skinTone => setDraft(p => ({...p, skinTone}))}
        className="mt-3 grid grid-cols-3 gap-2" optionClassName={optionStyle} renderOption={option => <>
          <span className="mx-auto block h-8 w-8 rounded-full border border-black/10" style={{backgroundColor: option.hex}} />
          <span className="mt-1 block text-xs font-semibold">{option.label}</span></>} />
      <h2 id="avatar-hair-heading" className="mt-5 text-sm font-bold text-slate-800">Hairstyle</h2>
      <AvatarRadioGroup labelledBy="avatar-hair-heading" options={hairOptions(draft.baseStyle)} value={appearance.hairStyle} onChange={hairStyle => setDraft(p => updateAppearance(p, {hairStyle}))}
        className="mt-3 grid grid-cols-2 gap-3" optionClassName={optionStyle} renderOption={option => <>
          <Avatar config={updateAppearance(draft, {hairStyle: option.id})} decorative variant="bust" className="h-24 w-24" /><span className="block text-sm font-semibold">{option.label}</span></>} />
      <p className="mt-2 text-xs text-slate-500">Bold Frame and Soft Frame each remember their own hairstyle and colors.</p>
      <h2 id="avatar-hair-color-heading" className="mt-5 text-sm font-bold text-slate-800">Hair color</h2>
      <AvatarRadioGroup labelledBy="avatar-hair-color-heading" options={HAIR_COLORS} value={appearance.hairColor}
        onChange={hairColor => setDraft(p => updateAppearance(p, {hairColor}))}
        className="mt-3 grid grid-cols-3 gap-2" optionClassName={optionStyle} renderOption={option => <>
          <span className="mx-auto block h-8 w-8 rounded-full border border-black/10" style={{backgroundColor: HAIR_COLORS.find(c => c.id === option.id)!.hex}} />
          <span className="mt-1 block text-xs font-semibold">{option.label}</span></>} />
      <h2 id="avatar-eye-color-heading" className="mt-5 text-sm font-bold text-slate-800">Eye color</h2>
      <AvatarRadioGroup labelledBy="avatar-eye-color-heading" options={EYE_COLORS} value={appearance.eyeColor}
        onChange={eyeColor => setDraft(p => updateAppearance(p, {eyeColor}))}
        className="mt-3 grid grid-cols-3 gap-2" optionClassName={optionStyle} renderOption={option => <>
          <span className="mx-auto block h-8 w-8 rounded-full border border-black/10" style={{backgroundColor: EYE_COLORS.find(c => c.id === option.id)!.hex}} />
          <span className="mt-1 block text-xs font-semibold">{option.label}</span></>} />
      <div className="mt-4 flex justify-center"><Avatar config={draft} emotion={mood === "neutral" ? undefined : mood} variant="bust" className="h-44 w-44 rounded-3xl bg-white" /></div>
      <label className="mt-5 block text-sm font-bold text-slate-800" htmlFor="avatar-mood-preview">Preview an expression</label>
      <select id="avatar-mood-preview" value={mood} onChange={(e: { target: { value: string } }) => setMood(e.target.value as EmotionId | "neutral")} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-base">
        {AVATAR_MOODS.map(id => <option key={id} value={id}>{id.charAt(0).toUpperCase()+id.slice(1)}</option>)}
      </select>
      <p className="mt-2 text-xs text-slate-500">A preview only. Your avatar follows your mood check-ins.</p>
    </>}
    {initialConfig && !isModular(initialConfig) && modular && <button type="button" className="mt-4 min-h-11 text-sm font-semibold text-brand-700" onClick={() => {setDraft(initial); setMood("neutral");}}>Keep my previous avatar</button>}
    <div className="mt-6 space-y-2 pb-6">
      <Button fullWidth onClick={() => onSave(draft)}>{mode === "edit" ? "Save changes" : "Save my avatar"}</Button>
      {onSkip && <Button fullWidth variant="ghost" onClick={onSkip}>Skip for now</Button>}
    </div>
  </div>;
}
