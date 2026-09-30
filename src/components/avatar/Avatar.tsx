/**
 * The user's own avatar — NOT the MoodMeal mascot and NOT the MoodMeal logo.
 * This is MoodMeal's one centralized character renderer: every avatar in
 * the app (Welcome, mood tiles, result hero, Creator, Profile) is drawn
 * here as inline SVG from the three identity fields in `config` plus the
 * expression that `emotion` maps to (src/data/avatarExpressions.ts).
 *
 * Art system (Avatar Redesign Phase 2):
 *   - One illustration family: every character shares the same head, face,
 *     proportions (~4 heads tall), relaxed standing pose, outline weight,
 *     top-left lighting, and outfit (white MoodMeal tee, blue jeans, white
 *     sneakers). Shapes are flat fills with a darker same-hue outline and
 *     hand-placed shadow/highlight shapes — no gradients or filters, so
 *     many avatars on one screen stay cheap and need no unique SVG ids.
 *   - Base style is a small set of proportions (STYLE_SHAPE): shoulder,
 *     waist, neck, jaw, and brow weight. The pose, face, and outfit never
 *     change, so the three styles read as one family, not stereotypes.
 *   - Skin tone selects a hand-tuned palette (SKIN_PALETTES) with its own
 *     shadow, highlight, outline, lip, and cheek colors, so light tones keep
 *     their warmth and deep tones keep visible form. Facial features are
 *     identical across tones.
 *   - Each hairstyle is a back layer (behind head and body) plus a front
 *     layer (over the scalp and shoulders), shaped to sit on the shared
 *     head so it works with every base style.
 *   - `variant="bust"` crops to head and shoulders at the same aspect ratio,
 *     so the face stays readable in 32–56px contexts.
 */
import type { ReactNode } from "react";
import type { EmotionId } from "../../types/index";
import type {
  AvatarConfig,
  BaseStyleId,
  EyeShapeKey,
  EyebrowShapeKey,
  HairStyleId,
  MouthShapeKey,
  SkinToneId,
} from "../../types/avatar";
import { SKIN_TONES } from "../../data/avatarOptions";
import { getExpression } from "../../data/avatarExpressions";

/** Full standing figure. */
const VIEWBOX_FULL = "0 0 200 310";
/** Head and shoulders, same 200:220 aspect ratio as the full-width bust. */
const VIEWBOX_BUST = "38 12 124 136.4";

const LINE = 1.4;

// --- Palettes -------------------------------------------------------------

interface SkinPalette {
  base: string;
  shadow: string;
  highlight: string;
  line: string;
  lip: string;
  cheek: string;
  /** Brow color — darker on deeper tones so brows never vanish into the skin. */
  brow: string;
}

/** Hand-tuned per tone. `base` comes from the Creator swatch in avatarOptions. */
const SKIN_PALETTES: Record<SkinToneId, Omit<SkinPalette, "base">> = {
  fair: { shadow: "#eab595", highlight: "#fff0e4", line: "#c28466", lip: "#c9776d", cheek: "#f29a93", brow: "#2e1c16" },
  light: { shadow: "#d49c72", highlight: "#f9dcc2", line: "#a8704e", lip: "#b8664f", cheek: "#ea8c79", brow: "#2a1914" },
  medium: { shadow: "#ad7249", highlight: "#dcaa80", line: "#7e4d2f", lip: "#8f4c38", cheek: "#d9786a", brow: "#23140f" },
  tan: { shadow: "#8b5431", highlight: "#bf865b", line: "#5d361f", lip: "#6a3326", cheek: "#c16655", brow: "#1c100b" },
  deep: { shadow: "#65391f", highlight: "#a06c46", line: "#3a2011", lip: "#3a170e", cheek: "#a3503f", brow: "#140a06" },
  rich: { shadow: "#3f2314", highlight: "#84573a", line: "#1c0d06", lip: "#200b05", cheek: "#8c4433", brow: "#0b0503" },
};

function skinPalette(tone: SkinToneId): SkinPalette {
  const base = SKIN_TONES.find((t) => t.id === tone)?.hex ?? "#c98e62";
  return { base, ...(SKIN_PALETTES[tone] ?? SKIN_PALETTES.medium) };
}

const HAIR = { base: "#3b2620", shadow: "#27171a", highlight: "#6e4a3b", line: "#1a0f0c" };
const SHIRT = { base: "#ffffff", shadow: "#e9e6f1", line: "#bdb5cf" };
const JEANS = { base: "#5079ad", shadow: "#3f6392", line: "#2c4669", stitch: "#8fb0d6" };
const SHOE = { base: "#ffffff", sole: "#e4e0ec", line: "#b3abc4", accent: "#a78bfa" };
const EYE = { white: "#ffffff", iris: "#4a2f20", pupil: "#1b110d", lid: "#24160f" };
const MOUTH = { inside: "#5b2230", teeth: "#ffffff", tongue: "#ec7f93" };

// --- Base-style proportions ----------------------------------------------

interface StyleShape {
  shoulder: number;
  waist: number;
  hip: number;
  neck: number;
  /** 0 = softest jaw; higher is slightly squarer. */
  jaw: number;
  brow: number;
  hem: number;
}

const STYLE_SHAPE: Record<BaseStyleId, StyleShape> = {
  feminine: { shoulder: 29, waist: 22, hip: 27.5, neck: 7, jaw: 0, brow: 2.6, hem: 184 },
  androgynous: { shoulder: 31.5, waist: 25, hip: 27.5, neck: 7.5, jaw: 1.6, brow: 2.9, hem: 186 },
  masculine: { shoulder: 34, waist: 27.5, hip: 28, neck: 8.5, jaw: 3, brow: 3.2, hem: 187 },
};

