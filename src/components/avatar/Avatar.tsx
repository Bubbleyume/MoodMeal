/**
 * The user's own avatar — NOT the MoodMeal mascot and NOT the MoodMeal logo
 * (see src/types/avatar.ts). Composed from layered SVG shapes driven purely
 * by the identity fields in `config` plus whichever single expression
 * `emotion` maps to (src/data/avatarExpressions.ts). Changing `emotion`
 * only ever swaps the eyes/eyebrows/mouth/blush/tears/sweat layer — every
 * other layer reads only from `config`, so the same user looks like the
 * same person across all 12 moods.
 *
 * This is the RENDERING layer only: it asks src/data/avatarAssets.ts (the
 * ASSET RESOLUTION layer) for colors/paths rather than looking anything up
 * itself, so swapping today's hand-drawn vector shapes for professionally
 * illustrated PNG/WebP/SVG layers later means changing the small set of
 * `render*`/`<Eye>`/`<Eyebrow>`/`<Mouth>` functions below (and what
 * avatarAssets.ts resolves an id to) — never the avatar state model
 * (src/hooks/useAvatar.ts), the Creator UI, or any page that renders
 * <Avatar>.
 *
 * Target visual direction: cute, human, chibi-inspired, large expressive
 * eyes, rounded features, friendly and colorful — compatible with
 * MoodMeal's purple/pink/green identity without copying any specific
 * reference character.
 */
import type { EmotionId } from "../../types/index";
import type {
  AvatarConfig,
  EyeShapeKey,
  EyebrowShapeKey,
  MouthShapeKey,
} from "../../types/avatar";
import { resolveAvatarColors, resolveInkColor, shade, JEANS_COLOR } from "../../data/avatarAssets";
import { getExpression } from "../../data/avatarExpressions";

/** Bust-and-up canvas — matches the pre-Phase-2C viewBox exactly, so every
 * small/decorative context (mood tiles, the bottom-sheet face, the
 * Creator's tiny expression-preview buttons) keeps its old framing and
 * doesn't shrink the face to make room for legs nobody can see at 32-44px
 * anyway. See `variant` below. */
const VIEWBOX_BUST = "0 0 200 220";
/** Full figure — tall enough for standing legs+shoes or a seated pose with
 * a wheelchair-conceptual hint (see `renderLowerBody`). */
const VIEWBOX_FULL = "0 0 200 310";

const PRESET_STYLE: Record<
  AvatarConfig["presetId"],
  {
    hairStyle: AvatarConfig["hairStyle"];
    hairHex: string;
    facialHair: AvatarConfig["facialHair"];
  }
> = {
  feminine: { hairStyle: "long-wavy", hairHex: "#4a2f36", facialHair: "none" },
  masculine: { hairStyle: "short-straight", hairHex: "#2f2118", facialHair: "none" },
  androgynous: { hairStyle: "short-straight", hairHex: "#6f35a5", facialHair: "none" },
  braids: { hairStyle: "braids", hairHex: "#2b1b12", facialHair: "none" },
  seated: { hairStyle: "short-curly", hairHex: "#4a2f1f", facialHair: "none" },
  bold: { hairStyle: "buzz-cut", hairHex: "#d9b268", facialHair: "none" },
  classic: { hairStyle: "short-straight", hairHex: "#241a18", facialHair: "full-beard" },
};

export interface AvatarProps {
  config: AvatarConfig;
  /** Which of MoodMeal's 12 moods to express. Defaults to a neutral-happy face. */
  emotion?: EmotionId;
  className?: string;
  /**
   * Set when adjacent visible text already names the mood/user (a mood
   * tile's label, a result screen's heading) so the avatar itself doesn't
   * need its own accessible name — it's then hidden from assistive tech
   * instead of being announced redundantly. Defaults to false: a
   * standalone avatar (Welcome, Profile, the Creator) keeps a real
   * accessible name.
   */
  decorative?: boolean;
  /**
   * "full" (default) shows the whole figure, including the pose (standing
   * legs+shoes, or a seated wheelchair-conceptual presentation) — use this
   * wherever showing off "your avatar" is the point (Welcome, the Creator,
   * Profile's avatar entry point). "bust" crops to head+shoulders/torso
   * only, matching every context that only needs the face to read at a
   * small size (mood tiles, the bottom-sheet face, tiny preview buttons) —
   * pose/legs aren't rendered any differently there, just clipped from
   * view, so this is a pure display choice, not a config field.
   */
  variant?: "full" | "bust";
}


