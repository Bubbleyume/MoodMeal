# MoodMeal AI Handoff

_Last updated: 2026-10-13 by Claude Code (inspection only, no app code changed)._

## Current Project Status

MoodMeal is a frontend-only React/TypeScript web app (PWA manifest, no backend) that connects a user's mood check-in to food and meal ideas. It is moving from a simple **Mood → Food** app to a **transparent, sourced food-and-wellness knowledge system**. The flow is now **Mood → Support Goal → Nutrients/Food → Meals**.

Core flow: Welcome → Onboarding (avatar + preferences) → Mood selection (12 emotions + intensity) → Analyzing → Result (support goal, nutrient chips, foods, meals, "Why this pick?") → Foods / Meals / Recipe Detail → Grocery List → Mood History (chart + observations). The app also has Wellness education, a glossary, a local content library with a review workflow, and some optional personal health tools.

All data lives in local TypeScript data files and the browser's `localStorage`. There are no accounts, server or AI calls yet.

## Current Architecture

- **App root:** `moodmeal/` is the git repo. The parent `Downloads/MoodMeal/` folder holds loose art, reference images and spec files and is **not** under version control.
- **Stack:** React 19.2.6 + TypeScript, Tailwind CSS 3.4.19 and esbuild 0.27.7, driven by custom scripts in `scripts/` (`dev`, `build`, `serve`, `typecheck`, `test-avatars`, `test-knowledge`). There is no Vite.
- **Vendored deps:** `node_modules/` is committed on purpose because the original environment had no npm registry access. Runtime additions: `fflate` and `pdfjs-dist` (used for resource import).
- **First-party stand-ins:** `src/lib/router.tsx` (react-router-dom API), `src/components/icons/` (lucide-react API), `src/components/MoodChart.tsx` (in place of Recharts) and `src/types/react-shim.d.ts` (in place of @types/react).
- **`src/types/`:** `index.ts` (core app types), `avatar.ts` (AvatarConfig, appearances), `library.ts` (Provenance, ReviewStatus, EvidenceStatus, ClaimType, GoalId, NutrientFact, StructuredIngredient, FoodPreferences, Candidate, Interaction).
- **`src/data/`:** `emotions`, `foods`, `meals`, `recipes` (raw catalog), `knowledge.ts` (NUTRIENTS, GOALS, FOOD_FACTS, `source()` provenance helper), `education`, `glossary`, plus avatar data (`avatarPresets`, `modularAvatars`, `avatarOptions`, `avatarMigration`, `avatarAppearance`, `avatarExpressions`).
- **`src/lib/`:** `recommendations.ts` (goalsForMood, matchingNutrients, whyPick, getRecommendations), `catalog.ts` (enrichFood/Meal/Recipe; parses ingredients into structured records; allergen tags), `preferences.ts` (food-preference filtering), `grocery.ts` (quantity aggregation), `interactions.ts` (save/view events + history insights), `libraryReview.ts` (extract candidates, flags, canPublish, status transitions), `resourceImport.ts` (PDF/EPUB/TXT/MD/JSON), `wellness.ts`, `dietary.ts`, `storage.ts`.
- **`src/pages/`:** one page per route (22 routes in `src/App.tsx`), including `/preferences`, `/library`, `/learn/:id`, `/glossary/:id`, `/health`, `/tracking`, `/reminders` and `/self-care`.
- **localStorage keys** (`src/lib/storage.ts`): `moodmeal:` + `preferences`, `interactions`, `library`, `groceryList`, `moodHistory`, `profile`, `draftMood`, `avatar`, `health`, `measurements`, `reminders`.
- **Assets:** `public/assets/foods/` (35 webp), `public/assets/meals/` (24 webp), `public/assets/avatars/layers-v1/` (layered WebP avatar parts), `modular-v1/` (312 precomposed PNGs) and `presets/` (3 legacy PNGs).
- **Docs:** `README.md` (setup + older avatar SVG history), `AVATAR_MVP.md` (3-preset era), `docs/AVATARS.md` (current modular avatar system), `docs/WELLNESS.md`, `docs/food-artwork-manifest.json` and `docs/food-artwork-revisions.json` (prompts used to generate the food art).

## Completed Features

