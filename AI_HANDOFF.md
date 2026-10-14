# MoodMeal AI Handoff

## Synchronization protocol and artwork checkpoint (2026-10-14)

Shared rules: docs/AI_SYNC_PROTOCOL.md, linked by CLAUDE.md. Starting state reconciled: local c55d24f was one commit ahead of origin 8638684, no divergence. Claude honey approval preserved. Completed artwork: 35 PNGs plus prompt manifest, 72-label coverage and gallery; no screen integration yet. This checkpoint includes those assets/docs and the protocol, not the pre-existing untracked AGENTS.md. Validation: 22 FatSecret, 14 USDA, 26 knowledge tests, avatar checks, TypeScript and build pass; only outdated Browserslist warning. All 24 pending USDA JSON files match the separate private backup at ../backups/usda-pending-review-2026-10-14. No FatSecret data persisted.

Outstanding: 14 batch labels still need decisions; honey is approved but no additional recipe totals are published. Next: review artwork and integrate ingredient images separately; continue USDA approvals. Commit/push verification recorded in the follow-up handoff entry.


## Honey approved, no new totals (Claude Code, 2026-10-14)

User decisions: H1 approved FDC 169640 as generic honey; H2 approved derived conversions, 1 tsp = 7 g and 1/4 cup = 84.75 g; H3 kept missing added sugars null/Unknown. Added `src/data/usda/approved-ingredients.json`, built by `docs/usda/build-approved-ingredients.py` from the CSV snapshot. The build stops on any disagreement with the saved API report. It is read by `src/data/usdaApprovals.ts` (`approvedIngredientInput` for an exact name, quantity, unit and no notes; `recipeReviewCoverage` for coverage information only). It is not wired into recipe totals: **no recipe totals until every ingredient is reviewed** (user rule). Review JSON/MD records updated (approved: true, publishable: false). Rainbow Fruit Skewers remains the only estimate. Remaining 14 labels in the batch still await decisions.

## Goal-accurate nutrient chips (Claude Code, 2026-10-14)

Branch pushed to origin/knowledge-system-foundation (5966cb5 verified before this change). Ignored USDA evidence backed up outside the repo to `../backups/usda-pending-review-2026-10-14/` (24 files, SHA256SUMS.txt verified, no credentials). Fixed chip/explanation mismatch on Foods, Meals and Recipe Detail: when nothing matched the goal, chips used to fall back to every recorded fact, including unpublished ones, while the text said "no verified match". `nutrientDisplay` now returns goal-matched chips (the only ones explanations may cite) or, only when nothing matches, published source-supported `otherVerified` chips labelled "not matched to your <goal> picks". `verifiedNutrients` holds the shared publication gate. The no-match text now names the goal. Recommendation ranking and the pilot estimate are unchanged. Validation: typecheck, 25 knowledge tests, avatar, 14 USDA, 22 FatSecret, build and browser suite (adds a Sick/Hydration recipe check) pass. Remote avatar-redesign-phase-2 has ce06080, which is not in this branch; review it before merging.

## Checkpoint and reusable nutrition explanations (Claude Code, 2026-10-14)

Checkpoint 48a442d committed the previously uncommitted USDA duplicate-row handling, batch review docs/scripts, wording and tests; AGENTS.md left untracked and untouched; pending-review evidence remains local and ignored. The hardcoded "The fruit provides fiber" text was replaced by `explainPick` and `displayedNutrients` in src/lib/recommendations.ts. Estimate-based explanations cite only displayed, goal-matched nutrients with a known, non-zero per-serving value, attribute amounts to the whole recipe (never an ingredient), and otherwise fall back to `whyPick`. `USDA_NUTRIENT_IDS` maps knowledge nutrients to FDC IDs; omega-3 and water are intentionally unmapped. Meals with no verified match now say "A meal idea to explore…". Pilot text under Balanced Nutrition: "about 85 mg of vitamin C and about 3.5 g of fiber per serving". Validation: typecheck, 22 knowledge tests, avatar tests, 14 USDA tests, 22 FatSecret tests, build and browser suite pass. No batch approvals or new nutrition estimates. Branch is still not pushed.

## FatSecret checkpoint and resumed USDA approval review

