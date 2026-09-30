/**
 * The user's own avatar — NOT the MoodMeal mascot and NOT the MoodMeal logo.
 * This is MoodMeal's one centralized character renderer: every avatar in
 * the app (Welcome, mood tiles, result hero, Creator, Profile) is drawn
 * here as inline SVG, straight from the three identity fields in `config`
 * plus whichever expression `emotion` maps to
 * (src/data/avatarExpressions.ts). There is no separate asset-resolution
 * layer or file-based renderer — colors, shapes, and layer order all live
 * in this file.
 *
 * Changing `emotion` only ever swaps the eyes/eyebrows/mouth/blush/tears/
 * sweat layer — every other layer reads only from `config`, so the same
 * user looks like the same person across all 12 moods. Base style (body,
 * outfit, pose) and hairstyle are fully independent: any of the 3 base
 * styles renders with any of the 7 hairstyles and any of the 6 skin tones.
 */
import type { EmotionId } from "../../types/index";
import type {
  AvatarConfig,
  EyeShapeKey,
  EyebrowShapeKey,
  MouthShapeKey,
} from "../../types/avatar";
import { SKIN_TONES } from "../../data/avatarOptions";
import { getExpression } from "../../data/avatarExpressions";
import { isLightColor, shade } from "../../lib/color";

/** Head-and-shoulders crop, for small contexts (mood tiles, thumbnails). */
const VIEWBOX_BUST = "0 0 200 220";
/** Full standing figure. The top 220 units match the bust crop exactly. */
const VIEWBOX_FULL = "0 0 200 310";

// Fixed, non-editable parts of the character. Hair color is intentionally
// not part of AvatarConfig in Phase 1 — every hairstyle uses this one tone.
const HAIR_HEX = "#3d2a24";
const EYE_HEX = "#4a2f1a";
const EYE_SCALE = 1.1;
const EYE_SPACING = 24;
const EYEBROW_WIDTH = 3.5;
const EYEBROW_ARCH = 0;
const HEAD_PATH = "M100 48c29 0 48 21 48 48s-20 50-48 50-48-23-48-50 19-48 48-48Z";

function skinHexFor(skinTone: AvatarConfig["skinTone"]): string {
  return SKIN_TONES.find((t) => t.id === skinTone)?.hex ?? "#c68a5b";
}

/**
 * Facial line-art color adapts to skin luma so features stay readable
 * across the whole range — a fixed dark ink nearly disappears against the
 * two deepest tones.
 */
function inkFor(skinHex: string): string {
  return isLightColor(skinHex, 115) ? "#3a2a4a" : "#fbeee2";
}

export interface AvatarProps {
  config: AvatarConfig;
  /** Which of MoodMeal's 12 moods to express. Defaults to a neutral-happy face. */
  emotion?: EmotionId;
  className?: string;
  /**
   * Set when adjacent visible text already names the mood/user (a mood
   * tile's label, a result screen's heading, a labelled radio option) so
   * the avatar itself is hidden from assistive tech instead of being
   * announced redundantly. Defaults to false: a standalone avatar keeps a
   * real accessible name.
   */
  decorative?: boolean;
  /**
   * "full" (default) shows the whole standing figure. "bust" crops to
   * head+shoulders for small contexts where only the face needs to read.
   * A pure display choice, not a config field.
   */
  variant?: "full" | "bust";
}

// --- Hair ----------------------------------------------------------------
// Split into a back layer (drawn behind the body, for long styles) and a
// front layer (over the forehead/ears).

function renderHairBack(hairStyle: AvatarConfig["hairStyle"], hairHex: string) {
  switch (hairStyle) {
    case "long-wavy":
      return (
        <>
          <path
            d="M55 82c-11 32-9 74 3 110h20c-8-30-9-72-2-104-2 6-8 8-10 2-2 8-9 6-11-8Z"
            fill={hairHex}
          />
          <path
            d="M145 82c11 32 9 74-3 110h-20c8-30 9-72 2-104 2 6 8 8 10 2 2 8 9 6 11-8Z"
            fill={hairHex}
          />
        </>
      );
    case "straight":
      return (
        <>
          <path d="M54 76c-7 28-6 72 2 116h25c-6-39-6-78 0-112Z" fill={hairHex} />
          <path d="M146 76c7 28 6 72-2 116h-25c6-39 6-78 0-112Z" fill={hairHex} />
        </>
      );
    case "braids":
      return (
        <>
          <path d="M62 86c-6 8-8 20-6 32 2 14 8 26 8 60h16c-2-34-6-46-8-60-2-12-2-22 2-32Z" fill={hairHex} />
          <path d="M138 86c6 8 8 20 6 32-2 14-8 26-8 60h-16c2-34 6-46 8-60 2-12 2-22-2-32Z" fill={hairHex} />
          {[104, 122, 140, 158].map((y) => (
            <g key={y}>
              <line x1="64" y1={y} x2="76" y2={y} stroke={shade(hairHex, 0.25)} strokeWidth={2} />
              <line x1="124" y1={y} x2="136" y2={y} stroke={shade(hairHex, 0.25)} strokeWidth={2} />
            </g>
          ))}
        </>
      );
    // Short styles, buzz cut, and bald don't extend past the head
    // silhouette, so (like every style here before Phase 2C) they have no
    // back layer.
    default:
      return null;
  }
}