- 12-emotion mood check-in with intensity, and a draft check-in that survives reloads.
- Support-goal engine: 7 goals (`steady-energy`, `calm-grounded`, `focus-attention`, `wind-down`, `balanced-nutrition`, `hydration`, `everyday-mood-support`). Moods and intensity map to goals, and goals rank foods and meals by verified nutrients.
- "Why this pick?" explanations come only from nutrient facts that are published and source-supported. Tappable nutrient chips show short educational explanations.
- Structured recipes (servings, prep/cook/total time, structured ingredients, allergens, dietary tags, support goals, provenance, review status).
- Grocery List combines compatible quantities across recipes. "Add ingredients to Grocery" is implemented.
- Food Preferences page: dietary pattern, allergies, intolerances, dislikes, cuisines, skill, budget, max prep time and recommendation type. These filter and rank results.
- Provenance schema plus a Draft → Needs Review → Reviewed → Published (or Rejected) workflow. The Library page imports resources and extracts **candidates only**. It flags treatment and supplement claims, and publishing requires source and copyright checks.
- Mood History: chart plus neutral observations from the user's own records (frequency, time of day, intensity, saved foods/meals). Seed/demo data is excluded and causation is never claimed.
- Wellness screen refocused on food-and-mood education. The health, reminder and tracking tools moved into a collapsed "Personal tools" section.
- Painted food and meal illustrations (`FoodImage.tsx`) replace emojis on Foods, Meals and Recipe cards.
- Modular avatar: Soft Frame and Bold Frame characters, 6 skin tones, 7 hairstyles each, hair and eye color, and per-mood expressions. Each frame remembers its own appearance. Legacy avatars are kept.
- Glossary (12+ terms), self-care page, wellness disclaimer.
- Tests: `npm run typecheck` ✓, `npm run test:avatars` ✓ and `npm run test:knowledge` ✓ (13 tests). All were verified passing on 2026-10-13.

## Current Design Decisions

Do not reverse these without explicit instruction.

- **Avatar labels are not gendered in the UI.** Use "Soft Frame" and "Bold Frame" (`CHARACTERS` in `src/data/modularAvatars.ts`). Internal ids stay `feminine`/`masculine` for storage compatibility. Never show "Boy" or "Girl" to users.
- **Avatar storage is backward compatible.** Keep the `moodmeal:avatar` key and the `baseStyle`/`skinTone`/`hairStyle` fields. `artworkVersion: "modular-v1"` opts into modular art. Unversioned (legacy preset) avatars are never auto-converted. Saved ids such as `short-curly` and `straight` keep their meaning (see `docs/AVATARS.md`).
- **Avatar rendering:** layer order is scalp underlay → back hair → base → expression → irises → front hair. Color filters apply only to hair and irises, never to skin or clothes. All layers preload first, and a partial face is never shown. The avatar represents the user, and there is no separate mascot.
- **Recommendation architecture** is Mood → Support Goal → Nutrient/Food → Meal. A recommendation must never show an explanation that doesn't match its displayed nutrients or goal.
- **Claims and wording:** wellness and educational wording only. Never say "treats", "cures", "reduces anxiety" or similar. Food is never presented as the only influence on mood. Supplements are informational only and never recommended. MoodMeal never recommends medications.
- **Only published, source-supported facts reach users.** Imported resources create candidates, never published copy. Copyrighted prose is not copied into the app.
- **History insights are observational.** Use "You frequently saved X after Tired check-ins", never "X improved your mood".
- **Health conditions are optional.** They never automatically generate medical nutrition advice. Kidney disease disables condition-based ranking.
- **Food visuals use one style:** hand-painted gouache illustrations on an ivory `#fffaf3` background (see `docs/food-artwork-manifest.json`). Do not mix them with emojis or stock photos.
- Keep the clean, friendly design language, mobile-first layout and accessible radiogroup pickers.
- All user data stays local in localStorage. "Clear Local Data" must clear every key.

## Current Git State

- **Repo:** `moodmeal/`, remote `origin` = `https://github.com/Bubbleyume/MoodMeal.git`
- **Branch:** `avatar-redesign-phase-2` (up to date with origin). Other branches: `master` and `avatar-redesign-phase-1`.
- **Latest commit:** `7edaaf7` (2026-10-05) "Add wellness glossary, health preferences, tracking and reminders"
- `origin/master` is still at `7d49790` "Checkpoint: polished MVP before avatar redesign".
- ⚠️ **A large amount of work is uncommitted:** 46 modified files (about +1100/−590 lines) and many untracked files and folders, including `src/types/library.ts`, `src/lib/catalog.ts`, `libraryReview.ts`, `resourceImport.ts`, `interactions.ts`, `grocery.ts`, `preferences.ts`, the Library, Preferences and Education pages, `public/assets/foods/`, `public/assets/meals/`, `public/assets/avatars/layers-v1/`, `modular-v1/` and `docs/AVATARS.md`. **GitHub does not yet reflect the knowledge-system refactor, the modular avatars or the food art.**

## Recent Changes

1. (Uncommitted) Knowledge-system refactor: library schema, provenance, review workflow, support goals, explainable recommendations, structured recipes, grocery aggregation, food preferences, history insights and resource import.
2. (Uncommitted) Food and meal emojis replaced with painted WebP illustrations.
3. (Uncommitted) Modular avatar customization (Soft and Bold Frame) and the October hair revisions (`-r2` assets).
4. (Uncommitted) Wellness screen refocused on education, with medical-style tools moved under "Personal tools".
5. `7edaaf7`: wellness glossary, health preferences, measurement tracking and reminders.
6. `0cff412`: three preset avatars and a refreshed opening screen.

## Known Issues

