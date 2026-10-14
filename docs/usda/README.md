# USDA pilot integration — 2026-10-14

Only Rainbow Fruit Skewers is approved for integration testing. Its estimates are calculated from three generic USDA records, two equal servings, and reference portion weights, not individually weighed ingredients. It is not laboratory-verified or kitchen-tested.

## Approved decisions

| Ingredient | FDC ID | Source portion ID | Approved weight |
|---|---|---|---|
| Whole raw strawberries, hulled | 167762 | 81922 | 144 g (1 cup whole) |
| Raw pineapple chunks | 169124 | 84287 | 165 g (1 cup chunks) |
| Raw blueberries | 171711 | 89238 | 74 g (half of the 148 g cup) |

Total edible weight: 383 g. Two equal servings: 191.5 g each. Wooden skewers are equipment, excluded from nutrition. Display rounds to 85 kcal, 1.2 g protein, 21.7 g carbohydrate, 0.4 g fat and 3.5 g fiber per serving. Added sugars remain null/Unknown.

| Recipe | Approved measurement | Remaining restriction |
|---|---|---|
| Warm Oatmeal | 1/16 tsp ground cinnamon | No complete recipe nutrition approved |
| Chamomile Comfort Toast | 1/16 tsp ground cinnamon | No complete recipe nutrition approved |
| Avocado Toast | 1/16 tsp fine table salt | No complete recipe nutrition approved |
| Avocado Toast | 1/16 tsp crushed chili flakes | Gram weight and nutrient contribution null until a suitable record or measured weight is reviewed |
| Loaded Popcorn Mix | 0.4 g sea salt, weighed | Nutrient composition/contribution null pending a suitable sodium match; table salt must not be substituted |

## Source and calculation records

- `pilot-source-records.json`: exact three source records, portions, nutrient rows, units and derivations from FoodData_Central_csv_2026-04-30.
- `pilot-reviewed-calculation.json`: retained review calculation, including missing nutrient values and ingredient contributions.
- Runtime data in `src/data/usda/pilot-foods.json` contains only the three approved records and selected nutrient definitions.
- `src/lib/nutrition.ts` scales each per-100-g amount by ingredient grams, sums complete contributions, then divides by servings. Missing inputs, missing nutrients or mismatched units produce null, never an assumed zero. Genuine source zero remains zero.
- `src/data/usdaPilot.ts` restricts approval to the exact recipe ID, ingredients, quantities, preparation instructions, cooking time and servings. Changes invalidate the estimate. Qualitative food aliases are not used for quantitative matching.

## Remaining review queue

`remaining-ingredient-review.json` retains the remaining 61 labels with candidate IDs, preparation states, source portion IDs, ambiguities and recipe uses, sorted by frequency. It is documentation only and is not imported by the app. Pineapple's approval applies only to the pilot quantity, not every use. Existing notes describe pre-approval review findings; the decisions above supersede any earlier pinch wording.

Prioritize shared ingredients such as honey, banana and almond butter. Confirm size, salt/fat level and exact household portion before approving weights. Milk alternatives, meat cuts, chocolate, kefir and materially different food identities remain unresolved. Crushed chili flakes and sea salt retain the conditions above. No other recipe nutrition is published.

## Integration boundaries

No storage migration: estimates derive from the built-in recipe. Existing user data and recommendation behavior remain intact. No branch changes, merge, reset, commit or push were performed. The checkout is knowledge-system-foundation at 3292282, one checkpoint ahead of avatar-redesign-phase-2 at 7edaaf7; master remains 7d49790.

Validation covers numeric calculations, null propagation, approval invalidation, approved measurements, avatar assets and Recipe Detail at 320/390/1440 px with reloads. See AI_HANDOFF.md for completed check results.