// Face anchor points (shared by every style so hair always lines up).
const EYE_Y = 65;
const EYE_L = 87.5;
const EYE_R = 112.5;
const BROW_Y = 55.5;
const MOUTH_Y = 84;

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

// --- Body -------------------------------------------------------------------

function headPath(jaw: number): string {
  return [
    "M100 28",
    "C121 28 134 42 134 61",
    `C134 ${74 + jaw * 0.4} ${130 + jaw * 0.6} ${84 + jaw * 0.6} ${122 + jaw} 90.5`,
    "C115 95.5 108 97.5 100 97.5",
    `C92 97.5 85 95.5 ${78 - jaw} 90.5`,
    `C${70 - jaw * 0.6} ${84 + jaw * 0.6} 66 ${74 + jaw * 0.4} 66 61`,
    "C66 42 79 28 100 28Z",
  ].join(" ");
}

function Legs({ s }: { s: StyleShape }) {
  const L = 100 - s.hip;
  const R = 100 + s.hip;
  const top = s.hem - 8;
  const jeans = [
    `M${L} ${top}H${R}`,
    `L${R + 0.5} 202C${R - 0.5} 230 ${R - 2} 258 ${R - 4} 284`,
    "H103.2C103 262 103.2 236 102.4 214Q100 208 97.6 214",
    "C96.8 236 97 262 96.8 284",
    `H${L + 4}C${L + 2} 258 ${L + 0.5} 230 ${L - 0.5} 202Z`,
  ].join("");
  return (
    <g>
      <path d={jeans} fill={JEANS.base} stroke={JEANS.line} strokeWidth={LINE} strokeLinejoin="round" />
      {/* inner-leg shading, lit from the top left */}
      <path d={`M102.4 214C103.2 236 103 262 103.2 284H${R - 12}C${R - 11} 262 ${R - 11} 238 ${R - 13} 214Z`} fill={JEANS.shadow} opacity={0.55} />
      <path d={`M97.6 214C96.8 236 97 262 96.8 284H${L + 9}C${L + 8} 262 ${L + 8} 238 ${L + 10} 214Z`} fill={JEANS.shadow} opacity={0.35} />
      {/* fly seam, knee creases, and cuffs */}
      <path d={`M100 ${s.hem}V208`} stroke={JEANS.line} strokeWidth={1} opacity={0.6} />
      <path d={`M${L + 1.5} 247q4 1.5 8 0M${R - 1.5} 247q-4 1.5-8 0`} stroke={JEANS.line} strokeWidth={0.9} fill="none" opacity={0.5} />
      <path d={`M${L + 3.6} 276H96.9M103.1 276H${R - 3.6}`} stroke={JEANS.stitch} strokeWidth={1} strokeDasharray="1.6 1.4" />
    </g>
  );
}

function Shoes({ s }: { s: StyleShape }) {
  const L = 100 - s.hip;
  const R = 100 + s.hip;
  const shoe = (x0: number, x1: number, dir: 1 | -1) => {
    // x0 = outer (toe) side, x1 = inner side; toes angle slightly outward.
    const toe = x0 - dir * 3;
    return (
      <g>
        <path
          d={`M${x1} 283C${x1 + dir * 0.5} 287 ${x1 + dir * 0.5} 292 ${x1 - dir * 1} 296H${toe}C${toe - dir * 1.5} 294 ${toe - dir * 1} 290 ${x0 + dir * 1} 288C${x0 + dir * 3} 286 ${x0 + dir * 4} 283 ${x0 + dir * 4} 283Z`}
          fill={SHOE.base}
          stroke={SHOE.line}
          strokeWidth={LINE}
          strokeLinejoin="round"
        />
        <path d={`M${x1 - dir * 1} 296H${toe}l${dir * 0.4}-2.6H${x1 - dir * 0.2}Z`} fill={SHOE.sole} />
        <path d={`M${x1 - dir * 1} 296H${toe}`} stroke={SHOE.line} strokeWidth={LINE} strokeLinecap="round" />
        <path d={`M${x1 - dir * 3} 290.5q${-dir * 5}-2 ${-dir * 10}-0.5`} stroke={SHOE.accent} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      </g>
    );
  };
  return (
    <g>
      {shoe(L + 3, 97.3, 1)}
      {shoe(R - 3, 102.7, -1)}
    </g>
  );
}

function Arm({ s, side, skin }: { s: StyleShape; side: 1 | -1; skin: SkinPalette }) {
  // side -1 = viewer's left, +1 = viewer's right; dx grows outward.
  // Relaxed hang: the arm leaves the sleeve slightly away from the body,
  // softens at the elbow, and the forearm drifts back toward the thigh.
  const x = (dx: number) => 100 + side * (s.shoulder + dx);
  const arm = [
    `M${x(11)} 144`,
    `C${x(12.6)} 158 ${x(12.8)} 170 ${x(11.8)} 178`,
    `C${x(10.8)} 188 ${x(9.4)} 195 ${x(8.8)} 200`,
    `L${x(2.2)} 199.5`,
    `C${x(2.6)} 192 ${x(3.6)} 184 ${x(3.4)} 177`,
    `C${x(3.2)} 166 ${x(1.6)} 156 ${x(-1.5)} 146Z`,
  ].join("");
  const hand = [
    `M${x(9.2)} 197.5`,
    `C${x(11.2)} 203 ${x(10.8)} 210 ${x(7.8)} 213`,
    `C${x(5.2)} 215.4 ${x(2.2)} 213.8 ${x(1.6)} 209.4`,
    `C${x(1.1)} 205 ${x(1.6)} 201 ${x(2.2)} 197.5Z`,
  ].join("");
  return (
    <g>
      <path d={arm} fill={skin.base} stroke={skin.line} strokeWidth={LINE} strokeLinejoin="round" />
      {/* tapered inner-arm shadow and a soft elbow crease */}
      <path d={`M${x(2.4)} 199C${x(2.8)} 190 ${x(3.8)} 183 ${x(3.6)} 177C${x(3.4)} 166 ${x(1.8)} 156 ${x(-1)} 147L${x(2.6)} 148C${x(4.8)} 158 ${x(6)} 168 ${x(5.8)} 178C${x(5.6)} 186 ${x(4.4)} 193 ${x(4.2)} 199Z`} fill={skin.shadow} opacity={0.75} />
      <path d={`M${x(5.6)} 176.5q${side * 2} 1 ${side * 3.6} 0.2`} stroke={skin.line} strokeWidth={0.9} fill="none" strokeLinecap="round" opacity={0.6} />
      <path d={hand} fill={skin.base} stroke={skin.line} strokeWidth={LINE} strokeLinejoin="round" />
      <path d={`M${x(2.6)} 202.5q${side * 2.2} 1.6 ${side * 2} 5`} stroke={skin.line} strokeWidth={1} fill="none" strokeLinecap="round" />
    </g>
  );
}