- **Uncommitted work at risk.** Commit it before starting new features.
- `.gitignore` excludes `work/` and `node_modules/{fflate,pdfjs-dist,@napi-rs}`, so a fresh clone may lack the runtime deps `fflate` and `pdfjs-dist`. Check this before pushing.
- `nutrientTotals` is `null` for every recipe (`src/lib/catalog.ts`), so recipes have no verified nutrition totals yet.
- Seeded knowledge provenance is mostly NIH/ODS fact sheets. There is no `reviewedBy` workflow with real reviewers, and library review state lives only in localStorage.
- `src/data/foods.ts` and `meals.ts` still contain `emoji` fields. `GroceryItem.tsx` and `AssetImage.tsx` still use `ImagePlaceholder`, so the Grocery list visuals may still be emoji/gradient based.
- Profile has a "Daily mood check-in reminder (placeholder)" toggle (`src/pages/ProfilePage.tsx:95`).
- The mood → goal mapping is hard-coded in `goalsForMood` (only worried, nervous and angry at intensity 8+ add `wind-down`), and some mappings are questionable (e.g. `excited → hydration`).
- Docs are stale or inconsistent. `README.md` and `AVATAR_MVP.md` describe older SVG and 3-preset avatar systems. `docs/AVATARS.md` says "Girl/Boy" while the UI uses Soft/Bold Frame. `package.json` `notes` has mojibake and references a missing `VENDORING.md`.
- `npm run build` has hit Node spawn `EPERM` in some sandboxes. The docs describe an equivalent manual esbuild + Tailwind path.
- react-router-dom, lucide-react, Recharts and @types/react are still first-party stand-ins.
- Medicine reminders, health tracking and health notes still exist (deprioritized, not removed).

## Current Development Priority

**Stabilize and commit the knowledge-system foundation.** Get the current uncommitted work committed and pushed to GitHub (on the current branch or a new feature branch), with docs updated, before starting new features. Then finish the remaining gaps in the foundation, such as verified nutrient totals and review tooling. AI features stay paused until that foundation is stable.

## Next Tasks

1. Review and commit the uncommitted work in logical commits (knowledge system, food art, modular avatars, wellness refocus). Confirm `.gitignore` doesn't drop required runtime deps, then push.
2. Update `README.md`, `AVATAR_MVP.md` and `docs/AVATARS.md` so they match the current system (Soft/Bold Frame, support goals, library workflow).
3. Add verified `nutrientTotals` for recipes, with provenance.
4. Finish replacing emojis and placeholders (Grocery items, the leftover `emoji` fields in the data, and `ImagePlaceholder` usage).
5. Move the mood → support-goal mapping into reviewable data and revisit questionable mappings.
6. Add "Sources / Learn why" drawers consistently on Food, Meal, Recipe and Result screens.
7. Expand Wellness education content for all 11 target categories (Food & Mood Basics, Steady Energy, Focus, Sleep & Wind-Down, Calm, Cooking as Self-Care, Gut & Digestion, Sensitivities & Special Diets, Balanced Nutrition, Hydration, Glossary).
8. Strengthen the library review workflow (reviewer identity, export/import of reviewed library, tests).
9. Merge `avatar-redesign-phase-2` to `master` once it is stable.
10. Later: begin AI features that retrieve from the reviewed library ("Why did you recommend this?", substitutions, serving-size changes) and cite library records.

## Files Most Relevant to Current Work

- `src/types/library.ts`, `src/types/index.ts`
- `src/lib/recommendations.ts`, `src/lib/catalog.ts`, `src/lib/preferences.ts`, `src/lib/grocery.ts`, `src/lib/interactions.ts`
- `src/lib/libraryReview.ts`, `src/lib/resourceImport.ts`, `src/pages/LibraryPage.tsx`
- `src/data/knowledge.ts`, `src/data/foods.ts`, `src/data/meals.ts`, `src/data/recipes.ts`
- `src/pages/MoodResultPage.tsx`, `FoodsPage.tsx`, `MealsPage.tsx`, `RecipeDetailPage.tsx`, `MoodHistoryPage.tsx`, `WellnessPage.tsx`, `PreferencesPage.tsx`
- `src/components/FoodCard.tsx`, `MealCard.tsx`, `FoodImage.tsx`, `Knowledge.tsx`
- `src/data/modularAvatars.ts`, `src/components/avatar/Avatar.tsx`, `AvatarCreator.tsx`, `src/data/avatarMigration.ts`
- `src/lib/storage.ts`, `src/App.tsx`
- `tests/knowledge.test.ts`, `tests/modularAvatars.test.ts`, `tests/wellness.test.ts`
- `docs/AVATARS.md`, `docs/WELLNESS.md`
- Product spec for the current phase: `../Update MoodMeal so it evolves.txt` (outside the repo)

## Rules for AI Collaboration

- Read this file before making major changes.
- Update this file after major features or architectural changes.
- Do not reverse established project decisions without explicit instruction.
- Keep this file concise and current.
- Treat GitHub as the source of truth for the current codebase. **Exception right now:** significant local work is not yet pushed (see Current Git State). Check `git status` before assuming GitHub is complete.
- Run `npm run typecheck`, `npm run test:avatars` and `npm run test:knowledge` before handing off.
