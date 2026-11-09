# MoodMeal research engine (development only)

Tasks 1 and 2 of the research-automation plan, implemented 2026-11-02 by Claude Code on `knowledge-system-foundation` (HEAD b044633 at the time). The engine produces candidates, comparisons and reports for human review. It never approves anything, never writes under `src/` or `public/`, and never writes into `docs/usda/` (including `docs/usda/pending-review/`). The one exception is the two owner-run stage D generators. They write only `src/data/foodTagReviews.ts` and `src/data/mealTagReviews.ts`, from decisions the owner approved.

The 2% milk approval was later committed (`07ecbf6`). `AI_HANDOFF.md` now records each research milestone, and this file keeps the details.

## What was added

| Path | Purpose |
| --- | --- |
| `scripts/export-catalog.mjs`, `tools/research/catalog-export.ts` | Catalog export and coverage report (task 1) |
| `tools/research/research.py` | Command-line entry point (task 2) |
| `tools/research/moodmeal_research/` | `config`, `provenance`, `cache`, `normalize`, `adapters/usda_csv`, `adapters/usda_api` |
| `tools/research/tests/`, `tools/research/run_tests.py` | 20 unit tests with synthetic CSV fixtures and mocked HTTP |
| `package.json` | One new script: `export:catalog` |
| `.gitignore` | Two new lines: `research-output/`, `research-cache/` |

Generated files go to the git-ignored `research-output/` (reports) and `research-cache/` (raw API responses). The code refuses to write to either folder unless `git check-ignore` confirms it is ignored.

## Commands (PowerShell or Git Bash)

```
npm run export:catalog
python -I -B tools/research/run_tests.py
python -I -B tools/research/research.py usda-csv 171267 --fdc-csv C:/path/to/FoodData_Central_csv_2026-04-30
python -I -B tools/research/research.py check-runtime 171267 --fdc-csv C:/path/to/FoodData_Central_csv_2026-04-30
python -I -B tools/research/research.py usda-api 171267 --compare-csv --fdc-csv C:/path/to/FoodData_Central_csv_2026-04-30
```

`--fdc-csv` can be replaced by the `MOODMEAL_FDC_CSV_DIR` environment variable; there is no default path. `usda-api` makes one read-only request and needs `FDC_API_KEY` in the environment; the key is never printed, logged or cached. Each CSV command scans the 1.8 GB `food_nutrient.csv` once (about 17 s).

## Design rules enforced in code

- An empty source amount is `null`; a measured `0` stays `0`. Duplicate nutrient IDs are flagged and left `null`, never merged or picked.
- Every record is labelled `unreviewed-candidate` with `approved: false`, and carries a source record (adapter, FDC ID, snapshot, licence, redacted URL, retrieval time).
- The API adapter reuses `normalize()`, `request()` and `compare()` from `docs/usda/fdc_review.py` by import, without editing it, and never calls `save()` or `already_saved()`. A test checks that `docs/usda/` is unchanged after a fetch.
- The cache refuses adapters marked `ephemeral` (for any memory-only licensed source such as FatSecret) and redacts API keys from URLs and payloads.

## Validation results (2026-11-02)

- Catalog export: 24 recipes, 2 published estimates (Chamomile & Sweet Potato Toast, Rainbow Fruit Skewers), Toast 5/5, Warm Oatmeal 5/6 with only Mixed berries unapproved; two runs byte-identical.
- `check-runtime 171267`: all 16 nutrients in the approved "Milk, 2%" runtime record match the CSV snapshot exactly (amount, unit, source row ID).
- One live request, `usda-api 171267 --compare-csv`: no numeric nutrient, unit, portion or identity disagreement. `fdc_review.compare()` reports `materialDifferences: 2`; both concern Phytosterols (1283) and are a non-material structural difference. The API has a 1283 entry with no amount and no source row (present but unknown); the CSV has no 1283 row at all (missing). Neither establishes a value, so 1283 stays unknown (null), never zero. The comparison script counts present-versus-missing as material; that is a classification limitation, not a failed validation. 1283 is not among the app's 16 milk nutrients. The remaining 13 differences are informational (12 empty nutrient categories, one date format).
- `docs/usda/pending-review/` still holds 51 files; the API key appears in no output or cache file.
- `npm run typecheck`, `npm run test:knowledge` (48), `npm run build`, the 20 research tests and `git diff --check` pass. `catalog-export.ts` lies outside the `src`-only `tsconfig.json`; it was type-checked separately with no errors.

## Task 3: consistency checks and stage A inventory (2026-11-02)

Added `tools/research/moodmeal_research/checks.py`, `tools/research/knowledge-export.ts`, `tools/research/tests/test_checks.py` and the `test:research` script. `npm run export:catalog` now also writes `research-output/knowledge.json`; the three task 1 outputs are byte-identical to before.