function renderHairFront(hairStyle: AvatarConfig["hairStyle"], hairHex: string) {
  const cap = (
    <path
      d="M53 92c-2-31 19-52 47-52s49 21 47 52c-8-15-25-21-47-21s-39 6-47 21Z"
      fill={hairHex}
    />
  );
  const smallCap = (
    <path
      d="M58 88c0-24 15-38 42-38s42 14 42 38c-7-10-21-14-42-14s-35 4-42 14Z"
      fill={hairHex}
    />
  );
  const curlyPuffs = (
    <>
      {[
        [56, 68],
        [72, 54],
        [90, 46],
        [110, 46],
        [128, 54],
        [144, 68],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={15} fill={hairHex} />
      ))}
    </>
  );
  switch (hairStyle) {
    case "buzz-cut":
      return smallCap;
    case "short-straight":
      return (
        <>
          {smallCap}
          <path d="M59 73c8-18 25-27 48-25-11 5-18 13-23 25-8-4-16-4-25 0Z" fill={hairHex} />
        </>
      );
    case "short-curly":
      return curlyPuffs;
    case "bald":
      return null;
    case "long-wavy":
      return (
        <>
          {cap}
          <path d="M70 50q6 6 0 12M130 50q-6 6 0 12" fill="none" stroke={shade(hairHex, 0.3)} strokeWidth={2} strokeLinecap="round" />
        </>
      );
    case "braids":
      return (
        <>
          {cap}
          <line x1="100" y1="44" x2="100" y2="66" stroke={shade(hairHex, 0.3)} strokeWidth={2} />
        </>
      );
    case "straight":
      return (
        <>
          {cap}
          <path d="M100 42v28" fill="none" stroke={shade(hairHex, 0.3)} strokeWidth={2} />
          <path d="M59 70c12-5 24-9 41-8M141 70c-12-5-24-9-41-8" fill="none" stroke={shade(hairHex, 0.2)} strokeWidth={1.8} />
        </>
      );
    default:
      return cap;
  }
}

// --- Base styles ---------------------------------------------------------
// Each base style owns only its body silhouette, outfit, and pose. The head,
// face, and hair are shared, so hairstyle never depends on base style.