Committed only docs/fatsecret (client, tests, README, ignore rule) as d733311 on knowledge-system-foundation. User confirmed live validation; no live response or comparison data persisted. Licensing restrictions remain unchanged. Unrelated dirty files and AGENTS.md preserved; other branches unchanged, no push/merge. Revalidated 21 saved USDA candidate IDs and comparison summaries offline for the same 15-label batch; 15 clean comparisons and six source-review flags remain. NEXT-BATCH-REVIEW.md now includes an actionable approval package, current frequency checks, corrected historical seasoning context and conditional Chamomile & Sweet Potato Toast pilot recommendation. No new recipe eligible yet, no live nutrition changes. All relevant automated checks pass.


## FatSecret precision comparison

Added Decimal rounding-interval comparisons preserving raw numeric strings/precision, including JSON numeric lexemes. Serving intervals scale to 100 g using fixed declared gram weight; no blanket percentage tolerance. Nutrient statuses: equivalent-within-precision, meaningful-discrepancy, missing-or-incomparable, with separate exactMatch and displayed precision assumptions. Portion discrepancies and identity-review requirements unchanged. Twenty synthetic FatSecret tests, 14 USDA tests, 19 knowledge tests and typecheck passed. No live API request/data persistence or approved USDA changes; local recheck pending. Follow-up remains uncommitted on knowledge-system-foundation.

## FatSecret Tk lifecycle repair

Reproduced the exact ttk ThemeChanged error from immediately destroying a probe root then creating a second Tk root. Replaced probe/display roots with one lifetime-managed root. Guarded manual/timeout/finally close cancels callbacks and destroys once; 15-minute protection retained. No real FatSecret data persisted or fetched. Source-specific gram comparisons remain separate; synthetic conflict test added. Real Tk manual/timeout subprocess regressions included. USDA data and all branches unchanged; follow-up edits uncommitted.

## Temporary FatSecret development client

Added docs/fatsecret/fatsecret_review.py, synthetic tests, README and cache ignore rule. Separate source IDs; memory-only OAuth token/response/comparison; native attributed Tk display expires after 15 minutes; no file/report export, no data stdout, no publication path. Basic scope default, premier only when explicitly supplied and permitted. Registered IP/account entitlement still required. Eleven synthetic tests, 14 USDA tests, 19 knowledge tests, typecheck and build pass. No authenticated FatSecret call performed; user local testing pending. USDA runtime/calculations unchanged. Licensing questions drafted in chat but not sent; written clarification still required for recommendations, long-term storage and publication. New changes uncommitted on knowledge-system-foundation; other work preserved.

## Next batch API review completed

All 21 candidate IDs for 15 labels were retrieved by the user locally. Offline comparison completed: 15 clean nutritional comparisons; six flagged (almond butter duplicate phytosterol, almonds/avocado unknown phytosterol records, rolled-oats RACC portion, whole/low-fat Greek-yogurt water precision differences). NEXT-BATCH-REVIEW.md and next-batch-review.json now include findings and actual retrieval dates; pending-review/next-batch-comparison.json retains comparisons. Honey is ready for approval, other recipe identities/measurements remain conditional. No new recipe fully eligible, no imports/publication; stop for user approval. Fourteen Python tests, 19 knowledge tests and typecheck pass. API checkpoint remains ae01366; follow-up work uncommitted.

## Candidate fetch recovery

User batch saved FDC 168482 and 168483, then stopped at 168588 with duplicate nutrient IDs. Tool now preserves duplicate rows/raw response, leaves the normalized ambiguous nutrient null and flags manual review; comparisons cannot report clean when duplicates exist. Batch script now skips existing pending reports. Fourteen Python tests, 19 knowledge tests and typecheck passed. User must rerun the same local script to retrieve the remaining evidence. No approved records or branches changed; fixes uncommitted.

## API checkpoint and next review batch

Checkpoint ae01366 contains only docs/usda/fdc_review.py, test_fdc_review.py, API-REVIEW.md and .gitignore. Existing explanation changes, batch-02 work and AGENTS.md remain uncommitted. Twelve Python tests, 19 knowledge tests, typecheck and build passed before commit; master and avatar-redesign-phase-2 unchanged. NEXT-BATCH-REVIEW.md and next-batch-review.json prepare 15 labels/21 candidate IDs using retained CSV evidence. API retrieval dates remain null pending the user running fetch-next-batch.ps1 locally; do not describe these as API-verified. No new recipe is fully eligible yet. Do not import/publish before review approval.

## USDA comparison classification — 2026-10-14

fdc_review.py now groups differences and reports material/informational/missing-value/portion/preparation counts, clean nutrition versus exact compared-fields match. Twelve Python tests pass. Saved live blueberry report reprocessed offline into pending-review/20261014T073837Z-407f7dbb49aa40c19283499dad9b50a9.json; original evidence retained. Result: 13 informational fields (12 empty-category fields and one equivalent publication-date format), zero material differences. No approved nutrition files changed, no API request or credential access, no publication or branch changes. Existing knowledge tests, typecheck, avatar checks and build passed.

