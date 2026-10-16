# MoodMeal AI Handoff

## Open Food Facts mapper on API v3.5, with conflict check (Claude Code, 2026-10-16)

Started at 1ef2f8b, equal to origin.

Mapper changes (`src/lib/openFoodFacts.ts`):
- Lookups use `/api/v3.5/product/{code}` with `fields=…,nutrition` and read `nutrition.aggregated_set`. The legacy `nutriments` and the top-level `nutrition_data_per` are no longer read.
- All existing rules are kept: grams only for per-100 g products sold by weight, no ml→g conversion, a product serving only with an explicit gram weight, null for missing values, zeros kept, modifiers excluded.
- Units are converted explicitly per entry (g/mg/µg; kcal/kJ at 4.184); other units are refused.
- Values from `source: "estimate"` are excluded.
- Carbohydrates prefer `carbohydrates-total` (which includes fiber).

Conflict check:
- `findConflicts` compares the as-sold packaging input sets (per 100 g vs per serving with a gram weight).
- It flags only differences beyond half the US label rounding step on each side.
- Conflicts appear in the preview (`ConflictNotice`), the ingredient row's note, a per-nutrient "Source values conflict" marker in the results, and the calculation details.
- Values are never corrected, and no product is special-cased.
- The investigated noodles record (0810111890373) flags carbohydrates only; its other copied values fall within rounding.

Validation:
- 44 knowledge tests pass. The mocked v3.5 fixtures replace the legacy ones and cover units, estimates, carbohydrates-total, legacy fields ignored, and the conflict cases (rounding edges, kJ, ml/estimate/prepared sets).
- Typecheck, avatar tests, 14 USDA tests, 22 FatSecret tests, the build, and the browser suite (v3.5 mock routes plus a conflict flow) pass. Mobile was checked by emulation only.
- Live: 1 v3.5 read (Nutella) matched the earlier v3 values with no false conflict. The noodles record was verified offline from the saved v3.5 response.

## Open Food Facts discrepancy investigation (Claude Code, 2026-10-16)

Started at cbdc99a, equal to origin. Barcode 810111890373 (normalized by OFF to 0810111890373) is Momofuku Sesame Miso Noodles.

**Cause:** the **source record is internally inconsistent**. Its v3.5 input sets hold two packaging sets with identical protein, carbs, fat, fiber, sugars and sodium (12/60/8/1/7 g/1.12 g): one is per 100 g, the other per 103 g serving. Only energy (349.51 vs 360 kcal) and added sugars were rescaled. The last editor was macrofactor.

**MoodMeal's handling:**
- The mapper reproduces the aggregated `_100g` values exactly.
- "350 kcal" is rounding of 349.51.
- One pack (103 g) calculates to 360 kcal, as on the label, but 12.36/61.8/8.24/1.03/7.21 g for the other nutrients, 3% high because of the source.
- There was no mapping bug, and the app doesn't correct the record or handle this product specially.

**General change:**
- The preview table is renamed "Open Food Facts values".
- `previewValues` adds a per-serving column when a gram serving exists, so per-serving package labels can be compared.
- A note says values are shown as recorded and not corrected.

**Follow-up:** automatic inconsistency detection needs v3.5 `nutrition.input_sets`. v3 doesn't return them, and v3.5 drops the legacy `nutriments`, so it needs a mapper migration first.

The full comparison table is in `docs/OPEN-FOOD-FACTS.md`. This investigation made 4 live read requests.

Validation:
- 44 knowledge tests pass, including a new mixed-basis regression test with a synthetic record.
- Typecheck, avatar tests, 14 USDA tests, 22 FatSecret tests, the build and the browser suite (new per-serving column check) pass.

## Open Food Facts barcode lookup in the Nutrition Calculator (Claude Code, 2026-10-15)

Started at cf16a7d, equal to origin. Details and the licensing review are in `docs/OPEN-FOOD-FACTS.md`.

