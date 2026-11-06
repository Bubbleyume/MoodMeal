# Omega-3 rule correction (option B)

**Revision 4**, prepared by Claude Code on 2026-11-06 from `3952db8`. It applies your decisions on the coordinator's two findings (session `MM-25b268bf-3609-4413-8765-2628a88b6ca6`, verdict needs owner).

## Your decisions on the coordinator findings (2026-11-06)

| Finding | Your decision | Change |
| --- | --- | --- |
| OMEGA3-001: the regenerated evidence was credited to you before you had approved it | Credit it as an AI-assisted calculation under the reviewed rule. The rule and the chia reference have been reviewed; approving the regenerated results is a separate decision with its own date. Committing the code must never change the attribution automatically. | `catalog.ts`: omega-3 food-tag evidence has `reviewOrigin: "ai-assisted"`, with `reviewedBy` "AI-assisted calculation (Claude Code) under the owner-reviewed omega-3 rule and chia reference; the regenerated results are not yet owner-approved". It is dated 2026-11-06 (the calculation) and stays published. Every other food tag keeps its owner approval. The generator's omega-3 notes say the same. A test fails if this evidence is ever credited to the owner, so only a deliberate, dated change can do that. |
| OMEGA3-002: the generic `perServing` field showed an unknown amount as 0 | Set MT-107's `perServing`, `alaPerServing` and `combinedPerServing` to `null`, and keep it not shown. The same applies to any omega-3 meal with no known path amount. Keep a numeric zero where the evidence supports it. The other unweighed tags belong to the separate meal-tag work. | `mealTagRule.ts`: `perServing` is now `number \| null`. It is null only for an omega-3 meal with neither path amount known, and a known 0 stays 0. MT-107: `perServing: null`. Other nutrients keep the batch 5 number. |

**Data diff from revision 3:**

- `mealTagReviews.ts`: MT-107 `perServing` changes from 0 to `null`, and nothing else changes.
- `foodTagReviews.ts`: the three omega-3 notes gain the provenance sentence.
- No status changes: 78 meet, 1 below and 30 not shown; the three omega-3 food tags stay published.

**Tests added:**

- MT-107 `perServing` is `null`.
- For every omega-3 meal, `perServing` is null exactly when neither path amount is known, and such a meal is not shown.
- Non-omega-3 `perServing` stays numeric.
- The omega-3 food-tag evidence is AI-assisted and never credited to the owner.
- The batch-wide provenance check expects AI-assisted for omega-3 and owner-approved for the rest.

---

Revision 3 (the fixes for your review of revision 2) follows, with the parts these decisions change updated.

## Your review of revision 2, and the fixes

## Your review of revision 2, and the fixes

| Finding | Fix |
| --- | --- |
| MT-107 reported 0 with nothing weighed. The meal rule summed an empty list to 0 and turned unknown ALA into 0. | `mealTagRule.ts`: a path's amount is `null` when no tagged line is weighed, or when a weighed line's food lacks that path. Nothing is coerced to 0. MT-107 is now `{ path: null, alaPerServing: null, combinedPerServing: null }` and stays not shown. A reported zero still counts as zero: the walnut EPA, DPA and DHA, measured (A, n=7), keep walnuts' combined total equal to their ALA. |
| The food-tag generator rounded before applying the threshold, so 0.159 g rounded to 0.16 g and passed. | The omega-3 evidence logic moved into a pure module, `tools/research/moodmeal_research/omega3.py`. The 0.16 g criterion is applied to the unrounded amount, and only the stored display values are rounded. Each record also stores its unrounded per-100 g amounts (`alaPer100g`, `omega3Per100g`). The meal rule now calculates from those unrounded values, and its path decision (`omega3MealPath`) is exported and tested. |

**Regression coverage:**

- **Knowledge test:** `omega3MealPath` at 0.159 g (fails on each path) and 0.16 g (meets); unknown and measured zero; MT-107's null amounts; and every stored omega-3 value equalling its unrounded amount rounded for display, with each path decided on the unrounded amount.
- **Research test** `tests/test_omega3.py` (11 tests):
  - a 0.159 g ALA record that displays as 0.16 g but fails, and the same on the combined path;
  - 0.1602 g meets;
  - every record must meet, combined first;
  - a missing component leaves the total unknown;
  - a reported zero stays zero;
  - derivation-code precedence;
  - no-code rows counting only with data points;
  - recipe-calculated rows excluded;
  - the ALA row choice (1404, then 1270).