## Local USDA API review tool

Added docs/usda/fdc_review.py, test_fdc_review.py, API-REVIEW.md and a local .gitignore for pending-review and Python cache files. Read-only search/exact-ID fetch, process-environment credentials, sanitized errors, pending-only reports and optional comparison against retained pilot CSV records. No runtime imports or publication path. Nine mocked Python tests, 19 knowledge tests and typecheck passed. Live API testing deliberately NOT performed; user must run the PowerShell command in API-REVIEW.md locally for FDC 171711. Existing changes and branches preserved; additions are uncommitted.

## 2026-10-14 follow-up: checkpoint and batch 02

Pilot committed as `f30094a` on knowledge-system-foundation after typecheck, 19 knowledge tests, avatar checks, build and browser checks passed. Other branch refs unchanged; no push. The following follow-up edits remain uncommitted: natural meal explanations and documentation-only USDA batch 02. The pilot explanation now uses its verified fiber estimate without adding health claims. Nutrition cards and disclosures unchanged.

Batch 02 re-read 17 USDA records for the top 12 remaining labels directly from the supplied CSVs, retaining descriptions, portion rows, all nutrient definitions/units and nulls. See docs/usda/BATCH-02-REVIEW.md, batch-02-review.json and batch-02-source-records.json. Honey is a clear candidate awaiting approval; other items need identity, preparation or measurement decisions. No additional recipe is eligible yet. All 61 labels are triaged in docs/usda/REMAINING-TRIAGE.md. Runtime source data was not expanded. Same automated checks passed after wording changes; browser errors empty. Pre-existing AGENTS.md remains untracked and untouched.

## 2026-10-14 USDA pilot integration checkpoint

Current checkout confirmed: `knowledge-system-foundation`, HEAD `3292282`. It is one checkpoint ahead of `avatar-redesign-phase-2` (`7edaaf7`); master remains `7d49790`. No branch switching, resets, merges, commits or pushes performed. Pilot changes below are uncommitted. Pre-existing untracked AGENTS.md was preserved. Older branch/worktree descriptions below are historical.

User approved only Rainbow Fruit Skewers for USDA integration testing: FDC 167762/144 g whole raw hulled strawberries, 169124/165 g raw pineapple chunks, 171711/74 g raw blueberries, two equal servings. Recipe Detail shows calculated USDA estimates (85 kcal, 1.2 g protein, 21.7 g carbs, 0.4 g fat, 3.5 g fiber), reference weights and provenance. Added sugars remain null/Unknown. These are not laboratory-verified or kitchen-tested.

Implemented exact-recipe approval gating, null-preserving calculation and source records. Standardized five approved recipe measurements; chili-flake gram conversion and sea-salt composition remain unresolved, with no dependent nutrition published. No storage migration or expansion to other recipe totals. See docs/usda/README.md for decisions, retained calculation/source files and remaining 61-label review-only queue. Existing external review report also updated.

Validation passed: typecheck, build, 19 knowledge tests, avatar tests, full browser suite with pilot at 320/390/1440 px, reloads and other-recipe fallback. Browser reported no errors. Mobile pilot screenshot inspected. Further ingredient approvals are required before expanding nutrition coverage.

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


### Temporary nutrition review interface (2026-10-14)
- FatSecret review now has source IDs/preparation overview, nutrient and serving tables, selected-basis counts, expandable technical details and an expiration countdown. Data remains memory-only; USDA records and publication logic are unchanged.
- Missing amounts take precedence over unit checks. Unknown units are distinct from incompatible known units.
- Validation: 22 FatSecret tests including real Tk UI/closure, 14 USDA tests, 19 knowledge tests, avatar tests, TypeScript and build pass. Build reports outdated Browserslist data. No authenticated requests, branch changes or commits for this interface work.


## Ingredient artwork extension (2026-10-14)
Generated 35 separate PNG illustrations with built-in image generation in public/assets/ingredients. Existing 35 food and 24 meal WebPs preserved; all catalog paths exist. docs/ingredient-artwork-manifest.json retains prompts/source paths; coverage JSON maps all 72 current recipe labels to illustrative assets, with alternatives kept explicit. Gallery HTML supports visual review. New ingredient images are not wired into app screens yet; no nutrition or recipe identity decisions changed. Files remain uncommitted.