function Neck({ s, skin }: { s: StyleShape; skin: SkinPalette }) {
  return (
    <g>
      {[-1, 1].map((side) => (
        <g key={side}>
          <ellipse cx={100 + side * 34} cy={64.5} rx={4.8} ry={7} fill={skin.base} stroke={skin.line} strokeWidth={LINE} />
          <path d={`M${100 + side * 35} 60.5q${side * 2} 4 0 8`} stroke={skin.shadow} strokeWidth={1.6} fill="none" strokeLinecap="round" />
        </g>
      ))}
      <path d={`M${100 - s.neck} 86V114Q100 121 ${100 + s.neck} 114V86Z`} fill={skin.base} stroke={skin.line} strokeWidth={LINE} />
      <path d={`M${100 - s.neck} 88Q100 108 ${100 + s.neck} 88V96Q100 110 ${100 - s.neck} 96Z`} fill={skin.shadow} />
    </g>
  );
}

function Shirt({ s }: { s: StyleShape }) {
  const L = (d: number) => 100 - d;
  const R = (d: number) => 100 + d;
  const nL = L(s.neck + 3.5);
  const nR = R(s.neck + 3.5);
  const hemHalf = s.hip + 1.5;
  const torso = [
    `M${nL} 108.5`,
    `C${nL - 6} 109.5 ${L(s.shoulder) + 6} 111 ${L(s.shoulder)} 115`,
    `C${L(s.shoulder) - 1.5} 124 ${L(s.shoulder) + 0.5} 134 ${L(s.shoulder) + 2.5} 142`,
    `C${L(s.shoulder) + 3.5} 150 ${L(s.waist) - 0.5} 158 ${L(s.waist)} 166`,
    `C${L(s.waist) + 0.3} 172 ${L(hemHalf)} 178 ${L(hemHalf)} ${s.hem}`,
    `Q100 ${s.hem + 2.5} ${R(hemHalf)} ${s.hem}`,
    `C${R(hemHalf)} 178 ${R(s.waist) - 0.3} 172 ${R(s.waist)} 166`,
    `C${R(s.waist) + 0.5} 158 ${R(s.shoulder) - 3.5} 150 ${R(s.shoulder) - 2.5} 142`,
    `C${R(s.shoulder) - 0.5} 134 ${R(s.shoulder) + 1.5} 124 ${R(s.shoulder)} 115`,
    `C${R(s.shoulder) - 6} 111 ${nR + 6} 109.5 ${nR} 108.5`,
    `Q100 120 ${nL} 108.5Z`,
  ].join("");
  const sleeve = (side: 1 | -1) => {
    const x = (dx: number) => 100 + side * (s.shoulder + dx);
    return (
      <path
        d={`M${x(0)} 115C${x(6)} 119 ${x(10)} 131 ${x(11.5)} 146L${x(-2.5)} 149C${x(-3)} 140 ${x(-3)} 131 ${x(-2)} 124Z`}
        fill={SHIRT.base}
        stroke={SHIRT.line}
        strokeWidth={LINE}
        strokeLinejoin="round"
      />
    );
  };
  return (
    <g>
      {sleeve(-1)}
      {sleeve(1)}
      <path d={torso} fill={SHIRT.base} stroke={SHIRT.line} strokeWidth={LINE} strokeLinejoin="round" />
      {/* side shading (light from the top left) and a soft fold */}
      <path
        d={`M${R(s.shoulder) - 2.5} 142C${R(s.shoulder) - 3.5} 150 ${R(s.waist) + 0.5} 158 ${R(s.waist)} 166C${R(s.waist) - 0.3} 172 ${R(hemHalf)} 178 ${R(hemHalf)} ${s.hem}H${R(hemHalf) - 7}C${R(hemHalf) - 7} 176 ${R(s.waist) - 7} 160 ${R(s.shoulder) - 8} 142Z`}
        fill={SHIRT.shadow}
      />
      <path d={`M${L(s.waist) + 5} 172q6 3 10 1`} stroke={SHIRT.line} strokeWidth={0.9} fill="none" opacity={0.7} strokeLinecap="round" />
      {/* ribbed collar */}
      <path d={`M${nL} 108.5Q100 120 ${nR} 108.5`} fill="none" stroke={SHIRT.line} strokeWidth={2.6} strokeLinecap="round" />
      <path d={`M${nL} 108.5Q100 120 ${nR} 108.5`} fill="none" stroke={SHIRT.base} strokeWidth={1.2} strokeLinecap="round" />
      {/* MoodMeal chest mark */}
      <g transform={`translate(100 ${136 + (s.hem - 184) * 0.3})`}>
        <circle r={6.2} fill="#7c3aed" />
        <circle cx={-2.1} cy={-1.2} r={0.9} fill="#fff" />
        <circle cx={2.1} cy={-1.2} r={0.9} fill="#fff" />
        <path d="M-2.6 1.4q2.6 2.6 5.2 0" stroke="#fff" strokeWidth={1.1} fill="none" strokeLinecap="round" />
        <path d="M3.4 -6.2q2.6-2.4 4.6-1.2-1.2 2.6-4.2 2.4" fill="#7fd858" />
      </g>
    </g>
  );
}