```
npm run test:research
npm run export:catalog
python -I -B tools/research/research.py checks
```

`checks` writes `research-output/findings.json` and `FINDINGS.md`, and exits 1 only on a blocking finding. Checks never change data. A check is blocking only if it passed on the repository data when introduced; the rest stay report-only until the owner reviews their findings.

| Check | Mode | Findings on 2026-11-02 |
| --- | --- | --- |
| ledger-schema | blocking | 0 |
| runtime-nutrient-values (null allowed; any number needs a source row) | blocking | 0 |
| runtime-conversions | blocking | 0 |
| runtime-provenance (incl. API evidence file exists) | blocking | 0 |
| runtime-uses-in-ledger | report | 2 |
| ledger-uses-in-runtime | report | 1 |
| runtime-names-in-ledger | report | 2 |
| catalog-coverage | report | 21 |
| ledger-uses-in-catalog | report | 3 |

What the report-only findings show:

- Ground cinnamon (FDC 171320) is approved at runtime for Chamomile Toast and Warm Oatmeal, but `remaining-ingredient-review.json` has no cinnamon entry. (Correction, 2026-11-03: the 2026-10-21 reconciliation note does not mention cinnamon; it was simply never added.)
- The runtime renamed "Whole-grain bread" to "Whole-wheat bread"; the ledger still uses the old name. The ledger's "Chili flakes" and "Salt" uses for Gentle Avocado Toast no longer match the recipe labels "Crushed chili flakes" and "Fine table salt".
- Rainbow Fruit Skewers' pineapple approval is served by the pilot estimate inputs, not a runtime conversion (expected, recorded for clarity).
- 21 unapproved recipe uses are not tracked in the structured ledger, for example olive oil (7 recipes), garlic (3), spinach, paprika, carrots, cooked quinoa, air-popped popcorn and pancake cinnamon. Some appear only in older markdown review notes.