function renderBaseBody(baseStyle: AvatarConfig["baseStyle"], skinHex: string) {
  const skinShade = shade(skinHex, 0.18);
  const shoes = (
    <>
      <path d="M61 278c8-3 20-3 28 1l5 9c-8 5-25 5-36 1Z" fill="#fff" stroke="#2f3138" strokeWidth={2.2} />
      <path d="M139 278c-8-3-20-3-28 1l-5 9c8 5 25 5 36 1Z" fill="#fff" stroke="#2f3138" strokeWidth={2.2} />
      <path d="M63 286h29M108 286h29" stroke="#777b84" strokeWidth={1.5} strokeLinecap="round" />
    </>
  );
  const shirtMark = (color: string) => (
    <g fill="none" stroke={color} strokeLinecap="round">
      <circle cx="94" cy="181" r="1.7" fill={color} stroke="none" />
      <circle cx="106" cy="181" r="1.7" fill={color} stroke="none" />
      <path d="M91 188q9 9 18 0" strokeWidth={2.2} />
    </g>
  );

  switch (baseStyle) {
    case "masculine":
      return (
        <g data-base-style="masculine">
          {/* relaxed hoodie pose, hands tucked into the front pocket */}
          <path d="M73 157c-12 5-19 17-20 35l4 36h24l4-55Z" fill="#25252a" stroke="#17171b" strokeWidth={2} />
          <path d="M127 157c12 5 19 17 20 35l-4 36h-24l-4-55Z" fill="#25252a" stroke="#17171b" strokeWidth={2} />
          <path d="M70 153c9-8 19-12 30-12s21 4 30 12l7 70H63Z" fill="#25252a" stroke="#17171b" strokeWidth={2.2} />
          <path d="M82 151q18 20 36 0-4-13-18-15-14 2-18 15Z" fill="#1d1d21" stroke="#111114" strokeWidth={1.5} />
          <path d="M77 197q23-10 46 0l-7 22H84Z" fill="#303036" stroke="#17171b" strokeWidth={1.4} />
          <path d="M91 200q9 7 18 0" fill="none" stroke={skinShade} strokeWidth={5.5} strokeLinecap="round" />
          <path d="M71 220h28l-5 63H66Z" fill="#596547" stroke="#303a27" strokeWidth={2} />
          <path d="M101 220h28l5 63h-28Z" fill="#596547" stroke="#303a27" strokeWidth={2} />
          <path d="M67 240h18v16H68M133 240h-18v16h17" fill="#4d583d" stroke="#303a27" strokeWidth={1.3} />
          {shoes}
        </g>
      );
    case "androgynous":
      return (
        <g data-base-style="androgynous">
          {/* neutral straight pose with a cream tee and purple cargo pants */}
          <path d="M72 160c-8 8-12 24-13 45-1 14-2 24-5 30-2 4-1 8 3 9 5 1 8-3 10-8 5-15 9-35 12-58Z" fill={skinHex} stroke={skinShade} strokeWidth={2} />
          <path d="M128 160c8 8 12 24 13 45 1 14 2 24 5 30 2 4 1 8-3 9-5 1-8-3-10-8-5-15-9-35-12-58Z" fill={skinHex} stroke={skinShade} strokeWidth={2} />
          <path d="M72 153c9-8 18-12 28-12s19 4 28 12l7 67H65Z" fill="#fffaf0" stroke="#d6d0c5" strokeWidth={2} />
          <path d="M86 143q14 16 28 0" fill="none" stroke="#7c3aed" strokeWidth={3} strokeLinecap="round" />
          <path d="M63 156l15-8 5 22-17 7ZM137 156l-15-8-5 22 17 7Z" fill="#fffaf0" stroke="#d6d0c5" strokeWidth={2} />
          <g transform="translate(0 2)">{shirtMark("#7c3aed")}</g>
          <path d="M68 220h31l-5 63H63Z" fill="#7652ad" stroke="#4d3379" strokeWidth={2} />
          <path d="M101 220h31l5 63h-31Z" fill="#7652ad" stroke="#4d3379" strokeWidth={2} />
          <path d="M64 239h19v17H65M136 239h-19v17h18" fill="#67479a" stroke="#4d3379" strokeWidth={1.3} />
          {shoes}
        </g>
      );
    case "feminine":
    default:
      return (
        <g data-base-style="feminine">
          {/* open relaxed pose with fitted MoodMeal tee and cuffed jeans */}
          <path d="M72 159c-9 7-12 22-15 38-3 17-7 28-14 34-4 3-4 7-1 9 4 3 10-1 14-4 8-7 13-21 18-40l7-29Z" fill={skinHex} stroke={skinShade} strokeWidth={2} strokeLinejoin="round" />
          <path d="M128 159c9 7 12 22 15 38 3 17 7 28 14 34 4 3 4 7 1 9-4 3-10-1-14-4-8-7-13-21-18-40l-7-29Z" fill={skinHex} stroke={skinShade} strokeWidth={2} strokeLinejoin="round" />
          <path d="M72 153c8-8 18-12 28-12s20 4 28 12l8 66c-19 6-53 6-72 0Z" fill="#c95ce6" stroke="#7c3aed" strokeWidth={2.2} />
          <path d="M64 156l15-9 6 24-19 8ZM136 156l-15-9-6 24 19 8Z" fill="#c95ce6" stroke="#7c3aed" strokeWidth={2} />
          <path d="M86 143q14 16 28 0" fill="none" stroke="#8b3fc1" strokeWidth={3} strokeLinecap="round" />
          {shirtMark("#fff")}
          <path d="M68 219h31l-5 62H66Z" fill="#5b7fa6" stroke="#294b69" strokeWidth={2} />
          <path d="M101 219h31l2 62h-28Z" fill="#5b7fa6" stroke="#294b69" strokeWidth={2} />
          <path d="M66 270h28v12H66ZM106 270h28v12h-28Z" fill="#7898b4" stroke="#294b69" strokeWidth={1.4} />
          {shoes}
        </g>
      );
  }
}