// --- Head silhouette ----------------------------------------------------
// This still reads `config.faceShape` — a field the Phase 2C Creator no
// longer exposes a picker for (see types/avatar.ts), fixed at "round" for
// every new avatar but left untouched for avatars that chose a different
// shape before Phase 2C, so nothing about their look changes underneath
// them. The MVP's actual "frame" (Soft/Bold) choice is expressed instead as
// a body-width difference in the main component below, applied to the
// torso/legs rather than the head — see the `frameScale` transform there
// and `getBaseAsset(frame)`'s own comment in avatarAssets.ts for what a
// production base-body illustration should do differently.

function headPath(faceShape: AvatarConfig["faceShape"]): string {
  switch (faceShape) {
    case "oval":
      return "M100 46c27 0 42 21 42 50 0 31-17 56-42 56s-42-25-42-56c0-29 15-50 42-50Z";
    case "heart":
      return "M100 48c25 0 44 17 44 40 0 25-17 46-36 60-3 3-6 6-8 8-2-2-5-5-8-8-19-14-36-35-36-60 0-23 19-40 44-40Z";
    case "round":
    default:
      return "M100 48c29 0 48 21 48 48s-20 50-48 50-48-23-48-50 19-48 48-48Z";
  }
}

// --- Hair ----------------------------------------------------------------
// Production swap-in point: avatarAssets.ts `getHairAsset(hairStyle)` for
// the style silhouette (one file per style, tinted with `resolveHairColor`
// — never one per hairStyle x hairColor combination). This vector renderer
// already splits hair into a back layer (this function) and a front layer
// (`renderHairFront` below) so long styles can pass behind the head/body;
// production art should keep that same two-file split per style rather
// than collapsing it into a single asset. Phase 2C's 7-style starter set
// reuses the exact same vetted shapes as Phase 2B's larger set (just fewer
// choices exposed), so nothing here is unproven.

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

/** Production swap-in point: the front-layer counterpart of
 * `getHairAsset(hairStyle)` above (same style id, tinted the same way) —
 * kept as its own file so it can layer over the forehead/ears. */
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

// --- Complete base models -------------------------------------------------
// The face above is shared. Each model below owns only its body silhouette,
// outfit, and pose. Skin-filled paths remain tied to the selected skin tone.