A simulated regression (honey's unknown added sugars changed to 0 without a source row) produces a blocking finding, as intended.

Stage A inventory (`knowledge.json`, summarized in `FINDINGS.md`): 237 claims. 208 are published with AI-assisted review only (all 10 nutrient definitions, 7 goals, 62 food-nutrient tags, 95 derived meal-nutrient tags, 24 recipes, 10 lessons). 157 food/meal tags cite only a general nutrient fact sheet, with no food amount or threshold. 12 mood-to-goal mappings have no evidence. 15 glossary entries have a URL but no review record. 24 recipe provenance records have an empty source URL. Only the 2 recipe nutrition estimates are user-approved. Nothing was changed; stages B to D need separate approval.

## Corrections after the task 3 review (2026-11-03)

- Cache checksum: the payload is now redacted before its checksum is computed, so an entry whose payload contained the API key reads back without a checksum failure. `put()` also refuses to write if a secret survives redaction. A new test reads a redacted entry back (33 research tests). The existing cached 171267 response contained no key and still verifies.
- Cache reuse: documented rather than changed. `research-cache/` is an evidence archive; `usda-api` always makes a fresh request and never answers from the cache.
- Published estimates: `catalog-coverage` still skips recipes with a published estimate, so it does not yet check that an estimate's inputs match the recipe's ingredient lines. That check belongs with the proposed pilot-input coverage field (future, not approved).
- Preservation guard (outside the repo): `check.sh` now verifies saved baseline copies of `package.json` and `.gitignore` against `config.sha256` and fails if any baseline line was removed or changed. Tampering tests (altered copy, removed line, deleted copy) all fail as intended. The guard needs Git Bash (`sha256sum`, `find`, `comm`, `diff`), not native PowerShell.

## Knowledge stage B committed (2026-11-04)

Stage B (`reviewOrigin` on provenance; `source()` no longer publishes by default) was committed and pushed as `3cc274b` with the owner's approval. It changes nothing users see.

## Stage C: food tag evidence report (2026-11-04)

The owner chose the threshold: at least **10% of the FDA Daily Value per reference amount customarily consumed (RACC)**, the "good source" level of 21 CFR 101.54(c)(1). This is a report only. No tag, recipe, approval or app text changed.

```
npm run export:catalog
python -I -B tools/research/research.py tag-evidence --fdc-csv C:/path/to/FoodData_Central_csv_2026-04-30 [--threshold 0.10]
```

It writes `research-output/tag-evidence.json` and `TAG-EVIDENCE.md`.

Inputs:
- `tools/research/stage-c-food-map.json` gives each catalog food one or more FDC records, the record's form (raw, cooked, dry or as sold) and the matching RACC.
  - Every record carries a basis: recipe-scoped approval, Skewers pilot only, ledger candidate, or proposed for stage C. None of these makes a record approved for the catalog food.
  - The three stage C proposals are steel-cut oats 2346397 and air-popped popcorn 167959/170246, found by searching the CSV.
- Daily Values come from 21 CFR 101.9(c)(8)(iv) and (c)(9). RACCs come from 21 CFR 101.12(b) Table 2 and, for beef, 9 CFR 317.312. All were retrieved on 2026-11-04. The poultry amount (9 CFR 381.412) is assumed to match meat cuts and was not retrieved.
- `knowledge-export.ts` now writes `foodIds` on each food and meal tag, using the same ingredient-to-food rule as `catalog.ts`.

Rules:
- **Food tags:** a tag "meets" only if every candidate record meets the threshold. It is "below" if every record is below, and "record-dependent" if the records disagree.
- **Unknown stays unknown:** a missing value, duplicate rows, a wrong unit or no usable RACC conversion is never treated as zero.
- **Fiber in Foundation records:** these report fiber as nutrient 2033 (AOAC 2011.25) instead of 1079. The report uses 2033 only when 1079 is absent, and names the row it used.
- **Kefir:** 240 mL is converted to grams through the record's own single 1 cup portion.
- **Not assessable:** water and omega-3 have no Daily Value.
- **Protein:** not corrected for protein quality (PDCAAS), so its percentage is an upper bound.
- **Borderline:** a result within half a percentage point of the threshold is marked borderline.
- **Meal tags:** inherited from the contributing foods. Meal quantities are not compared with a RACC, and 21 CFR 101.54(c)(1) excludes meals from the per-RACC definition anyway.

Results on 2026-11-04 (snapshot `FoodData_Central_csv_2026-04-30`):

| | Count |
| --- | --- |
| Food tags meeting 10% | 41 |
| Food tags below | 12: walnuts protein and fiber; fiber in sweet potato, spinach, brown rice, watermelon, cucumber, pumpkin seeds, rainbow carrots, pineapple and Swiss chard; chia protein (9.9%) |
| Record-dependent | 1: spinach iron (raw 12.8%, baby 6.0%) |
| Not assessable (water, omega-3) | 8 |
| Borderline | mixed berries fiber, strawberries fiber (10.0%), chia protein (9.9%) |
| Meal tags: all contributors meet | 67 |
| Meal tags: some contributors meet | 11 |
| Meal tags: no contributor meets | 7: Warm Oatmeal protein, Tropical Fruit Smoothie protein; fiber in Beef & Spinach Stir-Fry, Cozy Sweet Potato Hash, Cooling Cucumber & Watermelon Salad, Steak & Swiss Chard, Brown Rice Veggie Bowl |
| Meal tags: contributors record-dependent | 1 (Salmon & Quinoa Bowl iron) |
| Meal tags: not assessable | 9 |

These are inputs for stage D, the owner's review batches. Nothing has been moved to needs-review. 15 new tests bring the research suite to 48.

## Not covered yet

- Hold-resolution packets and USDA searches for labels with no candidate (task 4).
- Fixing any finding above: each needs an owner decision; nothing is auto-corrected.
- Candidate matching, discrepancy reports beyond single-record comparison, literature adapters, and any change to app data (later tasks, separately approved).

## Stage D: owner review of nutrient tags (2026-11-04)

Each batch packet records the evidence, the owner's decisions and what was applied.

| Batch | Packet | Outcome | Commit |
| --- | --- | --- | --- |
| 1 | `STAGE-D-BATCH-1.md` | 12 food tags below the 10% bar withdrawn; spinach iron and two borderline berry fiber tags kept; 8 supported tags added | `c5d9908` |
| 2 | `STAGE-D-BATCH-2.md` | 15 supported tags added; oat protein, chocolate fiber and popcorn magnesium held | `bc1e20d` |
| 3 | `STAGE-D-BATCH-3.md` | 36 AI-reviewed tags confirmed with USDA evidence; quinoa, almond and pumpkin seed protein held pending PDCAAS | `8f7dee0` |
| 4 | `STAGE-D-BATCH-4.md` | MoodMeal rules for water (at least 90% by weight) and omega-3 (at least 0.16 g per reference amount); all 70 food tags owner-reviewed; matcha no longer maps to brewed green tea | `fd69ea4` |
| 5 | `STAGE-D-BATCH-5.md` | Per-serving rule for meal tags: 32 meet, 77 not yet checkable, toast vitamin C withdrawn; pineapple alias fixed | `6564822` |

- `tools/research/generate_food_tag_reviews.py` writes `src/data/foodTagReviews.ts`. `tools/research/generate-meal-tag-reviews.mjs` writes `src/data/mealTagReviews.ts`. Both are owner-run, and their output should be reviewed before committing.
- The knowledge test fails if the meal tag statuses no longer match the rule, for example after a gram weight is approved. Rerun the meal generator and review the diff.
- Committed parts of the research engine: both generators, plus `moodmeal_research` `__init__`, `config`, `normalize`, `provenance`, `tag_evidence` and the CSV adapter, plus `stage-c-food-map.json`. The other commands, the API adapter, the cache, the checks and the research tests are still uncommitted.

## Next

- Approve gram weights for more recipe ingredients, so more of the 77 meal tags can be checked. This happens through the existing USDA ingredient review.
- Source reviewed PDCAAS values before deciding the three held plant protein tags.
- Review the mood-to-goal rules and the glossary entries.
- Task 4 still needs explicit approval.

## Ingredient research command (Phase 1 backlog item 4, 2026-11-09)

This is item 4 of `PHASE-1-AUDIT.md`, not the earlier task 4 above. The command takes one recipe line and writes one candidate-only review record. It is offline, reading only the local CSV snapshot, and it approves nothing.

```
npm run export:catalog
python -I -B tools/research/research.py ingredient --recipe recipe-salmon-quinoa-bowl --line 5 --state ready-to-use --fdc-csv C:/path/to/FoodData_Central_csv_2026-04-30
python -I -B tools/research/research.py ingredient "Walnuts" --quantity 1 --unit tbsp --notes chopped --state raw --fdc-csv C:/path/to/FoodData_Central_csv_2026-04-30
```

- **Options:**
  - `--state`: one of raw, cooked, dry, brewed, frozen, canned or ready-to-use. Otherwise the state is read from the recipe notes.
  - `--form`, `--search` and `--fdc-id` are repeatable or optional.
  - `--max-candidates` defaults to 8.
- **Output:** `research-output/ingredients/<recipe>-line-<n>.json` and `.md`, which are git-ignored. One run takes about 25 s, because it streams `food_nutrient.csv` once.
- **Requirements:** identity is always left to the owner. Each line is checked for:
  - a state;
  - any form words in its notes;
  - an amount. "To taste" or "a few" is missing, and points to item 3, UL-2 and UL-3.
- **Candidates:**
  - **Search:** a whole-word search of `food.csv` limited to Foundation, SR Legacy and FNDDS records. Plurals are folded, and branded and sample records are never searched. Descriptions that start with the first term come first. The order is a reading aid, not evidence.
  - **Other sources:** the ledger's candidate IDs and any `--fdc-id`.
  - **State:** each candidate shows how its description relates to the stated state: matches, conflicts, mixed or not stated. Words after "excluding", "without", "not", "no" or "except" in the same comma-separated part are ignored.
- **Weights:** every gram weight the USDA portions support for the line's unit is listed, and none is chosen. The weight status is one of:
  - `exact-mass`: oz, lb, kg or g, using exact definitions;
  - `direct-portion`: the same unit, with any other portions agreeing;
  - `derived`: the US customary ratios from `src/lib/units.ts`; mL portions use the exact 1 tsp = 4.92892159375 mL and say so;
  - `count-portion`: a clove or a medium banana, whose size or count must be confirmed;
  - `several-options`: different weights, such as walnuts chopped or ground. Portions whose wording matches the line's form are marked;
  - `no-portion`.
- **Values:** core nutrients per 100 g, and each weight option's contribution. Unknown stays null, a measured zero stays zero, and duplicate nutrient rows stay null and are flagged.
- **Status:** only `candidate` or `missing` (with its reasons). Verified, Conditional, Conflicting and Rejected need the owner, or approved item 3 rules. The decision block is blank, with `approved: false` and `publishable: false`.
- **Context:** the ledger entry and any approved record for the label. Reusing an approved record is the owner's decision, because AR-3 isn't approved.
- **Fingerprint:** a SHA-256 over the whole record. It covers:
  - the request and the snapshot name;
  - the hashes of the ledger, runtime approvals, catalog, `food_portion.csv` and `measure_unit.csv`;
  - every candidate's source row IDs and values;
  - the hashes of the four source files.

  A rerun on the same inputs reproduces both files byte for byte.
- **Code and tests:** `moodmeal_research/requirements.py` and `moodmeal_research/ingredient.py`. `tests/test_ingredient.py` has 23 tests on the synthetic `tests/fixtures/fdc_csv_ingredient/`, bringing `test:research` to 91.
- **Limits:**
  - no API search;
  - no materiality rule for weights that differ slightly;
  - the state and form tables are short;
  - Foundation records often have no portions;
  - energy is read from nutrient 1008 only. Energy reported only as 2047 or 2048 (Atwater factors) or as 1062 (kJ) shows as Unknown. Foundation extra-virgin olive oil, 748608, has no energy row at all.
