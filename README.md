# MoodMeal

MoodMeal is an AI-ready nutrition and wellness app that connects how you're
feeling with nutrient-rich food and meal suggestions. This is a fully
functional frontend MVP: every interaction (mood check-in, recommendations,
grocery list, mood history) works end-to-end against local structured data,
with an architecture designed to swap that data layer for Supabase + an AI
model later without touching the UI.

## Running it

```bash
npm run dev       # local dev server with auto-rebuild, http://localhost:5173
npm run build     # production build -> dist/
npm run preview   # serve the production build, http://localhost:4173
npm run typecheck # tsc --noEmit
```

No `npm install` step is required to run these — see **"About this
environment"** below for why, and what to do once you have normal npm
access.

## Tech stack

- React 19 + TypeScript, function components + hooks only
- A hand-built bundler pipeline using **esbuild** (Vite's role) and the
  **Tailwind CSS v3 CLI** (both real, unmodified upstream packages — see
  below for why they're vendored instead of `npm install`ed)
- A small first-party client-side router (`src/lib/router.tsx`) with a
  react-router-dom-shaped API (`BrowserRouter`, `Routes`, `Route`, `Link`,
  `useNavigate`, `useParams`, `useLocation`)
- A first-party icon set (`src/components/icons`) with a lucide-react-shaped
  API (`size`, `color`, `strokeWidth`, `className` props)
- A hand-rolled SVG chart (`src/components/MoodChart.tsx`) standing in for
  Recharts
- `localStorage` persistence for the grocery list, mood history, profile,
  and in-progress mood check-in

## About this environment

This project was built inside a sandboxed environment whose network egress
allowlist does not include `registry.npmjs.org`, `unpkg.com`,
`cdn.jsdelivr.net`, `raw.githubusercontent.com`, or any other package
registry/CDN — only `github.com`'s API is reachable. That means `npm
install` cannot fetch anything here.

To still deliver a real, running app rather than a mockup, the project
**vendors already-installed copies** of genuine upstream packages found
elsewhere on the machine straight into `node_modules/` (no network calls):
React 19.2.6, TypeScript, esbuild 0.27.7, and Tailwind CSS 3.4.19 (plus
Tailwind's own dependency tree). These are the *real* packages, just copied
onto disk instead of downloaded — `npm run build`/`dev`/`typecheck` use
them directly via the scripts in `scripts/`.

Three packages the spec called for — **react-router-dom**, **lucide-react**,
and **recharts** — were not available anywhere on the machine and couldn't
be fetched, so first-party equivalents were written instead (see "Tech
stack" above). They intentionally mirror each library's public API shape so
swapping them back in later is a small, mechanical change:

- **react-router-dom**: replace the `from "../lib/router"` imports with
  `from "react-router-dom"` and drop `src/lib/router.tsx`. Component names
  and props (`Routes`, `Route path/element`, `Link to`, `useNavigate`,
  `useParams`, `useLocation`) already match.
- **lucide-react**: replace `from "../components/icons"` (or `./icons`)
  imports with `from "lucide-react"`, keeping the same icon names
  (`Home`, `Heart`, `ShoppingCart`, etc.) and props.
- **recharts**: rebuild `src/components/MoodChart.tsx`'s internals using
  Recharts' `<AreaChart>`/`<LineChart>` — the `MoodHistoryEntry[]` prop
  contract can stay the same, so no page needs to change.

There's also `src/types/react-shim.d.ts` — a hand-written ambient
declaration file standing in for `@types/react`/`@types/react-dom` (also
unavailable). Once you have normal registry access, `npm i --save-dev
@types/react @types/react-dom` and delete that file for full, precise
official types.

None of this affects what ships to the browser: the compiled output is a
plain static `dist/` folder (HTML/CSS/JS) that runs anywhere.

## Architecture

```
src/
  components/    Reusable UI (Button, Card, Header, BottomNavigation,
                 EmotionCard, FoodCard, MealCard, GroceryItem, MoodChart,
                 icons/, avatar/ (personalized user avatar), BrandLogo,
                 ImagePlaceholder, WellnessDisclaimer)
  pages/         One component per route/screen
  data/          Local structured mock data (emotions, foods, meals,
                 recipes, sample mood history) — the layer to swap for
                 Supabase queries later
  hooks/         localStorage-backed state (grocery list, mood history,
                 profile, draft mood-in-progress)
  lib/           Router, recommendation engine, dietary filtering,
                 storage helpers
  types/         Shared TypeScript interfaces
```

### The recommendation engine

`src/lib/recommendations.ts` exports `getRecommendations({ emotionId,
intensity, dietaryPreferences })`, which returns matched foods/meals plus a
short explanation. Every screen calls this one function — swapping it for a
Supabase query + AI model call later means changing this file only, not any
page.

### Health & safety

Nutrition copy throughout `src/data/*.ts` deliberately avoids medical or
treatment claims (no "cures anxiety", no "boosts serotonin"). Language
stays in "supports general wellness" / "part of a balanced diet" territory,
and `src/components/WellnessDisclaimer.tsx` is shown on any screen that
gives food suggestions.

## Known trade-offs (MVP scope)

- Dietary preference filtering (`src/lib/dietary.ts`) is keyword-based
  against ingredient/food names — good enough to make the Profile setting
  actually affect recommendations today, but not a substitute for real
  per-item tagging.
- Food/meal/recipe "photos" are gradient-and-emoji placeholders
  (`src/components/ImagePlaceholder.tsx`) since no image hosting/CDN was
  reachable from this environment and inventing external image URLs that
  might 404 was explicitly out of scope. Swap that one component for an
  `<img>` once you have real photography.
- The user avatar (see below) is drawn as hand-coded SVG shapes rather than
  illustrated artwork, for the same "no image hosting reachable, and no
  image-generation tool in this environment" reason.

## Avatar system (Phase 2B / 2B.1 / 2C)

MoodMeal has exactly two visual identities: the official logo
(`BrandLogo.tsx`/`BRANDING.logo`, used sparingly — app icon, a small brand
mark on Welcome/loading/About) and each user's own personalized avatar.
There is no separate mascot character. One user creates one avatar; that
same avatar represents them everywhere MoodMeal shows a face, across all 12
moods — only the expression changes, never the identity. Three layers, kept
deliberately separate so any one of them can change without touching the
others:

```
src/types/avatar.ts          STATE       — AvatarConfig (identity, chosen
                                            once) and ExpressionSpec (per-
                                            mood, never identity-bearing)
src/hooks/useAvatar.ts       STATE       — localStorage persistence,
                                            survives refresh/restart, wiped
                                            by "Clear Local Data"; runs every
                                            read through avatarMigration.ts
src/data/avatarOptions.ts    STATE       — the customization menu (every
                                            pickable id + its label/swatch)
src/data/avatarMigration.ts  STATE       — normalizes a saved AvatarConfig
                                            from an older option set (see
                                            "Phase 2C simplification" below)
src/data/avatarExpressions.ts STATE      — EmotionId -> ExpressionSpec map
src/data/avatarAssets.ts     RESOLUTION  — id -> style/shape asset ref and
                                            id -> color resolvers, kept
                                            separate (see below); the ONLY
                                            file that should know what a
                                            real asset file's path would be
src/components/avatar/
  Avatar.tsx                 RENDERING   — draws the resolved layers as SVG
  AvatarCreator.tsx                      — the customization UI
  AvatarPreview.tsx                      — a framed <Avatar> for cards
  AvatarOptionPicker.tsx                 — the reusable swatch/pill picker
public/assets/avatars/       (future)    — where real illustrated layer
                                            files land — see its README.md
```

### Phase 2C simplification

To keep the first production art pack tractable, the Creator UI now walks
through only five short steps — **Choose Your Frame** (Soft Frame / Bold
Frame — a non-gendered body/silhouette choice, never a gender category),
**Choose Your Pose** (Standing / Seated — a presentation choice, not a
separate body-type or identity category; Seated is written to conceptually
support a wheelchair-based presentation), **Pick a Skin Tone** (6 tones,
Fair through Rich), **Pick a Hairstyle** (7 styles), and **Pick a Hair
Color** — plus one standard outfit ("MoodMeal shirt" + jeans) every avatar
wears, no longer a Creator choice. `AvatarConfig` still models the full
Phase 2B option set underneath (face shape, eye style/color, eyebrow style,
facial hair, clothing style/color, accessories) — those fields are simply
fixed at a sensible default for new avatars and left untouched for avatars
that chose something before Phase 2C, so a future advanced-customization
mode can bring any of them back without a data migration or renderer
rework. `avatarMigration.ts`'s `normalizeAvatarConfig` is what makes an
avatar saved before Phase 2C (missing `frame`/`pose`, using a retired skin
tone or hairstyle id, wearing a since-removed clothing choice) load
correctly under the new option set; `useAvatar.ts` runs it on every read
and self-heals the stored copy.

The canvas grew to fit a real standing/seated pose: `Avatar` now renders a
full figure (`viewBox="0 0 200 310"`) by default, with legs+shoes for
Standing or shorter bent legs plus a wheelchair-conceptual hint (a seat
rail and two wheel outlines) for Seated — see `renderLowerBody` in
Avatar.tsx. Small/decorative contexts that only need the face to read at
32-56px (mood tiles, the bottom-sheet face, the Creator's tiny expression
previews, Profile's avatar thumbnails) pass `variant="bust"`, which crops
back to the pre-2C `viewBox="0 0 200 220"` framing instead of shrinking the
face to make room for legs nobody could see at that size anyway — see the
`variant` prop on `Avatar`/`AvatarPreview`/`EmotionFace`. The "frame"
choice (Soft/Bold) is expressed in this vector renderer as a body-width
transform on the torso/legs (see `frameScale` in Avatar.tsx) rather than
two fully hand-drawn bodies — a shortcut the production art brief below
calls out explicitly.

To replace the temporary vector rendering with production artwork later:
point each `avatarAssets.ts` style/shape getter (`getBaseAsset`,
`getHairAsset`, `getLowerBodyAsset`, `getEyeAsset`, `getEyebrowAsset`,
`getMouthAsset`, `getFacialHairAsset`, `getClothingAsset`,
`getAccessoryAsset`, `getExpressionEffectAsset`) at a real file instead of
the placeholder `/assets/avatars/<layer>/<name>.svg` path, and update the
small number of `render*`/`<Eye>`/`<Eyebrow>`/`<Mouth>` functions in
`Avatar.tsx` (each already commented with which getter/resolver it
corresponds to) to draw an `<image>` tinted via CSS/SVG filter, or a
pre-masked layer, instead of a vector path. Nothing else (state,
persistence, the Creator UI, or any page that renders `<Avatar>`) needs to
change.

### Production art brief

The rule that matters most, unchanged from before: **draw shapes, not
colors.** Every identity field is either a SHAPE choice (a hairstyle, a
frame, a pose) or a COLOR choice (a hair color, a skin tone) — never both
baked into one file. A production illustrator delivers one uncolored
silhouette per shape (or per shape × expression, for eyes/eyebrows/mouth)
and this app tints it at render time from `avatarAssets.ts`'s color
resolvers. **Never deliver a separate fully-colored file for every shape ×
color combination.**

- **Canvas**: match the renderer's full-figure `viewBox="0 0 200 310"` (a
  200×310 unit standing/seated figure) — the top 220 units are exactly the
  old bust framing, so a bust-only crop still works for small contexts.
  Deliver at a high base resolution (e.g. 1000×1550px or native SVG) so it
  scales cleanly from a 32px preview button up to a 300px+ Welcome hero.
- **Format**: per-layer files as transparent-background greyscale/alpha
  masks or native SVG with a single tintable fill (SVG preferred); PNG/WebP
  masks at 1x/2x/3x if rasterized. No layer should ship pre-colored.
- **Registration**: every layer shares one fixed anchor so swapping any
  single layer still lines up with every other one. Anchor points, in the
  renderer's 200-wide coordinate space: head center ≈ (100, 98), eye
  baseline y ≈ 98, mouth center ≈ (100, 130), shoulder/waist line ≈ y 220,
  standing feet ≈ y 288-296, seated wheel centers ≈ y 273.
- **Style**: cute, human, chibi-inspired; large expressive eyes; rounded
  features; friendly, colorful, clean, polished. Compatible with
  MoodMeal's purple/pink/green identity without copying any specific
  reference character pixel-for-pixel. The Seated illustration should read
  as a genuine, respectful wheelchair presentation (a real seat, frame and
  wheels) rather than the current placeholder's simplified wheel-outline
  hint — this is the single highest-value upgrade the first art pack can
  make over the vector renderer.

**Starter pack — what the current, simplified Creator UI actually needs**
(every one of these is either directly user-chosen, or the one fixed value
every MVP avatar currently uses):

  - `base/soft`, `base/bold` — 2 files — tint: skin color. Unlike the
    placeholder renderer's transform-based shortcut, these should be two
    genuinely distinct body illustrations (see FrameId's comment in
    types/avatar.ts).
  - `hair/{short-cut,buzz-cut,long-wavy,curly,coily,braids,locs}` — 7 files
    — tint: hair color — no per-color file.
  - `lower-body/standing`, `lower-body/seated` — 2 files — fixed jeans +
    shoe palette (not user-tintable). `seated` is the wheelchair
    illustration called out above.
  - `eyes/round--<expression>` — 9 files (one `EyeStyleId`, the only one a
    new avatar gets today, × 9 `EyeShapeKey` expressions) — tint: eye
    color.
  - `eyebrows/natural--<expression>` — 8 files (one `EyebrowStyleId` × 8
    `EyebrowShapeKey` expressions) — tint: the contrast-adaptive ink color,
    not hair color, so brows stay legible on every skin tone.
  - `mouths/<expression>` — 12 files (all `MouthShapeKey` values) — tint:
    ink color.
  - `clothing/crew-neck` — 1 file, the "MoodMeal shirt" — tint: clothing
    color (only "brand-purple" is ever selected today, but the resolver
    supports any `ClothingColorId`).
  - `effects/{blush,tears,sweatDrop}` — 3 fixed-palette overlay files.
  - **Starter pack total: ~44 shape files** plus the existing skin/hair/eye/
    clothing color swatches already defined in `avatarOptions.ts` — small
    enough to commission in one pass, unlike a full cross-product.

**Full option set already modeled** (not exposed in the current Creator,
but real `AvatarConfig` fields an advanced-customization mode could restore
without any renderer rework): 3 `FaceShapeId` values, 3 `EyeStyleId` values,
4 `EyebrowStyleId` values, 5 `FacialHairId` values (`facial-hair/<id>`,
tint: hair color), 4 `ClothingStyleId` values, and 4 `AccessoryId` values
(`accessories/<id>`, mostly fixed-palette; freckles tint with ink color).
Producing art for these now is optional — nothing in the current app
requires it — but `avatarAssets.ts`'s getters already have the right shape
for it (`getEyeAsset(eyeStyle, expression)` etc.), so there's no
architecture to redo later, only more files to add.

**Compound lookups**: `avatarAssets.ts` exports `resolveLayer(asset,
config)` / `resolveTint(tint, config)` to pair any getter's output with its
resolved color for one avatar in a single call — the shape (file + color) a
production renderer actually consumes per layer.

**What must NOT vary between expression sets**: frame, pose, skin tone,
hairstyle/color, clothing — only the eyes/eyebrows/mouth/(blush/tears/sweat)
layer changes per mood, and none of those may be drawn with a specific skin
tone, hair color, or eye color baked in — that's what makes it possible for
a shape file to be reused across every user who happens to share that
style.