function renderPresetBody(presetId: AvatarConfig["presetId"], skinHex: string) {
  const skinShade = shade(skinHex, 0.18);
  const shoes = (
    <>
      <path d="M61 278c8-3 20-3 28 1l5 9c-8 5-25 5-36 1Z" fill="#fff" stroke="#2f3138" strokeWidth={2.2} />
      <path d="M139 278c-8-3-20-3-28 1l-5 9c8 5 25 5 36 1Z" fill="#fff" stroke="#2f3138" strokeWidth={2.2} />
      <path d="M63 286h29M108 286h29" stroke="#777b84" strokeWidth={1.5} strokeLinecap="round" />
    </>
  );
  const shirtMark = (
    <g fill="none" stroke="#fff" strokeLinecap="round">
      <circle cx="94" cy="181" r="1.7" fill="#fff" stroke="none" />
      <circle cx="106" cy="181" r="1.7" fill="#fff" stroke="none" />
      <path d="M91 188q9 9 18 0" strokeWidth={2.2} />
    </g>
  );
  const shirtMarkPurple = (
    <g fill="none" stroke="#7c3aed" strokeLinecap="round">
      <circle cx="94" cy="181" r="1.7" fill="#7c3aed" stroke="none" />
      <circle cx="106" cy="181" r="1.7" fill="#7c3aed" stroke="none" />
      <path d="M91 188q9 9 18 0" strokeWidth={2.2} />
    </g>
  );

  if (presetId === "masculine") {
    return (
      <g data-base-model="masculine">
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
  }

  if (presetId === "androgynous") {
    return (
      <g data-base-model="androgynous">
        {/* neutral straight pose with a white tee and purple cargo pants */}
        <path d="M72 160c-8 8-12 24-13 45-1 14-2 24-5 30-2 4-1 8 3 9 5 1 8-3 10-8 5-15 9-35 12-58Z" fill={skinHex} stroke={skinShade} strokeWidth={2} />
        <path d="M128 160c8 8 12 24 13 45 1 14 2 24 5 30 2 4 1 8-3 9-5 1-8-3-10-8-5-15-9-35-12-58Z" fill={skinHex} stroke={skinShade} strokeWidth={2} />
        <path d="M72 153c9-8 18-12 28-12s19 4 28 12l7 67H65Z" fill="#fffaf0" stroke="#d6d0c5" strokeWidth={2} />
        <path d="M86 143q14 16 28 0" fill="none" stroke="#7c3aed" strokeWidth={3} strokeLinecap="round" />
        <path d="M63 156l15-8 5 22-17 7ZM137 156l-15-8-5 22 17 7Z" fill="#fffaf0" stroke="#d6d0c5" strokeWidth={2} />
        <g transform="translate(0 2)">{shirtMarkPurple}</g>
        <path d="M68 220h31l-5 63H63Z" fill="#7652ad" stroke="#4d3379" strokeWidth={2} />
        <path d="M101 220h31l5 63h-31Z" fill="#7652ad" stroke="#4d3379" strokeWidth={2} />
        <path d="M64 239h19v17H65M136 239h-19v17h18" fill="#67479a" stroke="#4d3379" strokeWidth={1.3} />
        {shoes}
      </g>
    );
  }

  if (presetId === "braids") {
    return (
      <g data-preset="braids">
        <path d="M72 160c-8 8-10 27-12 48-1 13-3 22-7 27-2 4-1 8 3 9 5 1 8-3 10-8 5-16 8-37 12-59Z" fill={skinHex} stroke={skinShade} strokeWidth={2} />
        <path d="M128 160c8 8 10 27 12 48 1 13 3 22 7 27 2 4 1 8-3 9-5 1-8-3-10-8-5-16-8-37-12-59Z" fill={skinHex} stroke={skinShade} strokeWidth={2} />
        <path d="M72 153c8-8 18-12 28-12s20 4 28 12l7 66H65Z" fill="#c95ce6" stroke="#7c3aed" strokeWidth={2} />
        <path d="M64 156l15-9 6 24-19 8ZM136 156l-15-9-6 24 19 8Z" fill="#c95ce6" stroke="#7c3aed" strokeWidth={2} />
        {shirtMark}
        <path d="M66 219h33l-4 64H61Z" fill="#6f9bc6" stroke="#345b7e" strokeWidth={2} />
        <path d="M101 219h33l5 64h-34Z" fill="#6f9bc6" stroke="#345b7e" strokeWidth={2} />
        {shoes}
      </g>
    );
  }

  if (presetId === "seated") {
    return (
      <g data-preset="seated">
        <circle cx="49" cy="258" r="31" fill="none" stroke="#31313a" strokeWidth={7} />
        <circle cx="151" cy="258" r="31" fill="none" stroke="#31313a" strokeWidth={7} />
        <path d="M50 223h100l-8 39H58Z" fill="#25252a" stroke="#17171b" strokeWidth={2} />
        <path d="M68 153c9-8 20-12 32-12s23 4 32 12l8 70H60Z" fill="#25252a" stroke="#17171b" strokeWidth={2.2} />
        <path d="M73 157c-12 10-15 28-13 48l24 10 8-18-15-10Z" fill="#25252a" stroke="#17171b" strokeWidth={2} />
        <path d="M127 157c12 10 15 28 13 48l-24 10-8-18 15-10Z" fill="#25252a" stroke="#17171b" strokeWidth={2} />
        <circle cx="88" cy="203" r="6" fill={skinHex} stroke={skinShade} />
        <circle cx="112" cy="203" r="6" fill={skinHex} stroke={skinShade} />
        <path d="M68 219h31l-6 31H63ZM101 219h31l5 31h-31Z" fill="#2f3542" stroke="#17171b" strokeWidth={2} />
        <path d="M61 246h35l3 10H58ZM139 246h-35l-3 10h41Z" fill="#fff" stroke="#2f3138" strokeWidth={2} />
      </g>
    );
  }

  if (presetId === "bold") {
    return (
      <g data-preset="bold">
        <path d="M75 157c-8 9-9 25-4 39l10-5-3-25Z" fill={skinHex} stroke={skinShade} strokeWidth={2} />
        <path d="M125 157c8 9 9 25 4 39l-10-5 3-25Z" fill={skinHex} stroke={skinShade} strokeWidth={2} />
        <path d="M78 153c6-7 14-11 22-11s16 4 22 11l5 52H73Z" fill="#fff" stroke="#d7d7dc" strokeWidth={2} />
        <path d="M78 151l-9 8 8 14 8-7M122 151l9 8-8 14-8-7" fill={skinHex} stroke={skinShade} strokeWidth={2} />
        <path d="M72 204h27l-5 79H65Z" fill="#e69ab5" stroke="#a95778" strokeWidth={2} />
        <path d="M101 204h27l7 79h-29Z" fill="#e69ab5" stroke="#a95778" strokeWidth={2} />
        <path d="M74 204q26 8 52 0" fill="none" stroke="#a95778" strokeWidth={2} />
        {shoes}
      </g>
    );
  }

  if (presetId === "classic") {
    return (
      <g data-preset="classic">
        <path d="M70 157c-10 8-13 25-10 43l18 12 8-18-13-10Z" fill="#c95ce6" stroke="#7c3aed" strokeWidth={2} />
        <path d="M130 157c10 8 13 25 10 43l-18 12-8-18 13-10Z" fill="#c95ce6" stroke="#7c3aed" strokeWidth={2} />
        <path d="M70 153c9-8 19-12 30-12s21 4 30 12l7 68H63Z" fill="#c95ce6" stroke="#7c3aed" strokeWidth={2.2} />
        <path d="M90 199q10 7 20 0" fill="none" stroke={skinShade} strokeWidth={6} strokeLinecap="round" />
        {shirtMark}
        <path d="M69 220h30l-5 63H65Z" fill="#303036" stroke="#17171b" strokeWidth={2} />
        <path d="M101 220h30l4 63h-29Z" fill="#303036" stroke="#17171b" strokeWidth={2} />
        {shoes}
      </g>
    );
  }

  return (
    <g data-base-model="feminine">
      {/* open relaxed pose with fitted MoodMeal tee and cuffed jeans */}
      <path d="M72 159c-9 7-12 22-15 38-3 17-7 28-14 34-4 3-4 7-1 9 4 3 10-1 14-4 8-7 13-21 18-40l7-29Z" fill={skinHex} stroke={skinShade} strokeWidth={2} strokeLinejoin="round" />
      <path d="M128 159c9 7 12 22 15 38 3 17 7 28 14 34 4 3 4 7 1 9-4 3-10-1-14-4-8-7-13-21-18-40l-7-29Z" fill={skinHex} stroke={skinShade} strokeWidth={2} strokeLinejoin="round" />
      <path d="M72 153c8-8 18-12 28-12s20 4 28 12l8 66c-19 6-53 6-72 0Z" fill="#c95ce6" stroke="#7c3aed" strokeWidth={2.2} />
      <path d="M64 156l15-9 6 24-19 8ZM136 156l-15-9-6 24 19 8Z" fill="#c95ce6" stroke="#7c3aed" strokeWidth={2} />
      <path d="M86 143q14 16 28 0" fill="none" stroke="#8b3fc1" strokeWidth={3} strokeLinecap="round" />
      {shirtMark}
      <path d="M68 219h31l-5 62H66Z" fill={JEANS_COLOR} stroke="#294b69" strokeWidth={2} />
      <path d="M101 219h31l2 62h-28Z" fill={JEANS_COLOR} stroke="#294b69" strokeWidth={2} />
      <path d="M66 270h28v12H66ZM106 270h28v12h-28Z" fill="#7898b4" stroke="#294b69" strokeWidth={1.4} />
      {shoes}
    </g>
  );
}

// --- Clothing --------------------------------------------------------------
// Production swap-in point: avatarAssets.ts `getClothingAsset(clothingStyle)`
// for the garment silhouette, tinted with `resolveClothingColor` — one file
// per clothing style, not per style x color.

function renderClothing(
  clothingStyle: AvatarConfig["clothingStyle"],
  clothingHex: string,
  skinHex: string
) {
  const torso = (
    <path
      d="M60 220v-40c0-24 18-38 40-42l0 0 0 0c22 4 40 18 40 42v40Z"
      fill={clothingHex}
    />
  );
  switch (clothingStyle) {
    case "hoodie":
      return (
        <>
          {torso}
          <path d="M76 148c8-8 16-12 24-13-4 8-6 14-6 22h-14c-2-4-3-6-4-9Z" fill={shade(clothingHex, 0.12)} />
          <path d="M124 148c-8-8-16-12-24-13 4 8 6 14 6 22h14c2-4 3-6 4-9Z" fill={shade(clothingHex, 0.12)} />
          <circle cx="94" cy="176" r="2.5" fill={shade(clothingHex, 0.35)} />
          <circle cx="106" cy="176" r="2.5" fill={shade(clothingHex, 0.35)} />
        </>
      );
    case "v-neck":
      return (
        <>
          {torso}
          <path d="M88 138 100 168 112 138" fill="none" stroke={skinHex} strokeWidth={10} strokeLinejoin="round" />
        </>
      );
    case "collared":
      return (
        <>
          {torso}
          <path d="M88 138 100 152 96 162Z" fill={shade(clothingHex, 0.18)} />
          <path d="M112 138 100 152 104 162Z" fill={shade(clothingHex, 0.18)} />
        </>
      );
    case "crew-neck":
    default:
      return (
        <>
          {torso}
          <path d="M84 140c6 8 10 12 16 12s10-4 16-12" fill="none" stroke={shade(clothingHex, 0.15)} strokeWidth={3} strokeLinecap="round" />
        </>
      );
  }
}

/** Production swap-in point: avatarAssets.ts `getFacialHairAsset(facialHair)`
 * (`null` for "none"), tinted with the same `resolveHairColor` as the hair
 * layers above so beard/mustache color always matches head hair color. */
function renderFacialHair(facialHair: AvatarConfig["facialHair"], hairHex: string) {
  switch (facialHair) {
    case "stubble":
      return (
        <g opacity={0.35}>
          {Array.from({ length: 18 }).map((_, i) => {
            const t = i / 17;
            const x = 68 + t * 64;
            const y = 116 + Math.sin(t * Math.PI) * 22;
            return <circle key={i} cx={x} cy={y} r={1.4} fill={hairHex} />;
          })}
        </g>
      );
    case "mustache":
      return <path d="M84 122c6 6 10 6 16 6s10 0 16-6c-4 8-10 12-16 12s-12-4-16-12Z" fill={hairHex} />;
    case "goatee":
      return <path d="M90 130c2 10 6 16 10 18 4-2 8-8 10-18-4 4-16 4-20 0Z" fill={hairHex} />;
    case "full-beard":
      return (
        <path
          d="M62 96c-2 20 4 40 18 54 6 6 13 10 20 12 7-2 14-6 20-12 14-14 20-34 18-54-6 10-18 16-38 16s-32-6-38-16Z"
          fill={hairHex}
          opacity={0.92}
        />
      );
    case "none":
    default:
      return null;
  }
}

// --- Eyes / eyebrows / mouth (the expression layer) -----------------------
// Production swap-in point: avatarAssets.ts `getEyeAsset(eyeStyle, expr.eyes)`
// and `getEyebrowAsset(eyebrowStyle, expr.eyebrows)` — one file per (style x
// expression) pair, never per (style x eyeColor) or (style x skin tone).
// `eyeContent` below IS that (eyeStyle-independent-shape x expression)
// switch today; a production illustrator additionally varies the outline by
// `config.eyeStyle`/`config.eyebrowStyle`, which this vector version instead
// approximates by scaling/spacing the same shapes (see `eyeScale`,
// `eyeSpacing`, `eyebrowWidth`/`eyebrowArch` in the main component below).
// Eyes tint with `resolveEyeColor`; eyebrows and the mouth (`getMouthAsset`,
// no separate style) tint with `resolveInkColor` so they stay legible on
// every skin tone rather than tracking a fixed or hair-based color.

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
  // resolveAvatarColors() is the one call that stands in for calling each
  // of resolveSkinColor/resolveHairColor/resolveEyeColor/resolveClothingColor
  // individually — production layer lookups (getBaseAsset, getHairAsset,
  // getEyeAsset, getClothingAsset, ...) each pair with exactly one of these.
  const { skinHex, eyeHex, clothingHex } = resolveAvatarColors(config);
  const presetStyle = PRESET_STYLE[config.presetId];
  const hairHex = presetStyle.hairHex;
  // Facial line-art color adapts to skin luma so features stay legible on
  // the deepest skin tones too — see resolveInkColor's own comment.
  const ink = resolveInkColor(skinHex);

  const eyebrowWidth =
    config.eyebrowStyle === "thin" ? 2 : config.eyebrowStyle === "thick" ? 5 : 3.5;
  const eyebrowArch = config.eyebrowStyle === "arched" ? 4 : 0;

  const eyeScale = config.eyeStyle === "round" ? 1.1 : config.eyeStyle === "almond" ? 0.88 : 1;
  const eyeSpacing = config.eyeStyle === "wide-set" ? 34 : 24;
  const eyeY = 98;
  const leftEyeX = 100 - eyeSpacing / 2;
  const rightEyeX = 100 + eyeSpacing / 2;
  const browY = eyeY - 15;

  const mouthX = 100;
  const mouthY = 130;

  const hasGlasses = config.accessories.includes("glasses");
  const hasEarrings = config.accessories.includes("earrings");
  const hasHeadband = config.accessories.includes("headband");
  const hasFreckles = config.accessories.includes("freckles");

  const a11yProps = decorative
    ? { "aria-hidden": true as const }
    : { role: "img" as const, "aria-label": `Your avatar, ${emotion} expression` };

  return (
    <svg
      viewBox={variant === "bust" ? VIEWBOX_BUST : VIEWBOX_FULL}
      className={className}
      data-avatar="true"
      data-emotion={emotion}
      data-preset={config.presetId}
      {...a11yProps}
    >
      {/* ground shadow — sits just under the bust crop in "bust" variant
          (unchanged from before Phase 2C), or under the feet/wheelchair
          wheels in "full" variant, where both poses bottom out around the
          same y */}
      <ellipse
        cx="100"
        cy={variant === "bust" ? 212 : 302}
        rx={variant === "bust" ? 44 : 70}
        ry={variant === "bust" ? 6 : 7}
        fill="#2e1065"
        opacity="0.12"
      />

      {/* hair drawn behind the head/body for long styles */}
      {renderHairBack(presetStyle.hairStyle, hairHex)}

      {/* complete body, outfit, and pose for the selected preset */}
      {renderPresetBody(config.presetId, skinHex)}

      {/* shared neck */}
      <rect x="88" y="132" width="24" height="24" rx="6" fill={skinHex} />

      {/* head */}
      <path d={headPath(config.faceShape)} fill={skinHex} />

      {/* ears */}
      <circle cx="55" cy="98" r="8" fill={skinHex} stroke={shade(skinHex, 0.12)} strokeWidth={1} />
      <circle cx="145" cy="98" r="8" fill={skinHex} stroke={shade(skinHex, 0.12)} strokeWidth={1} />
      {hasEarrings && (
        <>
          <circle cx="55" cy="106" r="2.5" fill="#ffd54a" />
          <circle cx="145" cy="106" r="2.5" fill="#ffd54a" />
        </>
      )}

      {hasFreckles && (
        <g fill={shade(skinHex, 0.3)} opacity={0.6}>
          <circle cx="80" cy="112" r="1.4" />
          <circle cx="86" cy="116" r="1.4" />
          <circle cx="114" cy="116" r="1.4" />
          <circle cx="120" cy="112" r="1.4" />
        </g>
      )}

      {/* Production swap-in point: getExpressionEffectAsset("blush") — a
          fixed-palette overlay, not tinted from any identity field. */}
      {expr.blush && (
        <>
          <ellipse cx="72" cy="112" rx="8" ry="5" fill="#f472b6" opacity={0.45} />
          <ellipse cx="128" cy="112" rx="8" ry="5" fill="#f472b6" opacity={0.45} />
        </>
      )}

      {/* eyebrows */}
      <Eyebrow shape={expr.eyebrows} cx={leftEyeX} cy={browY} side="left" width={eyebrowWidth} arch={eyebrowArch} ink={ink} />
      <Eyebrow shape={expr.eyebrows} cx={rightEyeX} cy={browY} side="right" width={eyebrowWidth} arch={eyebrowArch} ink={ink} />

      {/* eyes */}
      <Eye shape={expr.eyes} cx={leftEyeX} cy={eyeY} scale={eyeScale} eyeHex={eyeHex} ink={ink} />
      <Eye shape={expr.eyes} cx={rightEyeX} cy={eyeY} scale={eyeScale} eyeHex={eyeHex} ink={ink} />

      {/* Production swap-in point: getExpressionEffectAsset("tears") /
          ("sweatDrop") — same fixed-palette-overlay pattern as blush. */}
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

      {/* facial hair, if any — drawn over the mouth/jaw area */}
      {renderFacialHair(presetStyle.facialHair, hairHex)}

      {/* hair, front layer (over forehead/ears) */}
      {renderHairFront(presetStyle.hairStyle, hairHex)}

      {/* hasHeadband/hasGlasses/hasEarrings/hasFreckles above are all
          production swap-in points for getAccessoryAsset(accessoryId) —
          freckles tint with resolveInkColor (like eyebrows/mouth), the
          rest render in a fixed palette rather than a user-chosen color. */}
      {hasHeadband && (
        <rect x="55" y="66" width="90" height="9" rx="4.5" fill={shade(clothingHex, 0.05)} />
      )}

      {hasGlasses && (
        <g fill="none" stroke={ink} strokeWidth={2.5}>
          <circle cx={leftEyeX} cy={eyeY} r={12} />
          <circle cx={rightEyeX} cy={eyeY} r={12} />
          <line x1={leftEyeX + 12} y1={eyeY} x2={rightEyeX - 12} y2={eyeY} />
          <line x1={leftEyeX - 12} y1={eyeY} x2={leftEyeX - 18} y2={eyeY - 3} />
          <line x1={rightEyeX + 12} y1={eyeY} x2={rightEyeX + 18} y2={eyeY - 3} />
        </g>
      )}
    </svg>
  );
}