function Head({ s, skin }: { s: StyleShape; skin: SkinPalette }) {
  return (
    <g>
      <path d={headPath(s.jaw)} fill={skin.base} stroke={skin.line} strokeWidth={LINE} strokeLinejoin="round" />
      {/* soft form shadow on the lower right of the face, highlight upper left */}
      <path d={`M128 76C${125 + s.jaw} 86 116 94.5 104 96.8C113 93 121 86 124 76Z`} fill={skin.shadow} opacity={0.42} />
      <ellipse cx={85} cy={44} rx={9} ry={5} transform="rotate(-24 85 44)" fill={skin.highlight} opacity={0.55} />
      <path d="M101.2 69.5Q98.4 75.4 101.8 76.6" stroke={skin.line} strokeWidth={1.3} fill="none" strokeLinecap="round" opacity={0.75} />
    </g>
  );
}

// --- Hair -------------------------------------------------------------------
// Every style is drawn against the shared head (crown y=28, temples x=66/134,
// ears at y≈57–72) so it sits on the scalp for every base style.

/** Close-cropped cap shared by Buzz Cut and the faded sides of Short Straight. */
const CROP_CAP =
  "M66.4 60C65.5 41 79 27 100 27C121 27 134.5 41 133.6 60L131 58.5C130 52 127 47.5 122.5 45.5Q100 40 77.5 45.5C73 47.5 70 52 69 58.5Z";

/** Scattered short hair marks (deterministic, not a grid) for the buzz texture. */
const BUZZ_MARKS: string[] = (() => {
  const marks: string[] = [];
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 90; i++) {
    const x = 69 + rand() * 62;
    const y = 29 + rand() * 28;
    const inHead = ((x - 100) / 32.5) ** 2 + ((y - 60) / 31.5) ** 2 < 1;
    const aboveHairline = y < 43 + Math.abs(x - 100) * 0.38;
    if (!inHead || !aboveHairline) continue;
    const a = (x - 100) * 0.03 + (rand() - 0.5) * 0.6;
    marks.push(`M${x.toFixed(1)} ${y.toFixed(1)}l${(Math.sin(a) * 1.3).toFixed(2)} ${(-Math.cos(a) * 1.3).toFixed(2)}`);
  }
  return marks;
})();

const CURLY = (() => {
  const arc: [number, number][] = [];
  const n = 13;
  for (let i = 0; i < n; i++) {
    const a = ((170 + (200 * i) / (n - 1)) * Math.PI) / 180;
    arc.push([100 + 35 * Math.cos(a), 55 + 33 * Math.sin(a)]);
  }
  const fringe: [number, number][] = [
    [127.5, 50], [120, 45], [111.5, 42.2], [103, 41], [94.5, 41.2], [86, 43], [78.5, 46.5], [72, 51.5],
  ];
  return { arc, fringe };
})();

function strands(paths: string[], color: string, width = 1.1, opacity = 0.9) {
  return paths.map((d, i) => (
    <path key={i} d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" opacity={opacity} />
  ));
}

function curl(x: number, y: number, key: string) {
  return <path key={key} d={`M${x - 2.4} ${y + 0.8}a2.6 2.6 0 1 1 2.6 2.2`} stroke={HAIR.shadow} strokeWidth={1.1} fill="none" strokeLinecap="round" />;
}

function Braid({ x0, side }: { x0: number; side: 1 | -1 }) {
  // One plait: overlapping lobes alternating direction down a gentle curve.
  const points: [number, number][] = [];
  for (let i = 0; i < 11; i++) {
    points.push([x0 + side * (Math.sin(i / 3) * 2.2 - i * 0.25), 76 + i * 8.2]);
  }
  const [ex, ey] = points[points.length - 1];
  return (
    <g>
      <path d={`M${ex - 2.5} ${ey + 4}l-1.6 7 2.2-1.6 1.9 2.4 1.9-2.4 2.2 1.6-1.6-7Z`} fill={HAIR.base} stroke={HAIR.line} strokeWidth={1} strokeLinejoin="round" />
      {points.map(([cx, cy], i) => {
        const dir = i % 2 === 0 ? 1 : -1;
        return (
          <g key={i} transform={`rotate(${dir * 24} ${cx} ${cy})`}>
            <ellipse cx={cx} cy={cy} rx={5.6} ry={4.6} fill={HAIR.base} stroke={HAIR.line} strokeWidth={1.1} />
            <path d={`M${cx - 3.2} ${cy - 1.2}q3.2-2.2 6.4 0`} stroke={HAIR.highlight} strokeWidth={1} fill="none" strokeLinecap="round" />
          </g>
        );
      })}
      <rect x={ex - 3.4} y={ey + 3} width={6.8} height={2.6} rx={1.3} fill="#a78bfa" stroke="#7c3aed" strokeWidth={0.7} />
    </g>
  );
}