**Data diff from revision 2:**

- `mealTagReviews.ts`: MT-107's two path amounts change from 0 to `null`, and nothing else changes.
- `foodTagReviews.ts`: the unrounded per-100 g fields are added, and the notes now say the decision uses unrounded amounts.
- No status, path or displayed value changes.

Revision 2's text follows, updated where these fixes change it.

**Nothing is committed or pushed.** This change is separate from the meal-tag approval work, and it approves no meal-tag result. MT-003 stays pending, because its cooking evidence is unresolved.

## Your decisions (2026-11-06)

1. **Rule: option B.**
   - Two explicit paths at MoodMeal's 0.16 g threshold: ALA alone, or the complete ALA + EPA + DPA + DHA sum.
   - Each path is calculated separately, so ALA can't be counted twice.
   - An unreported component keeps the combined total unknown.
   - Both thresholds are labelled as MoodMeal's criteria.
2. **Food-tag evidence: K1 applies to the omega-3 food tags in this change.**
   - The Atlantic and coho rows, which have data points but no derivation code, are flagged.
   - Cooked sockeye 173692 is recipe-calculated (RA), so it isn't eligible.
   - The salmon tag is rechecked after that exclusion.
3. **Chia:** FDC 170554 is the reference for this omega-3 calculation: 5.35 g of ALA per 30 g, and 1.87 g of ALA per serving from chia in MT-063. The combined total stays unknown, and the "lower of two records" wording is removed.
4. **Scope:** separate from the meal-tag approvals. Regenerate the affected evidence, show any status or wording changes, and bring back the diff and the test results.

## What changed

| File | Change |
| --- | --- |
| `tools/research/generate_food_tag_reviews.py` | Omega-3 section rewritten (details below); it now uses `moodmeal_research/omega3.py` |
| `tools/research/moodmeal_research/omega3.py` (new) | The pure omega-3 evidence functions: K1 row classes, per-path unrounded amounts, the criterion, the tag path, display rounding |
| `tools/research/tests/test_omega3.py` (new) | 11 unit tests, run by `npm run test:research` |
| `src/data/foodTagReviews.ts` | Regenerated. Only the three omega-3 entries change. New fields: `alaGrams`, `omega3Path`, `omega3Zeros`, `noCodeRows`; `omega3Grams` may now be null. New constant: `OMEGA3_RULE_DATE = "2026-11-06"`. |
| `src/lib/mealTagRule.ts` | Omega-3 is checked per path, from unrounded per-100 g amounts, with ALA and combined calculated separately. A path's amount is null when nothing is weighed or a weighed line's food lacks it. A meal's combined total is unknown unless every weighed line's food has a complete combined value. The combined path is used when it meets. Each omega-3 result records `omega3: { path, alaPerServing, combinedPerServing }`. Other nutrients are unchanged. |
| `src/data/mealTagReviews.ts` | Regenerated. Only the `omega3` records are added, and no status or per-serving value changes. |
| `src/lib/catalog.ts` | The omega-3 food-tag source line is written per path, names what was counted, calls 0.16 g MoodMeal's criterion, and flags no-code values. Omega-3 evidence is dated 2026-11-06. |
| `tests/knowledge.test.ts` | The batch 4 check now reads per path. A new omega-3 test covers both paths, no zero-fill, chia on 170554, the salmon exclusion and flags, walnut zeros, the wording, and MT-063. |

The generator rewrite in detail:

