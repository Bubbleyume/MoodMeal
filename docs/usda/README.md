# USDA pilot integration — 2026-10-14

Rainbow Fruit Skewers and Chamomile & Sweet Potato Toast have user-approved USDA reference estimates. Both use reference portions rather than individually weighed ingredients; neither is laboratory-verified or kitchen-tested.

## Approved decisions

| Ingredient | FDC ID | Source portion ID | Approved weight |
|---|---|---|---|
| Whole raw strawberries, hulled | 167762 | 81922 | 144 g (1 cup whole) |
| Raw pineapple chunks | 169124 | 84287 | 165 g (1 cup chunks) |
| Raw blueberries | 171711 | 89238 | 74 g (half of the 148 g cup) |

Total edible weight: 383 g. Two equal servings: 191.5 g each. Wooden skewers are equipment, excluded from nutrition. Display rounds to 85 kcal, 1.2 g protein, 21.7 g carbohydrate, 0.4 g fat and 3.5 g fiber per serving. Added sugars remain null/Unknown.

### Approved ingredient records and exact per-use conversions

User decisions H1–H3, 2026-10-14. Stored in `src/data/usda/approved-ingredients.json` (built by `build-approved-ingredients.py` from the retained CSV snapshot and checked against the saved API report) and read through `src/data/usdaApprovals.ts`. Approval covers identity and listed conversions only. A recipe estimate appears only when every ingredient and preparation in that recipe is reviewed and the user approves its estimate.

| Ingredient | FDC ID | Approved conversions | Notes |
|---|---|---|---|
| Honey (generic) | 169640 | 1 tsp = 7 g (derived from portion 85265, 21 g/tbsp ÷ 3); 1/4 cup = 84.75 g (derived from portion 85264, 339 g/cup ÷ 4) | Added sugars (1235) absent in USDA: null/Unknown, never zero. Other quantities, units, notes or honey types are unreviewed. |

**Batch approvals B1-B14/C1-C2 (2026-10-14):** banana 173944, almond butter 168588, sweet potato 168482, raw egg 171287, hard-boiled egg 173424, long-grain cooked brown rice 169704, rolled oats 173904, fresh pineapple 169124, pumpkin-seed kernels 170556, raw Swiss chard 169991, raw almonds 170567, whole-wheat bread 172688, ground cinnamon 171320 and brewed chamomile 174156 are approved only for the exact uses listed in `BATCH-REMAINING-14-PROPOSAL.md`. Each conversion carries its quantity, unit, notes and recipe IDs. Greek yogurt and avocado are pending. Only the fully reviewed Chamomile & Sweet Potato Toast currently uses these approvals in a published estimate.

### Chamomile & Sweet Potato Toast estimate (user-approved 2026-10-19)

One serving uses 130 g raw peeled sweet-potato flesh (FDC 168482, portion 83167), 32 g plain unsalted almond butter (168588, 83375), 59 g raw peeled medium banana (173944, 93515), 237 g brewed chamomile tea (174156, 93843; tea bag removed) and 0.1625 g ground cinnamon (171320, 88429). Listed input weight is 458.1625 g, including the beverage.

Per serving, rounded for display: **364 kcal, 9.4 g protein, 46.3 g carbohydrate, 18.0 g fat, 8.8 g fiber and 14.1 g total sugars. Added sugars are Unknown** because the USDA records do not provide that nutrient. Other missing values remain Unknown, never zero. The sweet potato is measured raw before toasting; cooking moisture loss and finished yield are not measured. The estimate is not laboratory-verified or kitchen-tested.

Honey appears in Warm Oatmeal, Calming Kefir Smoothie, Green Tea Energy Bites, Immune-Support Smoothie and Berry Yogurt Parfait. Each still has unreviewed ingredients, so none shows nutrition totals.

| Recipe | Approved measurement | Remaining restriction |
|---|---|---|
| Warm Oatmeal | 1/16 tsp ground cinnamon | No complete recipe nutrition approved |
| Chamomile Comfort Toast | All five ingredient uses reviewed; see above | Estimate shown; added sugars Unknown |
| Avocado Toast | 1/16 tsp fine table salt | No complete recipe nutrition approved |
| Avocado Toast | 1/16 tsp crushed chili flakes | Gram weight and nutrient contribution null until a suitable record or measured weight is reviewed |
| Loaded Popcorn Mix | 0.4 g sea salt, weighed | Nutrient composition/contribution null pending a suitable sodium match; table salt must not be substituted |

## Source and calculation records

- `pilot-source-records.json`: exact three source records, portions, nutrient rows, units and derivations from FoodData_Central_csv_2026-04-30.
- `pilot-reviewed-calculation.json`: retained review calculation, including missing nutrient values and ingredient contributions.
- Runtime data in `src/data/usda/pilot-foods.json` contains only the three approved records and selected nutrient definitions.
- `src/lib/nutrition.ts` scales each per-100-g amount by ingredient grams, sums complete contributions, then divides by servings. Missing inputs, missing nutrients or mismatched units produce null, never an assumed zero. Genuine source zero remains zero.
- `src/data/usdaPilot.ts` restricts each estimate to its exact recipe ID, ingredients, quantities, preparation instructions, cooking time and servings. Changes invalidate the estimate. Qualitative food aliases are not used for quantitative matching.

## Remaining review queue

`remaining-ingredient-review.json` retains the remaining 61 labels with candidate IDs, preparation states, source portion IDs, ambiguities and recipe uses, sorted by frequency. It is documentation only and is not imported by the app. Pineapple's approval applies only to the pilot quantity, not every use. Existing notes describe pre-approval review findings; the decisions above supersede any earlier pinch wording.

Prioritize shared ingredients such as honey, banana and almond butter. Confirm size, salt/fat level and exact household portion before approving weights. Milk alternatives, meat cuts, chocolate, kefir and materially different food identities remain unresolved. Crushed chili flakes and sea salt retain the conditions above. No other recipe nutrition is published.

## Nutrition Calculator (custom recipes)

`src/lib/nutritionCalculator.ts` and `/nutrition-calculator` let users combine approved records (above, plus the three pilot fruits) in grams or approved household measures only. Missing values stay null and are shown as Unknown/incomplete. Results are calculated estimates for the user's own combination; they are not stored, reviewed or approved, and they never change catalog nutrition or recipe approval status.

## Integration boundaries

No storage migration: estimates derive from the built-in recipe. Existing user data and recommendation behavior remain intact. No branch changes, merge, reset, commit or push were performed. The checkout is knowledge-system-foundation at 3292282, one checkpoint ahead of avatar-redesign-phase-2 at 7edaaf7; master remains 7d49790.

Validation covers numeric calculations, null propagation, approval invalidation, approved measurements, avatar assets and Recipe Detail at 320/390/1440 px with reloads. See AI_HANDOFF.md for completed check results.
