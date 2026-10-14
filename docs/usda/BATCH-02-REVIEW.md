# USDA batch 02 — review only

Twelve most-used remaining labels, selected by recipe frequency. Direct CSV recheck completed 2026-10-14. No runtime data changed. Source verification does not approve a recipe identity or household measure. Missing values remain null. Nutrients are per 100 g edible portion; source units and row IDs are retained in batch-02-source-records.json.

| Ingredient (uses) | Proposed USDA descriptions / IDs | Group | Decision needed / proposed conversion |
|---|---|---|---|
| Honey (5) | 169640: Honey | verified candidate, approval pending | 1 tsp = 7 g derived from native 21 g/tbsp; 1/4 cup = 84.75 g from native 339 g/cup. Preserve native measures rather than forcing density consistency. |
| Banana (4) | 173944: Bananas, raw | ambiguous match or preparation/portion | Size unspecified. Medium reference = 118 g, half = 59 g if adopted. Pancakes cook the raw input; smoothies use it raw. |
| Almonds (3) | 170567: Nuts, almonds | ambiguous match or preparation/portion | Confirm raw/roasted and salted state. Whole, sliced, slivered and ground cup weights differ; chopped tbsp is not an exact listed portion. 1/4 cup whole would be 35.75 g only if whole is intended. |
| Brown rice (3) | 169704: Rice, brown, long-grain, cooked (Includes foods for USDA's Food Distribution Program); 168875: Rice, brown, medium-grain, cooked (Includes foods for USDA's Food Distribution Program) | ambiguous match or preparation/portion | Recipe explicitly measures cooked rice. Long-grain 3/4 cup = 151.5 g; medium-grain = 146.25 g. Choose grain type; never use a dry-rice record with cooked cups. |
| Egg (3) | 171287: Egg, whole, raw, fresh; 173424: Egg, whole, cooked, hard-boiled | ambiguous match or preparation/portion | Choose size; large raw egg = 50 g edible without shell. Pancake/hash use raw ingredient weights before cooking; toast uses hard-boiled record (large 50 g). Power bowl cooking method remains unspecified. |
| Pineapple (3) | 169124: Pineapple, raw, all varieties | ambiguous match or preparation/portion | 1 cup chunks = 165 g, half = 82.5 g. Confirm diced/cubed treated as chunks; packing can differ. Exclude core/skin; do not substitute canned syrup fruit. |
| Pumpkin seeds (3) | 170556: Seeds, pumpkin and squash seed kernels, dried | ambiguous match or preparation/portion | Confirm kernels, raw/dried vs roasted and salt. Conditional 1 tbsp = 8.0625 g and 2 tbsp = 16.125 g from 129 g/cup. No shells. |
| Salt & pepper (3) | 173468: Salt, table; 170931: Spices, pepper, black | unresolved measurement | Split salt and pepper with separate measured amounts. To taste is unresolved; black pepper and table salt are candidate types only. |
| Sweet potato (3) | 168482: Sweet potato, raw, unprepared (Includes foods for USDA's Food Distribution Program); 168483: Sweet potato, cooked, baked in skin, flesh, without salt | ambiguous match or preparation/portion | Need size, skin treatment and point of measurement. Raw reference potato 130 g; cooked medium flesh 114 g. Half roasted is ambiguous because instructions start by roasting it. Do not apply cooked values to raw grams. |
| Swiss chard (3) | 169991: Chard, swiss, raw; 170401: Chard, swiss, cooked, boiled, drained, without salt | ambiguous match or preparation/portion | Steak recipe 2 cups chopped raw can use 72 g. Bowl recipes specify sauteed cups but then instruct sauteing. Boiled/drained 175 g/cup is not sauteed. Specify raw weighed inputs plus oil or a validated cooked sauteed record and weight. |
| Almond butter (2) | 168588: Nuts, almond butter, plain, without salt added | ambiguous match or preparation/portion | Confirm plain unsalted. 2 tbsp = 32 g; 1/2 cup = 125 g using separate native portions. Do not replace the cup with 8 tbsp: USDA measures are not exactly additive. |
| Avocado (2) | 171705: Avocados, raw, all commercial varieties | ambiguous match or preparation/portion | Variety/size unspecified. USDA generic fruit = 201 g edible; 1/4 = 50.25 g and 1/2 = 100.5 g only if that reference fruit is adopted. |

## Recipe eligibility

No additional recipe is ready for publication. Only Rainbow Fruit Skewers remains approved. Even approval of the clean honey candidate alone does not complete another recipe. The following shows remaining labels outside this batch and the already approved pilot fruits; it is a dependency list, not a claim that batch ingredients are approved. All non-pilot recipes still require per-use quantity, preparation and yield review.

- **Rainbow Fruit Skewers**: remaining labels outside batch: none. Approved pilot only.
- **Chamomile & Sweet Potato Toast**: remaining labels outside batch: Chamomile tea bag, Cinnamon. Batch identity/measurement decisions still pending.
- **Calming Kefir Smoothie**: remaining labels outside batch: Kefir, Ice. Batch identity/measurement decisions still pending.
- **Green Tea Energy Bites**: remaining labels outside batch: Rolled oats, Matcha or green tea powder. Batch identity/measurement decisions still pending.
- **Energizing Power Bowl**: remaining labels outside batch: Kale, Sesame seeds, Soy sauce. Batch identity/measurement decisions still pending.
- **Cozy Sweet Potato Hash**: remaining labels outside batch: Cooked turkey breast, Olive oil, Paprika. Batch identity/measurement decisions still pending.
- **Steak & Swiss Chard**: remaining labels outside batch: Lean beef, Garlic, Olive oil. Batch identity/measurement decisions still pending.
- **Brown Rice Veggie Bowl**: remaining labels outside batch: Olive oil, Tahini, Lemon juice. Batch identity/measurement decisions still pending.

## Holds

Meat cuts, milk alternatives, kefir, chocolate types, crushed chili flakes and sea-salt composition remain on hold. Salt & pepper requires separate measurable quantities. No default is silently chosen. Honey teaspoon conversion assumes 3 teaspoons per tablespoon; native cup and tablespoon weights are independently preserved. Cooking losses, yield and unlisted oils must be resolved before complete cooked-recipe totals.

## Evidence

All proposed IDs, exact descriptions, publication dates, data types, native portion amounts/weights/IDs, nutrient units and raw nutrient rows are retained in batch-02-source-records.json. Proposed mappings and preparation notes are in batch-02-review.json. Source: user-supplied FoodData_Central_csv_2026-04-30. No online or branded substitutions.
