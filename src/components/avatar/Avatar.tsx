import { useEffect, useState } from "react";
import type { AvatarConfig } from "../../types/avatar";
import type { EmotionId } from "../../types";
import { avatarSource, avatarLayers, isModular, getAvatarLabel } from "../../data/modularAvatars";
export interface AvatarProps {
  config: AvatarConfig;
  emotion?: EmotionId;
  className?: string;
  decorative?: boolean;
  variant?: "full" | "bust";
}
export default function Avatar(props: AvatarProps) {
  const {config, emotion} = props;
  return isModular(config)
    ? <LayeredAvatar key={`${config.baseStyle}/${config.skinTone}/${config.hairStyle}/${emotion}`} {...props} />
    : <LegacyAvatar key={avatarSource(config)} {...props} />;
}
function LegacyAvatar({config, className = "", decorative, variant}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  return <span data-avatar="true" className={`relative inline-block overflow-hidden ${className}`}
    role={decorative ? undefined : "img"} aria-label={decorative ? undefined : failed ? "Avatar unavailable" : `${getAvatarLabel(config)} avatar`} aria-hidden={decorative || undefined}>
    {failed ? <span aria-hidden="true">♡</span> : <img src={avatarSource(config)} alt="" draggable={false} onError={() => setFailed(true)}
      className={variant === "bust" ? "absolute h-auto max-w-none" : "h-full w-full object-contain"}
      style={variant === "bust" ? {width:"200%",left:"-50%",top:"-3%"} : undefined} />}
  </span>;
}
const loaded = new Map<string, Promise<void>>();
function preload(src: string): Promise<void> {
  const cached = loaded.get(src);
  if (cached) return cached;
  const promise = new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => { loaded.delete(src); reject(new Error("Avatar layer unavailable")); };
    image.src = src;
  });
  loaded.set(src, promise);
  return promise;
}
function LayeredAvatar({config, emotion, className = "", decorative, variant}: AvatarProps) {
  const [state, setState] = useState<"loading" | "ready" | "neutral-loading" | "neutral" | "unavailable">("loading");
  const neutral = state === "neutral" || state === "neutral-loading" || (state === "unavailable" && Boolean(emotion));
  const layers = avatarLayers(config, neutral ? "neutral" : emotion);
  const sources = layers.map(layer => layer.src).join("|");
  useEffect(() => {
    let active = true;
    Promise.all(sources.split("|").map(preload)).then(() => {
      if (active) setState(neutral ? "neutral" : "ready");
    }).catch(() => {
      if (active) setState(emotion && !neutral ? "neutral-loading" : "unavailable");
    });
    return () => {active = false;};
  }, [sources, emotion, neutral]);
  const label = state === "unavailable" ? "Avatar unavailable" : `${getAvatarLabel(config)} avatar${emotion && !neutral ? `, ${emotion}` : ""}`;
  return <span data-avatar="true" data-avatar-state={state} className={`relative inline-block overflow-hidden ${className}`}
    role={decorative ? undefined : "img"} aria-label={decorative ? undefined : label} aria-hidden={decorative || undefined}>
    {state === "ready" || state === "neutral" ? layers.map(layer => <img key={layer.part} data-avatar-part={layer.part} src={layer.src} alt="" draggable={false}
      className={variant === "bust" ? "absolute h-auto max-w-none" : "absolute inset-0 h-full w-full object-contain"}
      // The male master has a lower chin on its canvas. Shift every layer
      // together so bust thumbnails retain the whole face.
      style={{filter:layer.filter,...(variant === "bust" ? {width:"200%",left:"-50%",top:config.baseStyle === "masculine" ? "-12%" : "-3%"} : {})}} />)
      : <span className="flex h-full w-full items-center justify-center rounded-full bg-brand-100 text-brand-700" aria-hidden="true">{state === "unavailable" ? "♡" : ""}</span>}
  </span>;
}