function HairBack({ style }: { style: HairStyleId }) {
  switch (style) {
    case "long-wavy":
      return (
        <path
          d="M100 21C73 21 59 39 60 62C60 80 52 92 56 106C60 120 50 132 54 146C57 155 63 160 70 159C76 162 82 159 86 156H114C118 159 124 162 130 159C137 160 143 155 146 146C150 132 140 120 144 106C148 92 140 80 140 62C141 39 127 21 100 21Z"
          fill={HAIR.shadow}
          stroke={HAIR.line}
          strokeWidth={LINE}
          strokeLinejoin="round"
        />
      );
    case "straight":
      return (
        <path
          d="M100 21C74 21 60 38 60 62V150C60 153 62 155 65 155H135C138 155 140 153 140 150V62C140 38 126 21 100 21Z"
          fill={HAIR.shadow}
          stroke={HAIR.line}
          strokeWidth={LINE}
          strokeLinejoin="round"
        />
      );
    default:
      return null;
  }
}

function HairFront({ style, skin }: { style: HairStyleId; skin: SkinPalette }) {
  switch (style) {
    case "bald":
      return <ellipse cx={90} cy={36} rx={10} ry={4.2} transform="rotate(-18 90 36)" fill={skin.highlight} opacity={0.75} />;

    case "buzz-cut":
      return (
        <g>
          <path d={CROP_CAP} fill={HAIR.base} opacity={0.72} />
          <path d="M69 58.5C70 52 73 47.5 77.5 45.5Q100 40 122.5 45.5C127 47.5 130 52 131 58.5" stroke={HAIR.line} strokeWidth={0.8} fill="none" opacity={0.5} />
          <g stroke={HAIR.line} strokeWidth={0.7} strokeLinecap="round" opacity={0.55}>
            {BUZZ_MARKS.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
          <path d="M80 34q9-4.5 18-4.5" stroke={HAIR.highlight} strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.6} />
        </g>
      );

    case "short-straight":
      return (
        <g>
          {/* faded sides, then a fuller top swept to one side with a textured fringe */}
          <path d={CROP_CAP} fill={HAIR.base} opacity={0.75} />
          <path
            d="M68.5 52C65 34 80 17.5 101 17C123 16.5 137 30 134 49C131.5 46 128.5 44.8 125 45L121.5 41.2L116.5 45.2L110.5 40.6L104.5 44.6L97.5 39.6L90.5 43.4L85 38.6C79 41.5 73 46 68.5 52Z"
            fill={HAIR.base}
            stroke={HAIR.line}
            strokeWidth={LINE}
            strokeLinejoin="round"
          />
          {strands(["M82 23C94 22 108 26 118 35", "M76 31C88 28 102 32 112 40", "M112 21C121 24 128 30 131 39", "M88 38C92 34 98 32 104 33"], HAIR.shadow, 1.2)}
          {strands(["M88 22.5C99 21.5 109 24 116 29"], HAIR.highlight, 1.5, 0.85)}
        </g>
      );

    case "short-curly": {
      const poly = [...CURLY.arc, ...CURLY.fringe].map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L");
      return (
        <g>
          <g stroke={HAIR.line} strokeWidth={LINE} fill={HAIR.base}>
            {CURLY.arc.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={8} />
            ))}
          </g>
          <path d={`M${poly}Z`} fill={HAIR.base} />
          <g stroke={HAIR.line} strokeWidth={LINE} fill={HAIR.base}>
            {CURLY.fringe.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={5.4} />
            ))}
          </g>
          <path d={`M${poly}Z`} fill={HAIR.base} transform="translate(100 44) scale(0.86) translate(-100 -44)" />
          {[...CURLY.arc, ...CURLY.fringe].map(([x, y], i) => curl(x, y, `c${i}`))}
          {[[88, 32], [100, 28], [112, 32], [94, 36.5], [106, 36.5], [80, 38], [120, 38]].map(([x, y], i) => curl(x, y, `t${i}`))}
          {strands(["M81.5 27a3 3 0 0 1 4-1.5", "M93.5 23.5a3 3 0 0 1 4-1.5", "M71.5 34a3 3 0 0 1 4-1.5"], HAIR.highlight, 1.3, 0.9)}
        </g>
      );
    }

    case "long-wavy":
      return (
        <g>
          <path
            d="M63 72C58 44 75 19.5 101 19.5C127 19.5 143 42 137 72C136 80 142 90 138 102C135 112 142 122 138 134C136 142 140 150 134 154C131 148 129 142 131 134C133 124 127 114 130 104C133 92 127 82 130 72C130 60 128 52 124.5 47.5C116 45 104 42 95 34C90 42 81 48 73 52C70.5 58 70 66 70 72C73 82 67 92 70 104C73 114 67 124 69 134C71 142 69 148 66 154C60 150 64 142 62 134C58 122 65 112 62 102C58 90 64 80 63 72Z"
            fill={HAIR.base}
            stroke={HAIR.line}
            strokeWidth={LINE}
            strokeLinejoin="round"
          />
          {strands(["M95 34C104 40 116 44 126 50", "M88 25C80 30 72 40 68 54", "M110 23C122 28 132 40 134 56", "M66 84C69 94 64 104 67 114", "M134 84C131 94 136 104 133 114", "M65 122C67 132 63 140 66 148", "M135 122C133 132 137 140 134 148"], HAIR.shadow, 1.2)}
          {strands(["M100 24C110 26 118 30 124 36", "M78 34C74 40 71 46 70 52", "M133 96c-2 6 0 10 1.5 14"], HAIR.highlight, 1.5, 0.8)}
        </g>
      );

    case "straight":
      return (
        <g>
          <path
            d="M63 70C60 42 76 20 100 20C124 20 140 42 137 70V151.5C137 153 136 154 134.5 154H129.5C128.5 154 128 153 128 152V72C128 60 125 50 119 44C112 38 105 32 100 26.5C95 32 88 38 81 44C75 50 72 60 72 72V152C72 153 71.5 154 70.5 154H65.5C64 154 63 153 63 151.5Z"
            fill={HAIR.base}
            stroke={HAIR.line}
            strokeWidth={LINE}
            strokeLinejoin="round"
          />
          {strands(["M100 27C95 34 84 42 77 52", "M100 27C105 34 116 42 123 52", "M67 60V150", "M133 60V150", "M69.5 90V146", "M130.5 90V146"], HAIR.shadow, 1.1)}
          {strands(["M90 27C84 31 78 38 75 46", "M66 70V110"], HAIR.highlight, 1.5, 0.8)}
        </g>
      );

    case "braids":
      return (
        <g>
          <Braid x0={68} side={-1} />
          <Braid x0={132} side={1} />
          <path
            d="M66 66C64 42 78 23.5 100 23.5C122 23.5 136 42 134 66L131 62C130 54 127 48 122 45C115 42 106 40 100 40C94 40 85 42 78 45C73 48 70 54 69 62Z"
            fill={HAIR.base}
            stroke={HAIR.line}
            strokeWidth={LINE}
            strokeLinejoin="round"
          />
          {/* centre part with sleek lines combed back toward each braid */}
          {strands(["M100 24V40", "M96 27C86 32 76 44 71 60", "M104 27C114 32 124 44 129 60", "M92 33C84 38 78 48 75 58", "M108 33C116 38 122 48 125 58"], HAIR.shadow, 1.1)}
          {strands(["M94 26C86 29 80 34 76 41"], HAIR.highlight, 1.5, 0.8)}
          {/* hair wrapping from the temples into each braid */}
          <path d="M66 64C65 70 66 74 68 76L71.5 74C70 71 69.5 67 69.5 62Z" fill={HAIR.base} stroke={HAIR.line} strokeWidth={1} />
          <path d="M134 64C135 70 134 74 132 76L128.5 74C130 71 130.5 67 130.5 62Z" fill={HAIR.base} stroke={HAIR.line} strokeWidth={1} />
        </g>
      );

    default:
      return null;
  }
}