// --- Eyes / eyebrows / mouth (the expression layer) -----------------------
// Eyes use a fixed eye color; eyebrows and mouth use the skin-adaptive ink
// color so they stay legible on every skin tone.

/** Shapes drawn as fully open circles can play a brief, synced blink. */
const BLINKABLE_EYE_SHAPES: EyeShapeKey[] = ["wide", "worried-wide"];

function eyeContent({
  shape,
  cx,
  cy,
  scale,
  eyeHex,
  ink,
}: {
  shape: EyeShapeKey;
  cx: number;
  cy: number;
  scale: number;
  eyeHex: string;
  ink: string;
}) {
  const r = 9 * scale;
  switch (shape) {
    case "happy-arc":
      return <path d={`M${cx - r},${cy} Q${cx},${cy - r * 1.3} ${cx + r},${cy}`} fill="none" stroke={ink} strokeWidth={3.2} strokeLinecap="round" />;
    case "gentle-down":
      return <path d={`M${cx - r},${cy - 3} Q${cx},${cy + r * 0.8} ${cx + r},${cy - 3}`} fill="none" stroke={ink} strokeWidth={3.2} strokeLinecap="round" />;
    case "sleepy":
      return (
        <>
          <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke={ink} strokeWidth={3.2} strokeLinecap="round" />
          <path d={`M${cx - r},${cy - 4} Q${cx},${cy - 8} ${cx + r},${cy - 4}`} fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" opacity={0.5} />
        </>
      );
    case "wide":
      return (
        <>
          <circle cx={cx} cy={cy} r={r} fill="#fff" stroke={ink} strokeWidth={2} />
          <circle cx={cx} cy={cy} r={r * 0.58} fill={eyeHex} />
          <circle cx={cx} cy={cy} r={r * 0.58} fill="none" stroke={ink} strokeWidth={1} />
          <circle cx={cx - r * 0.2} cy={cy - r * 0.25} r={r * 0.18} fill="#fff" opacity={0.9} />
        </>
      );
    case "worried-wide":
      return (
        <>
          <circle cx={cx} cy={cy} r={r} fill="#fff" stroke={ink} strokeWidth={2} />
          <circle cx={cx} cy={cy - r * 0.15} r={r * 0.42} fill={eyeHex} />
        </>
      );
    case "squint":
      return <ellipse cx={cx} cy={cy} rx={r} ry={2.5} fill={ink} />;
    case "half-lidded":
      return (
        <>
          <circle cx={cx} cy={cy} r={r * 0.8} fill="#fff" stroke={ink} strokeWidth={2} />
          <circle cx={cx} cy={cy} r={r * 0.44} fill={eyeHex} />
          <path d={`M${cx - r},${cy - r * 0.8} Q${cx},${cy - r * 0.2} ${cx + r},${cy - r * 0.8} L${cx + r},${cy - r} L${cx - r},${cy - r} Z`} fill="#fce7f3" />
        </>
      );
    case "nervous-wave":
      return (
        <path
          d={`M${cx - r},${cy} Q${cx - r * 0.5},${cy - 4} ${cx},${cy} Q${cx + r * 0.5},${cy + 4} ${cx + r},${cy}`}
          fill="none"
          stroke={ink}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      );
    case "spiral-playful":
      return (
        <path
          d={`M${cx},${cy - 4} a4,4 0 1 1 -4,4 a2,2 0 1 0 2,-2`}
          fill="none"
          stroke={ink}
          strokeWidth={2}
          strokeLinecap="round"
        />
      );
    default:
      return <circle cx={cx} cy={cy} r={r * 0.5} fill={ink} />;
  }
}

function Eye(props: { shape: EyeShapeKey; cx: number; cy: number; scale: number; eyeHex: string; ink: string }) {
  const content = eyeContent(props);
  if (!BLINKABLE_EYE_SHAPES.includes(props.shape)) return <>{content}</>;
  return (
    <g className="motion-safe:animate-mm-blink" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
      {content}
    </g>
  );
}