Code:
- `src/lib/openFoodFacts.ts`: barcode validation, read-only API v3 lookup, mapping, rate limiter.
- `src/components/ProductLookup.tsx`: lookup UI and preview.
- `nutritionCalculator.ts`: `source`, `productFood`, and an `extraFoods` parameter on `calculateCustom` and `findFood`.
- `NutritionCalculatorPage.tsx`: lookup section, product rows, source labels and provenance.

Behaviour:
- Barcodes: EAN-8, UPC-A, EAN-13 and GTIN-14 with check digit; leading zeros kept.
- Lookups run only on an explicit button press. There are no retries, and found/not-found results are cached for the session. The app limits itself to 10 lookups per minute with at least 3 s between them; OFF's limit is 15 per minute per IP.
- Lookup states: loading, not-found, timeout, network-error, rate-limit (60 s, since Retry-After isn't CORS-exposed) and error.
- The preview must be confirmed before a product is added.
- Grams are offered only for per-100 g products sold by weight. Volume-unit or per-100 ml products, unclear bases, and products with no nutrition are not calculable. A product serving is offered only with an explicit gram weight.
- Mapping is explicit. kJ is converted to kcal at 4.184. Missing values stay null, zero stays zero, modifier and estimated values are excluded.
- Results show mixed-source labels and per-ingredient provenance. Allergen and ingredient text is shown safely.
- Nothing is stored or published. The USDA list stays at 17 and catalog nutrition is unchanged.

Validation:
- 43 knowledge tests pass, 6 new, with mocked fetch.
- Typecheck, avatar tests, 14 USDA tests, 22 FatSecret tests and the build pass.
- The browser suite passes with mocked OFF routes covering found/confirm, mixed totals, liquid refusal, 404, 429, network error, invalid input, the client limiter and the cache, plus overflow at 320/390/1440 px (emulation only).
- Live: 3 staging and 2 production reads by script, plus 1 production read from the browser, which confirmed CORS with `X-User-Agent`.

Unresolved before public deployment: a contact in the app identifier, the OFF usage form, an ODbL share-alike decision before any persistence, keeping OFF data out of medical tools, and real-device testing.

## Verification of calculator count and polish items (Claude Code, 2026-10-15)

Started at 4c351f9, equal to origin.

Calculator count reconciled: `approved-ingredients.json` holds 16 approval records (honey H1–H3; B1–B7, B9–B11, B13, B14; C1, C2, with B4 split into raw egg 171287 and hard-boiled egg 173424). Those 16 records cover 15 unique FDC IDs, because "Eggs" (B5) reuses 171287. The pilot adds strawberries 167762 and blueberries 171711; its pineapple 169124 is already approved. 15 + 2 = 17 selectable foods.

Not selectable:
- pending Greek yogurt (2705422/3/4) and avocado (171705/171706);
- unapproved alternates: 168483 baked sweet potato, 168875 medium-grain rice, 170401 boiled chard, 2346396 Foundation oats;
- all unreviewed labels.

Held recipe uses (power-bowl egg, chopped almonds, sautéed chard, diced pineapple, pancake cinnamon) don't remove a record. The calculator only offers that record's approved per-unit measures.

The six polish items were already in place at 4c351f9: 10 s undo, per-deletion notices, notices in layout above the nav, single-entry wording, grocery fractions, and US customary standard. One gap was fixed: `tidyVolume` hardcoded 48 and 3, and now reads `US_VOLUME_IN_TSP`. The build script also gained a comment naming the standard. The approved data rebuilt byte-identical. The calculator test now asserts the 16 → 15 + 2 = 17 reconciliation and that the excluded IDs are not selectable.

Validation:
- Typecheck, avatar tests, 14 USDA tests, 22 FatSecret tests and the build pass.
- 37 knowledge tests pass.
- The browser suite passes.

## Undo and grocery polish (Claude Code, 2026-10-15)

Started at 4bb9c94, equal to origin.

**Undo:**
- `UNDO_MS` is 10 s.
- Each deleted entry gets its own notice ("Tired entry from October 14 deleted." / Undo) with its own timer, so consecutive deletions stay recoverable in any order.
- Hovering or focusing the notices pauses every countdown, which resumes with the time remaining. Escape dismisses all notices and moves focus to "All Entries".
- A keyboard delete moves focus to that notice's Undo; Undo moves focus back to the restored row.
- `restoreEntry` puts an entry back by date in the newest-first stored list, replacing the old index-based restore.
- The notices now take real layout space above the bottom nav instead of floating over the list, so they can't cover any entry, including the last one, at any width.

**History wording:**
- One entry: "Your tired mood intensity was 6/10."
- Several identical entries: "…were all 6/10 intensity".
- Otherwise the range is unchanged.

**Grocery:**
- New `src/lib/units.ts` defines the single volume standard, US customary: 1 cup = 8 US fl oz = 16 tbsp = 48 tsp.
- Grocery aggregation uses it. A test checks that the 4 cross-unit USDA-derived approved conversions (honey tsp; pumpkin seed and almond tbsp) follow the same ratios.
- `readableQuantity` shows common fractions on grocery rows (0.875 cup → ⅞ cup, 1.5 → 1½, 0.0625 → 1/16), with a screen-reader form ("7/8 cup"). Stored quantities are unchanged.
- Ingredient and notes matching are unchanged.

**Validation:**
- Typecheck, avatar tests, 14 USDA tests, 22 FatSecret tests and the build pass.
- 37 knowledge tests pass, 3 of them new.
- The browser suite passes, run once at a time. New checks: 10-second expiry, pause and resume, Escape, three deletions undone in any order with storage restored exactly, no overlap with the list or nav at 360 px, the last row of a long list sits above the notices, and ⅞ cup / 1½ cup cooked.
- Mobile results are emulation only, not tested on a physical device.

## Nutrition Calculator (Claude Code, 2026-10-15)

Started at e452f05, equal to origin. Location: Wellness tab → "Nutrition Calculator" card (route `/nutrition-calculator`; the Wellness tab is highlighted).
- `src/lib/nutritionCalculator.ts` builds 17 calculator foods from `approved-ingredients.json` plus the three Rainbow Fruit Skewers pilot records. Each has a display name, an explicit preparation state (for example "Raw, peeled flesh" or "Cooked"), and a note where needed.
- Household measures come only from approved conversions (grams ÷ approved quantity) or the pilot's approved USDA portions; grams are always available. There is no honey tbsp, no skin-on sweet potato, and no dry rice.
- It reuses `calculateNutrition`, so a missing value makes that nutrient's total and per-serving amount null. The UI then shows "Unknown" and "Incomplete: no USDA value for …".
- Reports calories, protein, carbs, fat, fiber and total sugars for the whole recipe and per serving.
- Amounts accept 2, 1.5, .5, 1/2 and 1 1/2, greater than 0 and up to 10,000. Servings must be a whole number from 1 to 100. While any input is invalid, no result is shown.
- Inputs live in page state only: no localStorage key, no approval, and nothing is attached to a recipe. `usdaPilot.ts` now exports `PILOT_INGREDIENTS` (no behaviour change). No FatSecret data and no API is involved.

Also fixed: the Mood History Undo button now receives focus after a keyboard delete from a post-render effect; before, it intermittently failed.

Validation:
- Typecheck, avatar tests, 14 USDA tests, 22 FatSecret tests and the build pass.
- 34 knowledge tests pass, including 4 for the calculator: approved-only measures, known banana values, serving division, conversions, reproducing the skewers pilot energy, missing-nutrient nulls, invalid inputs, and no catalog changes.
- The browser suite passes three times in a row, including calculator flow, validation, overflow at 320/390/1440 and no storage writes.

## Usability review and accessibility fixes (Claude Code, 2026-10-15)

Started at 64646f4, equal to origin. The full report is in `docs/USABILITY-REVIEW-2026-10-15.md`. All mobile results are **automated emulation** (Edge/Playwright at 360/390/430/768 px); no physical device was used.

Fixed:
- **High:** an invalid saved check-in, or a profile saved in the wrong shape, no longer blanks Result/Foods/Meals/Profile. `useDraftMood` validates the check-in, `readStorage` rejects an array where an object is expected, and `useProfile` merges defaults. Stored data is never rewritten.
- Mood intensity sheet: focus moves to the slider when it opens; Escape closes it and returns focus to the mood card.
- Bottom navigation: `aria-current`, a Leaf icon for Wellness, a screen-reader badge count, and better-contrast labels.
- Grocery inputs are labelled; the Profile switch is named.
- Touch targets are now 44 px for grocery done/remove/add, history delete and the sheet close button.
- `text-slate-400` → `text-slate-500` (WCAG AA) across the app.
- Heading structure on Result and Glossary; summaries at least 24 px; accurate About copy; "1 entry" pluralization.
- `tests/knowledge.browser.cjs` gained regression checks for these fixes.

Follow-up approved by the user and done: an undo snackbar for Mood History deletes (in memory only, 8 s, paused on focus or hover) and tsp/tbsp/cup grocery conversion (`tidyVolume` in src/lib/grocery.ts; same-unit rows preferred; saved lists not rewritten). Still outstanding: the remaining 36 px controls and the non-modal sheet. Real-device testing (iOS Safari, Android Chrome, VoiceOver/TalkBack) is still required.

## Remaining 14 USDA labels approved, no new totals (Claude Code, 2026-10-14)

Started at 887a7f9, equal to origin. The user approved every row marked **Approve** in `docs/usda/BATCH-REMAINING-14-PROPOSAL.md` (B1-B7, B9-B11, B13, B14, C1, C2) with their recommended conventions. Held uses stay on hold, and Greek yogurt (B8) and avocado (B12, "Prefer", not "Approve") stay pending. Honey and the skewers pilot are unchanged; the honey record is byte-identical.

How approvals are stored:
- `build-approved-ingredients.py` now writes 16 records to `src/data/usda/approved-ingredients.json`.
- Each conversion carries its quantity, unit, notes, recipeIds, grams and USDA portion ID.
- `approvedIngredientInput(line, recipeId)` matches all of these exactly, so an egg is raw 171287 in the Hash but hard-boiled 173424 in the Avocado Toast.
- `extract-source-records.py` writes CSV rows for the records not already retained (171320, 171706, 172688, 173904, 174156) to `approved-source-records.json`.
- The build stops if any CSV nutrient differs from the saved API report.
- Added sugars stay null for every record; USDA-reported zeros stay zero.

Recipe text changes:
- The label "Whole-grain bread" is now "Whole-wheat bread" (recipe, meal and artwork coverage). Old grocery items saved under the previous name show the leaf fallback.
- The Toast tea step now says "1 cup (8 fl oz) hot water… then remove the bag".

Evidence: three API reports were fetched this session (171320, 174156, 171706); all match the CSV. The private backup holds 27 files, SHA256 verified.

Validation:
- Typecheck, avatar tests, 14 USDA tests, 22 FatSecret tests and the build pass.
- 29 knowledge tests pass, including a new test that pins every approved recipe/label use and checks the held uses stay null.
- The browser suite passes with no console errors.

Chamomile & Sweet Potato Toast is now fully reviewed at the ingredient level, but **no totals are calculated or shown**; only Rainbow Fruit Skewers has an estimate. Next, needing the user: decide whether the Toast's sweet potato is peeled, and approve publishing its estimate. Greek yogurt fat level and avocado record are also pending.

## Ingredient artwork integrated into screens (Claude Code, 2026-10-14)

Started from 760a339, equal to origin. The 35 ingredient illustrations now appear in the app. `src/data/ingredientImages.ts` is the central resolver: it reads `docs/ingredient-artwork-coverage.json` directly and matches exact labels (case-insensitive) only, with no fuzzy aliases, so oat flour never shows steel-cut oats. Grocery items added from a Food card fall back to that food's own artwork, and anything else returns no image. `IngredientThumb` shows the image on the ivory artwork background. It overlaps two images for labels such as "Salt & pepper" and "Hoisin or soy sauce", and shows a neutral leaf when there is no artwork or an image fails to load. It uses alt text "Illustration of …", lazy loading and fixed 160×160 dimensions.

Where the images appear: every Recipe Detail ingredient row, Grocery rows (replacing the full-resolution food image previously used there), and a strip of up to six ingredient thumbnails on each Meal card. Food cards and all meal/recipe hero images are unchanged, because every one of the 35 foods already has its own artwork.

Thumbnails: `scripts/make-thumbnails.py` (Pillow) builds 160 px WebP images, about 5 KB each, in `public/assets/ingredients/thumbs/` and `public/assets/foods/thumbs/`. The original PNG and WebP files are untouched and are never requested by the UI. The coverage manifest was already accurate: it covers all 72 recipe/meal labels, and all 35 PNGs are used.

Validation:
- Typecheck, avatar tests and the production build pass.
- 28 knowledge tests pass, including new coverage and resolver tests.
- The browser suite passes. New checks cover Recipe Detail ×2, Grocery, Meals and Foods at 320, 390 and 1440 px: no broken, distorted or oversized thumbnails, no overflow, no requests for full-resolution ingredient PNGs, and no console errors.

The pre-existing duplicate "Salt & pepper" ("to taste") grocery rows are aggregation behaviour and were not changed. No USDA approvals or nutrition changes.

## Synchronization protocol and artwork checkpoint (2026-10-14)

Shared rules: docs/AI_SYNC_PROTOCOL.md, linked by CLAUDE.md. Starting state reconciled: local c55d24f was one commit ahead of origin 8638684, no divergence. Claude honey approval preserved. Completed artwork: 35 PNGs plus prompt manifest, 72-label coverage and gallery; no screen integration yet. This checkpoint includes those assets/docs and the protocol, not the pre-existing untracked AGENTS.md. Validation: 22 FatSecret, 14 USDA, 26 knowledge tests, avatar checks, TypeScript and build pass; only outdated Browserslist warning. All 24 pending USDA JSON files match the separate private backup at ../backups/usda-pending-review-2026-10-14. No FatSecret data persisted.

Outstanding: 14 batch labels still need decisions; honey is approved but no additional recipe totals are published. Next: review artwork and integrate ingredient images separately; continue USDA approvals. Artwork/protocol implementation commit `6bb0b865660b90956b0d2031ec2bdbbc70d6156f` was pushed and verified equal to origin/knowledge-system-foundation. This handoff-only follow-up records that hash. Remaining local-only items: unchanged AGENTS.md, ignored USDA evidence and Python caches. Private backup remains outside Git. Other local branch refs were unchanged; no merges or rebases.


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
- `src/data/foods.ts` and `meals.ts` still contain `emoji` fields. Grocery rows now use painted ingredient/food thumbnails (2026-10-14); `ImagePlaceholder` is no longer imported by any screen.
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
4. Finish replacing emojis and placeholders (the leftover `emoji` fields in the data and the now-unused `ImagePlaceholder` component; Grocery items are done).
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
Generated 35 separate PNG illustrations with built-in image generation in public/assets/ingredients. Existing 35 food and 24 meal WebPs preserved; all catalog paths exist. docs/ingredient-artwork-manifest.json retains prompts/source paths; coverage JSON maps all 72 current recipe labels to illustrative assets, with alternatives kept explicit. Gallery HTML supports visual review. New ingredient images are not wired into app screens yet; no nutrition or recipe identity decisions changed. Artwork files committed in 6bb0b86.