// --- Face (the expression layer) --------------------------------------------

/** Shapes drawn as fully open eyes can play a brief, synced blink. */
const BLINKABLE_EYE_SHAPES: EyeShapeKey[] = ["wide", "worried-wide"];

function OpenEye({
  cx,
  cy,
  rx = 5.9,
  ry = 5.4,
  irisR = 4.1,
  look = [0, 0.3],
}: {
  cx: number;
  cy: number;
  rx?: number;
  ry?: number;
  irisR?: number;
  look?: [number, number];
}) {
  const ix = cx + look[0];
  const iy = cy + look[1];
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={EYE.white} />
      <circle cx={ix} cy={iy} r={irisR} fill={EYE.iris} />
      <circle cx={ix} cy={iy} r={irisR * 0.5} fill={EYE.pupil} />
      <circle cx={ix + irisR * 0.35} cy={iy - irisR * 0.4} r={irisR * 0.3} fill="#fff" />
      <path d={`M${cx - rx - 0.8} ${cy + 0.2}Q${cx} ${cy - ry * 1.55} ${cx + rx + 0.8} ${cy - 0.4}`} stroke={EYE.lid} strokeWidth={1.9} fill="none" strokeLinecap="round" />
    </g>
  );
}

function Eye({ shape, cx, side, skin }: { shape: EyeShapeKey; cx: number; side: "left" | "right"; skin: SkinPalette }) {
  const cy = EYE_Y;
  const inner = side === "left" ? 1 : -1; // direction toward the nose
  let content: ReactNode;
  switch (shape) {
    case "happy-arc":
      // Open, smiling eyes: the cheek lifts the lower lid.
      content = (
        <g>
          <OpenEye cx={cx} cy={cy} />
          <path d={`M${cx - 7} ${cy + 3.6}Q${cx} ${cy + 0.6} ${cx + 7} ${cy + 3.6}V${cy + 7}H${cx - 7}Z`} fill={skin.base} />
          <path d={`M${cx - 5.2} ${cy + 3.2}Q${cx} ${cy + 0.9} ${cx + 5.2} ${cy + 3.2}`} stroke={skin.line} strokeWidth={1} fill="none" strokeLinecap="round" />
        </g>
      );
      break;
    case "gentle-down":
      content = (
        <g>
          <OpenEye cx={cx} cy={cy} look={[0, 1.4]} />
          <path d={`M${cx - 6.5} ${cy - 6.5}H${cx + 6.5}V${cy - 0.6}Q${cx} ${cy - 2.4} ${cx - 6.5} ${cy - 0.6}Z`} fill={skin.base} />
          <path d={`M${cx - 6} ${cy - 0.4}Q${cx} ${cy - 2.6} ${cx + 6} ${cy - 0.4}`} stroke={EYE.lid} strokeWidth={1.9} fill="none" strokeLinecap="round" />
        </g>
      );
      break;
    case "sleepy":
      content = (
        <g>
          <path d={`M${cx - 5.5} ${cy}Q${cx} ${cy + 3.4} ${cx + 5.5} ${cy}`} stroke={EYE.lid} strokeWidth={1.9} fill="none" strokeLinecap="round" />
          <path d={`M${cx - 3.5} ${cy + 5}Q${cx} ${cy + 6.4} ${cx + 3.5} ${cy + 5}`} stroke={skin.shadow} strokeWidth={1.2} fill="none" strokeLinecap="round" />
        </g>
      );
      break;
    case "wide":
      content = <OpenEye cx={cx} cy={cy - 0.6} rx={5.9} ry={5.7} irisR={3.3} look={[0, 0]} />;
      break;
    case "worried-wide":
      content = <OpenEye cx={cx} cy={cy - 0.4} rx={5.8} ry={5.4} irisR={3.2} look={[inner * 0.6, -0.8]} />;
      break;
    case "squint": {
      // Lids slant down toward the nose.
      const innerX = cx + inner * 7;
      const outerX = cx - inner * 7;
      content = (
        <g>
          <OpenEye cx={cx} cy={cy} />
          <path d={`M${outerX} ${cy - 7}H${innerX}V${cy + 0.2}L${outerX} ${cy - 3.6}Z`} fill={skin.base} />
          <path d={`M${cx - inner * 6} ${cy - 3.2}L${cx + inner * 6} ${cy}`} stroke={EYE.lid} strokeWidth={1.9} strokeLinecap="round" />
        </g>
      );
      break;
    }
    case "half-lidded":
      content = (
        <g>
          <OpenEye cx={cx} cy={cy} look={[0, 1]} />
          <path d={`M${cx - 7} ${cy - 7}H${cx + 7}V${cy}H${cx - 7}Z`} fill={skin.base} />
          <path d={`M${cx - 5.8} ${cy}H${cx + 5.8}`} stroke={EYE.lid} strokeWidth={1.9} strokeLinecap="round" />
        </g>
      );
      break;
    case "nervous-wave":
      content = <OpenEye cx={cx} cy={cy} irisR={3.1} look={[-2, 0.4]} />;
      break;
    case "spiral-playful":
      // A playful wink.
      content =
        side === "left" ? (
          <path d={`M${cx - 5.5} ${cy + 1}Q${cx} ${cy - 4.4} ${cx + 5.5} ${cy + 1}`} stroke={EYE.lid} strokeWidth={2} fill="none" strokeLinecap="round" />
        ) : (
          <OpenEye cx={cx} cy={cy} rx={5.7} ry={5.2} />
        );
      break;
    default:
      content = <OpenEye cx={cx} cy={cy} />;
  }
  if (!BLINKABLE_EYE_SHAPES.includes(shape)) return <>{content}</>;
  return (
    <g className="motion-safe:animate-mm-blink" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
      {content}
    </g>
  );
}

