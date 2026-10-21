> Wellness features: see [docs/WELLNESS.md](docs/WELLNESS.md) for the glossary, health preferences, tracking, reminders, self-care, privacy and validation.

# MoodMeal

MoodMeal uses a local, sourced food and wellness library with transparent support-goal matching. Runtime recommendations do not call AI or search the internet. See [docs/KNOWLEDGE-LIBRARY.md](docs/KNOWLEDGE-LIBRARY.md) for the review workflow, storage, current limits and validation.

The current avatar chooser uses Soft Frame and Bold Frame with independent hairstyles and hair/eye colors. Internal avatar IDs remain compatible with existing saved choices. See [docs/AVATARS.md](docs/AVATARS.md).

## Running it

```bash
npm run dev       # local dev server with auto-rebuild, http://localhost:5173
npm run build     # production build -> dist/
npm run preview   # serve the production build, http://localhost:4173
npm run typecheck # tsc --noEmit
```

Run `npm install` to install the PDF/EPUB import and browser-test dependencies. Some original framework fallbacks remain vendored; see **"About this environment"** below.

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
- Catalog foods and meals use local painted WebP illustrations, and recipe
  ingredient artwork is mapped through a centralized resolver. Missing art
  falls back to a neutral placeholder. Dietary preference filtering remains
  keyword-based and should be replaced with reviewed per-item tags before it
  is treated as comprehensive.

## Avatar system

Onboarding and Profile offer Soft Frame and Bold Frame appearance choices,
with six skin tones, seven hairstyles per frame, hair and eye colors, and
mood expressions. Each frame remembers its own appearance. Older saved
avatars remain supported. See [docs/AVATARS.md](docs/AVATARS.md) for the
current storage, artwork, accessibility, and validation details.