function Eyebrow({
  shape,
  cx,
  cy,
  side,
  width,
  arch,
  ink,
}: {
  shape: EyebrowShapeKey;
  cx: number;
  cy: number;
  side: "left" | "right";
  width: number;
  arch: number;
  ink: string;
}) {
  const dir = side === "left" ? -1 : 1;
  const outerX = cx - dir * 9;
  const innerX = cx + dir * 9;
  switch (shape) {
    case "relaxed":
      return <path d={`M${outerX},${cy + 1} Q${cx},${cy - 2 - arch} ${innerX},${cy + 1}`} fill="none" stroke={ink} strokeWidth={width} strokeLinecap="round" />;
    case "raised":
      return <path d={`M${outerX},${cy - 3} Q${cx},${cy - 6 - arch} ${innerX},${cy - 3}`} fill="none" stroke={ink} strokeWidth={width} strokeLinecap="round" />;
    case "raised-inner":
      return <path d={`M${outerX},${cy + 2} Q${cx},${cy - 1} ${innerX},${cy - 6}`} fill="none" stroke={ink} strokeWidth={width} strokeLinecap="round" />;
    case "raised-inner-angled":
      return <path d={`M${outerX},${cy + 3} L${innerX},${cy - 7}`} fill="none" stroke={ink} strokeWidth={width} strokeLinecap="round" />;
    case "lowered":
      return <path d={`M${outerX},${cy - 2} L${innerX},${cy + 4}`} fill="none" stroke={ink} strokeWidth={width} strokeLinecap="round" />;
    case "worried":
      return <path d={`M${outerX},${cy + 1} Q${cx},${cy - 3} ${innerX},${cy - 5}`} fill="none" stroke={ink} strokeWidth={width} strokeLinecap="round" />;
    case "playful":
      return <path d={`M${outerX},${cy} Q${cx - dir * 3},${cy - 6} ${cx},${cy - 1} Q${cx + dir * 3},${cy + 3} ${innerX},${cy - 2}`} fill="none" stroke={ink} strokeWidth={Math.max(2, width - 1)} strokeLinecap="round" />;
    case "flat":
      return <line x1={outerX} y1={cy} x2={innerX} y2={cy} stroke={ink} strokeWidth={width} strokeLinecap="round" />;
    default:
      return <line x1={outerX} y1={cy} x2={innerX} y2={cy} stroke={ink} strokeWidth={width} strokeLinecap="round" />;
  }
}

function Mouth({ shape, x, y, ink }: { shape: MouthShapeKey; x: number; y: number; ink: string }) {
  switch (shape) {
    case "smile-big":
      return <path d={`M${x - 14},${y} Q${x},${y + 13} ${x + 14},${y}`} fill="none" stroke={ink} strokeWidth={3.5} strokeLinecap="round" />;
    case "grin-big-open":
      return (
        <>
          <path d={`M${x - 15},${y - 2} Q${x},${y + 16} ${x + 15},${y - 2} Q${x},${y + 6} ${x - 15},${y - 2}Z`} fill={ink} />
          <path d={`M${x - 10},${y} Q${x},${y + 4} ${x + 10},${y}`} fill="#fff" opacity={0.9} />
        </>
      );
    case "small-smile":
      return <path d={`M${x - 6},${y} Q${x},${y + 5} ${x + 6},${y}`} fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />;
    case "frown":
      return <path d={`M${x - 12},${y + 6} Q${x},${y - 4} ${x + 12},${y + 6}`} fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />;
    case "frown-sharp":
      return <path d={`M${x - 12},${y - 2} L${x},${y + 8} L${x + 12},${y - 2}`} fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />;
    case "flat-yawn":
      return <ellipse cx={x} cy={y + 2} rx={7} ry={9} fill={ink} />;
    case "open-o-small":
      return <circle cx={x} cy={y} r={5.5} fill={ink} />;
    case "wavy":
      return <path d={`M${x - 12},${y} Q${x - 6},${y - 5} ${x},${y} Q${x + 6},${y + 5} ${x + 12},${y}`} fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />;
    case "flat":
      return <line x1={x - 10} y1={y} x2={x + 10} y2={y} stroke={ink} strokeWidth={3} strokeLinecap="round" />;
    case "tongue":
      return (
        <>
          <path d={`M${x - 13},${y - 1} Q${x},${y + 14} ${x + 13},${y - 1} Q${x},${y + 5} ${x - 13},${y - 1}Z`} fill={ink} />
          <ellipse cx={x} cy={y + 8} rx={5} ry={5} fill="#f472b6" />
        </>
      );
    case "concerned":
      return <path d={`M${x - 10},${y - 2} Q${x},${y + 3} ${x + 10},${y - 2}`} fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />;
    case "uncomfortable-wavy":
      return <path d={`M${x - 12},${y - 1} Q${x - 7},${y + 5} ${x - 2},${y} Q${x + 4},${y - 6} ${x + 12},${y + 2}`} fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />;
    default:
      return <line x1={x - 8} y1={y} x2={x + 8} y2={y} stroke={ink} strokeWidth={3} strokeLinecap="round" />;
  }
}