function Brow({ shape, cx, side, width, color }: { shape: EyebrowShapeKey; cx: number; side: "left" | "right"; width: number; color: string }) {
  const inward = side === "left" ? 1 : -1;
  const ix = cx + inward * 5.5; // inner end (toward the nose)
  const ox = cx - inward * 6.5; // outer end
  const mx = cx - inward * 1.5;
  const y = BROW_Y;
  let d: string;
  switch (shape) {
    case "raised":
      d = `M${ox} ${y - 1.5}Q${mx} ${y - 7} ${ix} ${y - 3}`;
      break;
    case "raised-inner":
      d = `M${ox} ${y + 1}Q${mx} ${y - 1} ${ix} ${y - 3.5}`;
      break;
    case "raised-inner-angled":
      d = `M${ox} ${y + 1.8}Q${mx} ${y - 0.5} ${ix} ${y - 4.5}`;
      break;
    case "lowered":
      d = `M${ox} ${y - 1.8}Q${mx} ${y - 0.5} ${ix} ${y + 2.8}`;
      break;
    case "worried":
      d = `M${ox} ${y + 0.5}Q${mx} ${y - 2} ${ix} ${y - 2.6}`;
      break;
    case "playful":
      d = side === "left" ? `M${ox} ${y - 2}Q${mx} ${y - 7.5} ${ix} ${y - 3.5}` : `M${ox} ${y + 1}Q${mx} ${y - 1.2} ${ix} ${y + 0.6}`;
      break;
    case "flat":
      d = `M${ox} ${y + 0.6}L${ix} ${y + 0.6}`;
      break;
    case "relaxed":
    default:
      d = `M${ox} ${y + 1}Q${mx} ${y - 3} ${ix} ${y + 0.2}`;
  }
  return <path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" />;
}

