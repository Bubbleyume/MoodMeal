> Wellness features: see [docs/WELLNESS.md](docs/WELLNESS.md) for the glossary, health preferences, tracking, reminders, self-care, privacy and validation.

> Current avatar UI: exactly three transparent PNG presets (Feminine,
> Androgynous, Masculine). See [AVATAR_MVP.md](AVATAR_MVP.md) for storage,
> migration and validation details. Older art-system sections below describe
> the deferred customization pipeline, not the current chooser.

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
- The user avatar (see below) is a hand-authored vector illustration system
  rather than artist-painted artwork, for the same "no image hosting
  reachable, and no image-generation tool in this environment" reason.

## Avatar system (Avatar Redesign Phases 1–2)

MoodMeal has exactly two visual identities: the official logo
(`BrandLogo.tsx`/`BRANDING.logo`, used sparingly — app icon, a small brand
mark on Welcome/loading/About) and each user's own personalized avatar.
There is no separate mascot character. One user creates one avatar; that
same avatar represents them everywhere MoodMeal shows a face, across all 12
moods — only the expression changes, never the identity.

### Identity: three choices

`AvatarConfig` is exactly `{ baseStyle, skinTone, hairStyle }`, chosen in
the Creator in that order — **Style → Skin Tone → Hairstyle**:

| Field       | Options                                                                  |
| ----------- | ------------------------------------------------------------------------ |
| `baseStyle` | Feminine, Masculine, Androgynous (body, outfit, and pose)                |
| `skinTone`  | Fair, Light, Medium, Tan, Deep, Rich                                     |
| `hairStyle` | Long Wavy, Straight, Braids, Short Curly, Short Straight, Buzz Cut, Bald |

All three are independent, giving 3 × 6 × 7 = 126 combinations. Hair color
isn't stored; the renderer uses one fixed natural tone.

### Files

```
src/types/avatar.ts           AvatarConfig (identity) and ExpressionSpec
                              (per-mood, never identity-bearing)
src/data/avatarOptions.ts     option lists (id + label + swatch hex) and
                              DEFAULT_AVATAR_CONFIG
src/data/avatarMigration.ts   normalizeAvatarConfig — converts any older
                              stored avatar into the current shape
src/data/avatarExpressions.ts EmotionId -> ExpressionSpec
src/hooks/useAvatar.ts        localStorage persistence ("moodmeal:avatar");
                              normalizes every read and self-heals the
                              stored copy once
src/components/avatar/
  Avatar.tsx                  the ONE character renderer (inline SVG)
  AvatarCreator.tsx           Style → Skin Tone → Hairstyle UI
  AvatarRadioGroup.tsx        accessible radiogroup used by every picker
  AvatarPreview.tsx           a framed <Avatar> for cards/headers
```

`Avatar.tsx` is the only place that knows how an avatar is drawn — skin
palettes, body, outfit, hair, and expression layers all live there. The
earlier split between an asset-resolution module (`avatarAssets.ts`, which
mapped ids to planned `/assets/avatars/<layer>/*.svg` files that never
existed) and a separate vector renderer was retired in Phase 1.
`public/assets/avatars/` (empty placeholder folders plus its README, now
marked unused) and `docs/preset-character-reference.png` are left on disk
until the Phase 2 art is signed off.

### Art system (Avatar Redesign Phase 2)

The characters are one illustration family drawn as layered inline SVG:
flat fills, a darker same-hue outline on every shape, and hand-placed
shadow and highlight shapes lit from the top left. No gradients or filters
are used, so a screen full of avatars stays cheap and needs no unique SVG
ids. Every character wears the same white MoodMeal tee, blue jeans, and
white sneakers in one relaxed standing pose, about four heads tall.

- **Base style** is a small set of proportions (`STYLE_SHAPE`): shoulder
  and waist width, neck width, a slightly softer or squarer jaw, and brow
  weight. The face, pose, and outfit are shared, so the three styles read
  as subtle presentation differences rather than stereotypes.
- **Skin tone** picks a hand-tuned palette (`SKIN_PALETTES`) with its own
  shadow, highlight, outline, lip, cheek, and brow colors, rather than one
  computed overlay. Light tones keep their warmth, and deep tones keep
  visible form and readable brows and mouths. Facial features are
  identical across tones.
- **Hairstyles** each have a back layer (behind the head and body) and a
  front layer (over the scalp and shoulders), drawn against the shared
  head anchors so they sit on the scalp for every base style. Buzz Cut and
  Short Straight share a close-cropped cap; Buzz Cut adds scattered
  texture marks, and Short Straight adds a fuller swept top.

`variant="full"` (default) draws the whole figure (`viewBox="0 0 200 310"`).
`variant="bust"` zooms to head and shoulders (`38 12 124 136.4`, the same
aspect ratio as before) so faces and hair stay readable in the 32–56px
contexts: mood tiles, the result hero, expression buttons, and Profile
thumbnails. `AvatarPreview` frames the full figure in a portrait stage
shaped like the figure, and the bust in a circle.

To review the art, render every combination with
`renderToStaticMarkup(<Avatar … />)` into a contact sheet. Each `<svg>`
carries `data-base-style`, `data-skin-tone`, and `data-hair-style`.

### Legacy avatar migration

`normalizeAvatarConfig` runs on every read and accepts:

- **Phase 1** `{ baseStyle, skinTone, hairStyle }`: kept as-is.
- **Seven-preset model** (`presetId`): mapped to the base style and
  hairstyle that preset was drawn with — `feminine`, `braids` → Feminine
  (Long Wavy / Braids); `masculine`, `classic` → Masculine (Short
  Straight); `seated` → Masculine (Short Curly); `androgynous` →
  Androgynous (Short Straight); `bold` → Androgynous (Buzz Cut).
- **Three-model** (`baseModel`) and **Phase 2C** (`frame: "soft" | "bold"`,
  `pose`) avatars: `baseModel` is used directly, and `frame: "bold"` maps
  to Masculine (anything else to Feminine). The stored hairstyle is kept.
- **Phase 2B** hairstyle ids (`buzz`, `curly`, `coily-afro`, `locs`, `bun`,
  …) map to the nearest current style, and the `porcelain` skin tone maps
  to Fair.

Retired fields (hair color, face shape, eye/eyebrow styles, facial hair,
clothing, accessories, frame, pose, presetId, baseModel) are dropped.
Invalid values fall back to the defaults. A stored value that isn't an
object is treated as "no avatar yet".

### Accessibility

Each Creator step is a `role="radiogroup"`, labelled by its visible
heading, with one `role="radio"`/`aria-checked` button per option and a
roving tabindex: Tab enters or leaves the group in one stop, arrow keys
move the selection (wrapping), Home/End jump to the first or last option,
and Space/Enter select. A checked option shows a checkmark as well as a
ring, so selection never relies on color alone.