// --- Main component ---------------------------------------------------

export default function Avatar({ config, emotion = "happy", className, decorative = false, variant = "full" }: AvatarProps) {
  const expr = getExpression(emotion);
  const skinHex = skinHexFor(config.skinTone);
  const ink = inkFor(skinHex);

  const eyeY = 98;
  const leftEyeX = 100 - EYE_SPACING / 2;
  const rightEyeX = 100 + EYE_SPACING / 2;
  const browY = eyeY - 15;
  const mouthX = 100;
  const mouthY = 130;

  const a11yProps = decorative
    ? { "aria-hidden": true as const }
    : { role: "img" as const, "aria-label": `Your avatar, ${emotion} expression` };

  return (
    <svg
      viewBox={variant === "bust" ? VIEWBOX_BUST : VIEWBOX_FULL}
      className={className}
      data-avatar="true"
      data-emotion={emotion}
      data-base-style={config.baseStyle}
      data-skin-tone={config.skinTone}
      data-hair-style={config.hairStyle}
      {...a11yProps}
    >
      {/* ground shadow — under the bust crop, or under the feet */}
      <ellipse
        cx="100"
        cy={variant === "bust" ? 212 : 302}
        rx={variant === "bust" ? 44 : 70}
        ry={variant === "bust" ? 6 : 7}
        fill="#2e1065"
        opacity="0.12"
      />

      {/* hair drawn behind the head/body for long styles */}
      {renderHairBack(config.hairStyle, HAIR_HEX)}

      {/* body, outfit, and pose for the selected base style */}
      {renderBaseBody(config.baseStyle, skinHex)}

      {/* neck */}
      <rect x="88" y="132" width="24" height="24" rx="6" fill={skinHex} />

      {/* head */}
      <path d={HEAD_PATH} fill={skinHex} />

      {/* ears */}
      <circle cx="55" cy="98" r="8" fill={skinHex} stroke={shade(skinHex, 0.12)} strokeWidth={1} />
      <circle cx="145" cy="98" r="8" fill={skinHex} stroke={shade(skinHex, 0.12)} strokeWidth={1} />

      {expr.blush && (
        <>
          <ellipse cx="72" cy="112" rx="8" ry="5" fill="#f472b6" opacity={0.45} />
          <ellipse cx="128" cy="112" rx="8" ry="5" fill="#f472b6" opacity={0.45} />
        </>
      )}

      {/* eyebrows */}
      <Eyebrow shape={expr.eyebrows} cx={leftEyeX} cy={browY} side="left" width={EYEBROW_WIDTH} arch={EYEBROW_ARCH} ink={ink} />
      <Eyebrow shape={expr.eyebrows} cx={rightEyeX} cy={browY} side="right" width={EYEBROW_WIDTH} arch={EYEBROW_ARCH} ink={ink} />

      {/* eyes */}
      <Eye shape={expr.eyes} cx={leftEyeX} cy={eyeY} scale={EYE_SCALE} eyeHex={EYE_HEX} ink={ink} />
      <Eye shape={expr.eyes} cx={rightEyeX} cy={eyeY} scale={EYE_SCALE} eyeHex={EYE_HEX} ink={ink} />

      {expr.tears && (
        <>
          <path d={`M${leftEyeX - 2},${eyeY + 6} q-2,8 0,12 q2,-2 2,-6 q0,-3 -2,-6Z`} fill="#7dd3fc" opacity={0.85} />
          <path d={`M${rightEyeX + 2},${eyeY + 6} q2,8 0,12 q-2,-2 -2,-6 q0,-3 2,-6Z`} fill="#7dd3fc" opacity={0.85} />
        </>
      )}
      {expr.sweatDrop && (
        <path d="M132 82 q5,7 0,12 q-5,-5 0,-12Z" fill="#7dd3fc" opacity={0.85} />
      )}

      {/* mouth */}
      <Mouth shape={expr.mouth} x={mouthX} y={mouthY} ink={ink} />

      {/* hair, front layer (over forehead/ears) */}
      {renderHairFront(config.hairStyle, HAIR_HEX)}
    </svg>
  );
}