function Mouth({ shape, skin }: { shape: MouthShapeKey; skin: SkinPalette }) {
  const y = MOUTH_Y;
  const line = { stroke: skin.lip, strokeWidth: 1.9, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (shape) {
    case "smile-big":
      return (
        <g>
          <path d={`M93 ${y - 1.5}Q100 ${y + 0.2} 107 ${y - 1.5}Q106 ${y + 7} 100 ${y + 7}Q94 ${y + 7} 93 ${y - 1.5}Z`} fill={MOUTH.inside} stroke={skin.lip} strokeWidth={1.2} strokeLinejoin="round" />
          <path d={`M94.2 ${y - 0.9}Q100 ${y + 0.6} 105.8 ${y - 0.9}L105.2 ${y + 1.2}Q100 ${y + 2.4} 94.8 ${y + 1.2}Z`} fill={MOUTH.teeth} />
          <path d={`M96.5 ${y + 5.6}Q100 ${y + 3} 103.5 ${y + 5.6}Q100 ${y + 7} 96.5 ${y + 5.6}Z`} fill={MOUTH.tongue} />
        </g>
      );
    case "grin-big-open":
      return (
        <g>
          <path d={`M91.5 ${y - 2}Q100 ${y} 108.5 ${y - 2}Q107.5 ${y + 9.5} 100 ${y + 9.5}Q92.5 ${y + 9.5} 91.5 ${y - 2}Z`} fill={MOUTH.inside} stroke={skin.lip} strokeWidth={1.2} strokeLinejoin="round" />
          <path d={`M92.8 ${y - 1.3}Q100 ${y + 0.6} 107.2 ${y - 1.3}L106.6 ${y + 1.4}Q100 ${y + 2.8} 93.4 ${y + 1.4}Z`} fill={MOUTH.teeth} />
          <path d={`M95.5 ${y + 7.8}Q100 ${y + 4} 104.5 ${y + 7.8}Q100 ${y + 9.6} 95.5 ${y + 7.8}Z`} fill={MOUTH.tongue} />
        </g>
      );
    case "small-smile":
      return <path d={`M95.5 ${y}Q100 ${y + 3.4} 104.5 ${y}`} {...line} />;
    case "frown":
      return <path d={`M95 ${y + 2.4}Q100 ${y - 1.4} 105 ${y + 2.4}`} {...line} />;
    case "frown-sharp":
      return <path d={`M94.5 ${y + 2.6}Q100 ${y - 1.6} 105.5 ${y + 2.6}Q100 ${y + 1.2} 94.5 ${y + 2.6}Z`} fill={MOUTH.inside} stroke={skin.lip} strokeWidth={1.4} strokeLinejoin="round" />;
    case "flat-yawn":
      return <ellipse cx={100} cy={y + 1.5} rx={3.2} ry={4} fill={MOUTH.inside} stroke={skin.lip} strokeWidth={1.2} />;
    case "open-o-small":
      return <ellipse cx={100} cy={y + 1} rx={2.6} ry={3.2} fill={MOUTH.inside} stroke={skin.lip} strokeWidth={1.2} />;
    case "wavy":
      return <path d={`M94.5 ${y + 0.5}q1.4-1.6 2.8 0t2.8 0 2.8 0 2.8 0`} {...line} />;
    case "flat":
      return <path d={`M95.5 ${y + 0.8}L104.5 ${y + 0.4}`} {...line} />;
    case "tongue":
      return (
        <g>
          <path d={`M101 ${y + 1.4}v2.6a2.6 2.6 0 0 0 5.2 0v-3.6Z`} fill={MOUTH.tongue} stroke={skin.lip} strokeWidth={1} />
          <path d={`M94.5 ${y - 0.4}Q100 ${y + 3.8} 106.5 ${y - 0.6}`} {...line} />
        </g>
      );
    case "concerned":
      return <path d={`M96 ${y + 1.6}Q100 ${y - 0.6} 104 ${y + 1.8}`} {...line} />;
    case "uncomfortable-wavy":
      return <path d={`M94.5 ${y + 1.2}Q97.3 ${y - 1.4} 100 ${y + 1}Q102.7 ${y + 3.2} 105.5 ${y + 0.4}`} {...line} />;
    default:
      return <path d={`M95.5 ${y}Q100 ${y + 2.6} 104.5 ${y}`} {...line} />;
  }
}

// --- Main component ---------------------------------------------------

export default function Avatar({ config, emotion = "happy", className, decorative = false, variant = "full" }: AvatarProps) {
  const expr = getExpression(emotion);
  const skin = skinPalette(config.skinTone);
  const s = STYLE_SHAPE[config.baseStyle] ?? STYLE_SHAPE.feminine;
  const bust = variant === "bust";

  const a11yProps = decorative
    ? { "aria-hidden": true as const }
    : { role: "img" as const, "aria-label": `Your avatar, ${emotion} expression` };

  return (
    <svg
      viewBox={bust ? VIEWBOX_BUST : VIEWBOX_FULL}
      className={className}
      data-avatar="true"
      data-emotion={emotion}
      data-base-style={config.baseStyle}
      data-skin-tone={config.skinTone}
      data-hair-style={config.hairStyle}
      {...a11yProps}
    >
      {!bust && <ellipse cx="100" cy="299" rx="46" ry="5" fill="#2e1065" opacity="0.12" />}

      <HairBack style={config.hairStyle} />
      {!bust && <Legs s={s} />}
      {!bust && <Shoes s={s} />}
      <Arm s={s} side={-1} skin={skin} />
      <Arm s={s} side={1} skin={skin} />
      <Neck s={s} skin={skin} />
      <Shirt s={s} />
      <Head s={s} skin={skin} />

      {expr.blush && (
        <g fill={skin.cheek} opacity={0.5}>
          <ellipse cx={83} cy={76} rx={4.6} ry={2.6} />
          <ellipse cx={117} cy={76} rx={4.6} ry={2.6} />
        </g>
      )}
      <Brow shape={expr.eyebrows} cx={EYE_L} side="left" width={s.brow} color={skin.brow} />
      <Brow shape={expr.eyebrows} cx={EYE_R} side="right" width={s.brow} color={skin.brow} />
      <Eye shape={expr.eyes} cx={EYE_L} side="left" skin={skin} />
      <Eye shape={expr.eyes} cx={EYE_R} side="right" skin={skin} />
      {expr.tears && (
        <g fill="#7dd3fc" stroke="#38bdf8" strokeWidth={0.6}>
          <path d={`M${EYE_L - 4} ${EYE_Y + 5}q-2.2 5 0 7q2.2-2 0-7Z`} />
          <path d={`M${EYE_R + 4} ${EYE_Y + 5}q-2.2 5 0 7q2.2-2 0-7Z`} />
        </g>
      )}
      {expr.sweatDrop && <path d="M126 44q3.8 5.6 0 8.4q-3.8-2.8 0-8.4Z" fill="#7dd3fc" stroke="#38bdf8" strokeWidth={0.6} />}
      <Mouth shape={expr.mouth} skin={skin} />

      <HairFront style={config.hairStyle} skin={skin} />
    </svg>
  );
}