- Every component row is classified under K1: the derivation code first (A, AI and AR qualify, any other code doesn't); no code qualifies only with data points > 0, and is flagged.
- ALA alone and the complete four-component sum are computed separately, and a missing or ineligible component makes the sum null.
- A record with neither path is excluded and named in the tag's note.
- Chia is restricted to 170554.
- A tag meets on the combined path when every eligible record meets it, otherwise on the ALA path when every eligible record meets that, otherwise the script stops.

Not changed:

- the meal-tag research packet, its scripts and its approval sheet;
- every non-omega-3 food tag and meal tag;
- the published recipe estimates.

## Results

**No status changes.** All three omega-3 food tags stay published. All 109 meal-tag records keep their status and per-serving value: 78 meet, 1 below and 30 not shown.

| Food tag | Path | Evidence after the correction |
| --- | --- | --- |
| Wild salmon | combined | Atlantic 173686: 2.22 g (flagged, no code). Coho 175136: 1.62 g (flagged, no code). Sockeye 173691: 0.93 g (measured, A). **Cooked sockeye 173692 excluded (RA).** Every remaining record meets the combined path. The ALA path would fail on sockeye (0.05 g), so the salmon tag rests on the combined path alone. |
| Walnuts | combined | 170187: 2.72 g, with EPA, DPA and DHA measured as zero (A, n=7). It also meets the ALA path, but the combined path is used. |
| Chia | ALA | 170554: 5.35 g of ALA (AI, n=2); combined total unknown. **2707590 no longer used** (owner reference choice; its rows are also unmeasured FNDDS values). |

| Meal tag | Status | Path | ALA per serving | Combined per serving |
| --- | --- | --- | --- | --- |
| MT-003 Salmon & Quinoa Bowl | meets (unchanged; still pending as cooking-dependent) | combined | 0.05 g | 0.96 g |
| MT-012 Warm Oatmeal with Berries | meets (unchanged) | combined | 0.66 g | 0.66 g |
| MT-063 Tropical Fruit Smoothie | meets (unchanged) | **ALA** | **1.87 g** | **unknown** |
| MT-107 Dark Chocolate Trail Mix | not shown (unchanged) | none | unknown (null) | unknown (null): nothing weighed |

The runtime meal rule still uses each food's lowest record. The line-matched proposal belongs to the separate meal-tag work. For salmon, the lowest record (sockeye raw) was already the deciding one, so excluding cooked sockeye changes no meal value.

## Wording users see (food tag sources)

The meal tags' amounts aren't shown to users, so only these food-tag source lines change.

#### chia-pudding

Before:
- FDC 170554: about 5.35 g of omega-3 fatty acids (ALA, EPA, DPA and DHA) per 30 g reference amount (Nuts, seeds and mixtures: whole or chopped); MoodMeal's own bar is 0.16 g, 10% of the ALA Adequate Intake (omega-3 has no FDA Daily Value). Snapshot FoodData_Central_csv_2026-04-30. | reviewed 2026-11-04
- FDC 2707590: about 5.35 g of omega-3 fatty acids (ALA, EPA, DPA and DHA) per 30 g reference amount (Nuts, seeds and mixtures: whole or chopped); MoodMeal's own bar is 0.16 g, 10% of the ALA Adequate Intake (omega-3 has no FDA Daily Value). Snapshot FoodData_Central_csv_2026-04-30. | reviewed 2026-11-04

After:
- FDC 170554: about 5.35 g of ALA (alpha-linolenic acid, a plant omega-3 fatty acid) per 30 g reference amount (Nuts, seeds and mixtures: whole or chopped). The USDA record doesn't report EPA, DPA or DHA, so no combined omega-3 total is given. MoodMeal's own criterion for this path is at least 0.16 g of ALA, one tenth of 1.6 g, the Adequate Intake for ALA in adult men; omega-3 has no FDA Daily Value. Snapshot FoodData_Central_csv_2026-04-30. | reviewed 2026-11-06

#### walnuts

Before:
- FDC 170187: about 2.72 g of omega-3 fatty acids (ALA, EPA, DPA and DHA) per 30 g reference amount (Nuts, seeds and mixtures: whole or chopped); MoodMeal's own bar is 0.16 g, 10% of the ALA Adequate Intake (omega-3 has no FDA Daily Value). Snapshot FoodData_Central_csv_2026-04-30. | reviewed 2026-11-04

After:
- FDC 170187: about 2.72 g of omega-3 fatty acids (ALA, EPA, DPA and DHA combined; EPA, DPA and DHA recorded as 0) per 30 g reference amount (Nuts, seeds and mixtures: whole or chopped). MoodMeal's own criterion for this path is at least 0.16 g combined, an editorial threshold set at one tenth of 1.6 g, the Adequate Intake for ALA in adult men. It is not a recommended intake for combined omega-3s; omega-3 has no FDA Daily Value. Snapshot FoodData_Central_csv_2026-04-30. | reviewed 2026-11-06

#### wild-salmon

Before:
- FDC 173686: about 2.22 g of omega-3 fatty acids (ALA, EPA, DPA and DHA) per 110 g reference amount (Fish and shellfish entrees without sauce); MoodMeal's own bar is 0.16 g, 10% of the ALA Adequate Intake (omega-3 has no FDA Daily Value). Snapshot FoodData_Central_csv_2026-04-30. | reviewed 2026-11-04
- FDC 175136: about 1.62 g of omega-3 fatty acids (ALA, EPA, DPA and DHA) per 110 g reference amount (Fish and shellfish entrees without sauce); MoodMeal's own bar is 0.16 g, 10% of the ALA Adequate Intake (omega-3 has no FDA Daily Value). Snapshot FoodData_Central_csv_2026-04-30. | reviewed 2026-11-04
- FDC 173691: about 0.93 g of omega-3 fatty acids (ALA, EPA, DPA and DHA) per 110 g reference amount (Fish and shellfish entrees without sauce); MoodMeal's own bar is 0.16 g, 10% of the ALA Adequate Intake (omega-3 has no FDA Daily Value). Snapshot FoodData_Central_csv_2026-04-30. | reviewed 2026-11-04
- FDC 173692: about 0.86 g of omega-3 fatty acids (ALA, EPA, DPA and DHA) per 85 g reference amount (Fish and shellfish entrees without sauce); MoodMeal's own bar is 0.16 g, 10% of the ALA Adequate Intake (omega-3 has no FDA Daily Value). Snapshot FoodData_Central_csv_2026-04-30. | reviewed 2026-11-04

After:
- FDC 173686: about 2.22 g of omega-3 fatty acids (ALA, EPA, DPA and DHA combined) per 110 g reference amount (Fish and shellfish entrees without sauce). MoodMeal's own criterion for this path is at least 0.16 g combined, an editorial threshold set at one tenth of 1.6 g, the Adequate Intake for ALA in adult men. It is not a recommended intake for combined omega-3s; omega-3 has no FDA Daily Value. The USDA values for ALA, EPA, DPA and DHA have no derivation code and are counted on their data points. Snapshot FoodData_Central_csv_2026-04-30. | reviewed 2026-11-06
- FDC 175136: about 1.62 g of omega-3 fatty acids (ALA, EPA, DPA and DHA combined) per 110 g reference amount (Fish and shellfish entrees without sauce). MoodMeal's own criterion for this path is at least 0.16 g combined, an editorial threshold set at one tenth of 1.6 g, the Adequate Intake for ALA in adult men. It is not a recommended intake for combined omega-3s; omega-3 has no FDA Daily Value. The USDA values for ALA, EPA, DPA and DHA have no derivation code and are counted on their data points. Snapshot FoodData_Central_csv_2026-04-30. | reviewed 2026-11-06
- FDC 173691: about 0.93 g of omega-3 fatty acids (ALA, EPA, DPA and DHA combined) per 110 g reference amount (Fish and shellfish entrees without sauce). MoodMeal's own criterion for this path is at least 0.16 g combined, an editorial threshold set at one tenth of 1.6 g, the Adequate Intake for ALA in adult men. It is not a recommended intake for combined omega-3s; omega-3 has no FDA Daily Value. Snapshot FoodData_Central_csv_2026-04-30. | reviewed 2026-11-06

## Tests (2026-11-06, revision 4)

| Check | Result |
| --- | --- |
| `npm run typecheck` | No errors |
| `npm run test:knowledge` | 55 tests pass (53 before, plus the two omega-3 tests; revision 4 adds assertions to them) |
| `npm run test:avatars` | Pass |
| `npm run build` | Complete; only the existing outdated-Browserslist warning |
| `npm run test:research` | 59 tests pass (48, plus the 11 in `test_omega3.py`) |
| `npm run test:browser` (preview on port 4175) | Pass; browser errors: none |
| Generators rerun | `foodTagReviews.ts` and `mealTagReviews.ts` byte-identical on a second run |

## Effects outside this change

- **The meal-tag approval sheet (issue 2) goes stale, as designed.** Its fingerprints pin `mealTagRule.ts`, `catalog.ts` and `foodTagReviews.ts`, all changed here. Every row would show as stale until the sheet is regenerated after this correction lands.
- **The meal-tag research scripts** (`tools/research/meal-tag-evidence/`, untracked):
  - `extract.mjs` reads `omega3Grams` per gram, which is now null for chia.
  - `recalc.mjs` still sums omega-3 from the CSV with zero-fill.
  - Both need updating to the two-path rule before that packet is regenerated. They aren't changed here, to keep the correction separate.
- **A fingerprint design caveat:** `approval-sheet.mjs` hashes working-tree bytes, so line endings (this checkout uses CRLF) change the hash. An implementation should hash LF-normalized content.

## Still open

- Your review of this diff, and authorization before any commit.
- **The other nothing-weighed tags.** Under your OMEGA3-002 decision, only omega-3 changes here. The 14 other U-0 tags still record `perServing` 0 under the batch 5 rule; that belongs to the separate meal-tag work.
- **Approving the regenerated omega-3 results** is your separate, dated decision. Until then the evidence stays credited as AI-assisted.
- MT-003 stays pending (cooking evidence).
- The meal-tag work continues separately: retention codes (R3), proxies (K3), the "4 oz" decision (W), and per-result approvals.

## Component rows (unchanged from revision 1)

Each row's evidence class is the same K1 classification used above.

| Food tag record | ALA | EPA | DPA | DHA | Published (zero-filled) per reference amount | ALA alone per reference amount | Four-component total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| wild-salmon: 173686 "Fish, salmon, Atlantic, wild, raw", 110 g | 0.295 g (1270, row 1798162; no code, n=1) | 0.321 g (1278, row 1798130; no code, n=2) | 0.287 g (1280, row 1798131; no code, n=2) | 1.115 g (1272, row 1798128; no code, n=2) | 2.22 g | 0.32 g | 2.22 g |
| wild-salmon: 175136 "Fish, salmon, coho, wild, raw", 110 g | 0.157 g (1270, row 1915525; no code, n=6) | 0.429 g (1278, row 1915558; no code, n=6) | 0.232 g (1280, row 1915559; no code, n=6) | 0.656 g (1272, row 1915556; no code, n=6) | 1.62 g | 0.17 g | 1.62 g |
| wild-salmon: 173691 "Fish, salmon, sockeye, raw", 110 g | 0.047 g (1404, row 1798570; measured (A, n=22)) | 0.251 g (1278, row 1798580; measured (A, n=22)) | 0.079 g (1280, row 1798581; measured (A, n=22)) | 0.471 g (1272, row 1798576; measured (A, n=22)) | 0.93 g | 0.05 g | 0.93 g |
| wild-salmon: 173692 "Fish, salmon, sockeye, cooked, dry heat", 85 g | 0.058 g (1270, row 1798721; not measured (RA)) | 0.299 g (1278, row 1798758; not measured (RA)) | 0.093 g (1280, row 1798759; not measured (RA)) | 0.56 g (1272, row 1798754; not measured (RA)) | 0.86 g | 0.05 g | 0.86 g |
| walnuts: 170187 "Nuts, walnuts, english", 30 g | 9.08 g (1270, row 1501852; measured (A, n=7)) | 0 g (1278, row 1501913; measured (A, n=7)) | 0 g (1280, row 1501914; measured (A, n=7)) | 0 g (1272, row 1501909; measured (A, n=7)) | 2.72 g | 2.72 g | 2.72 g |
| chia-pudding: 170554 "Seeds, chia seeds, dried", 30 g | 17.83 g (1404, row 1532733; measured (AI, n=2)) | **absent (unknown)** | **absent (unknown)** | **absent (unknown)** | 5.35 g | 5.35 g | **unknown** (missing EPA, DPA, DHA) |
| chia-pudding: 2707590 "Chia seeds", 30 g | 17.83 g (1270, row 34279603; no code, no data points) | 0 g (1278, row 34279609; no code, no data points) | 0 g (1280, row 34279611; no code, no data points) | 0 g (1272, row 34279605; no code, no data points) | 5.35 g | 5.35 g | 5.35 g |

| Meal tag | Recorded status | Revised value (zero-filled) | ALA alone | Four-component total | Weighed lines | Not weighed |
| --- | --- | --- | --- | --- | --- | --- |
| MT-003 Salmon & Quinoa Bowl | meets | 0.962 g | 0.053 g | 0.962 g | Wild salmon fillet 113.3981 g, FDC 173691 | none |
| MT-012 Warm Oatmeal with Berries | meets | 0.664 g | 0.664 g | 0.664 g | Walnuts 7.3125 g, FDC 170187 | none |
| MT-063 Tropical Fruit Smoothie | meets | 1.872 g | 1.872 g | **unknown** (missing EPA, DPA, DHA) | Chia seeds 10.5 g, FDC 170554 | none |
| MT-107 Dark Chocolate Trail Mix | not-shown | 0.000 g | unknown g | **unknown** (nothing weighed) | none | Walnuts |
