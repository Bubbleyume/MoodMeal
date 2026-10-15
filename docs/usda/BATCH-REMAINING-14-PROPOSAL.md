# Remaining 14 batch labels: approval proposal (2026-10-14)

Status: **proposal only, awaiting user decisions.** Nothing here is approved. No runtime data, recipe text or nutrition totals changed. Honey (169640) and the Rainbow Fruit Skewers pilot (167762, 169124, 171711) are unchanged.

Evidence:
- The 21 candidate reports saved on 2026-10-14 (listed in NEXT-BATCH-REVIEW.md) were re-read offline. Their descriptions, portions and key nutrients still match the batch documents and the FoodData_Central_csv_2026-04-30 snapshot.
- Three records were fetched with `fdc_review.py fetch` because Chamomile & Sweet Potato Toast and the avocado decision needed them:
  - 171320 Spices, cinnamon, ground: `20261015T005749Z-f986ddfd…`
  - 174156 Beverages, tea, herb, brewed, chamomile: `20261015T005750Z-e2564d9c…`
  - 171706 Avocados, raw, California: `20261015T005752Z-7d7b5fbf…`
- Cinnamon and chamomile key nutrients and portions match the CSV rows exactly. 171706 has not yet been compared with the CSV.
- All three reports are in the ignored `pending-review/` folder and in the private checksummed backup (27 files verified).

Conventions applied to every proposal:
- Nutrients are per 100 g of edible portion.
- Weights come from the record's own native portion. A derived weight is shown with its arithmetic. Portions are never borrowed between records.
- Added sugars (1235) are absent from every SR Legacy record and stay null/Unknown.
- Missing nutrients are null, never zero. A zero that USDA reports (for example yogurt fiber) stays zero.
- Duplicate or empty nutrient rows are kept as evidence and never silently resolved.
- Cooked recipes use raw input weights with the raw record unless the recipe measures a cooked food.

## Approval table

| # | Ingredient | USDA ID | Preparation state | Proposed weight (portion ID) | Nutrient verification | Outstanding questions | Recipes affected | Recommendation |
|---|---|---|---|---|---|---|---|---|
| B1 | Banana | 173944 Bananas, raw | Raw, peeled | Medium 118 g (93515); ½ = 59 g; 1 mashed = 118 g raw input | API = CSV, clean. Added sugars null | Adopt *medium* as the default for an unspecified banana? | Chamomile Toast ½; Berry Kefir Smoothie ½; Tropical Fruit Smoothie ½; Sunshine Pancakes 1 | **Approve** with the medium convention |
| B2 | Almond butter | 168588 Nuts, almond butter, plain, without salt added | Ready-to-eat | 2 tbsp = 32 g (83375 × 2); ½ cup = 125 g (83376 ÷ 2) | Clean except phytosterols (1283): sourced row 1372134 = 139 mg plus an empty duplicate | Plain and unsalted intended? Keep the 139 mg sourced row and record the empty row as evidence? (Phytosterols are not displayed.) | Chamomile Toast 2 tbsp; Green Tea Oat Bites ½ cup | **Approve** if plain unsalted; resolve the duplicate as stated |
| B3 | Sweet potato | 168482 Sweet potato, raw, unprepared | Raw input, then dry-toasted (toast) or pan-cooked (hash) | 1 = 130 g (83167, "sweetpotato, 5″ long", edible) | API = CSV, clean | Peeled or skin on? The record describes flesh only. Accept the 5″ potato as "1 sweet potato"? | Chamomile Toast 1; Cozy Sweet Potato Hash 1; Rice, Egg & Greens Bowl ½ roasted | **Approve 130 g raw for Toast and Hash. Hold the Bowl** (the "½ roasted" measuring point is ambiguous; baked 168483 is not roasted-with-oil) |
| B4 | Egg | 171287 Egg, whole, raw, fresh; 173424 Egg, whole, cooked, hard-boiled | Raw input (hash); hard-boiled (avocado toast) | Large: raw 50 g (88374), 2 = 100 g; hard-boiled 50 g (92500) | Both clean | Adopt *large* as the default? The Bowl only says "cook until firm": hard-boiled or fried (frying adds unlisted oil)? | Cozy Sweet Potato Hash 2; Gentle Avocado Toast 1; Rice, Egg & Greens Bowl 1 | **Approve** large raw for Hash and hard-boiled for Avocado Toast. **Hold the Bowl** until you choose a method |
| B5 | Eggs | 171287 | Raw input to batter | 2 large = 100 g (88374 × 2) | Clean | Same size convention as B4 | Sunshine Pancakes 2 | **Approve** |
| B6 | Brown rice | 169704 Rice, brown, long-grain, cooked | Cooked (recipes measure cooked rice) | ¾ cup = 151.5 g (85378 × 0.75) | Clean. Medium-grain 168875 has no total-sugars row | Long-grain acceptable? | Rice, Egg & Greens Bowl; Beef & Spinach Stir-Fry; Brown Rice Veggie Bowl (¾ cup each) | **Approve long-grain** (fuller nutrient record); never use dry rice |
| B7 | Rolled oats | 173904 Cereals, oats, regular and quick, not fortified, dry | Dry, uncooked | ½ cup = 40.5 g; 1 cup = 81 g (93454) | Clean. Foundation 2346396 (exact "rolled, old fashioned") **has no fiber value, no 1008 energy row and no cup portion** (only RACC 40 g) | Accept SR "regular and quick" dry oats as the identity for old-fashioned rolled oats? | Warm Oatmeal ½ cup; Green Tea Oat Bites 1 cup | **Approve 173904**. Don't use 2346396 until it has fiber and a cup weight |
| B8 | Greek yogurt | 2705423 low-fat, plain (alternatives: 2705422 whole, 2705424 nonfat) | Ready-to-eat, plain | 1 cup = 245 g (290701); ½ cup = 122.5 g | Low-fat water 84.2 (API) vs 84.15 (CSV), unexplained, not overwritten. Nonfat is clean. All are FNDDS compiled models | **Which fat level?** | Orange Yogurt Smoothie ½ cup; Berry Yogurt Parfait 1 cup | **Your choice of fat level.** Neither recipe can be completed yet, so this can wait |
| B9 | Pineapple | 169124 Pineapple, raw, all varieties | Raw edible flesh (not canned) | 1 cup = 165 g (84287 chunks); ½ cup diced = 82.5 g only if diced counts as chunks | Clean. The skewers approval is unchanged | Treat "diced" like "chunks"? Fresh only? | Tropical Fruit Smoothie 1 cup; Quinoa Fruit Salad ½ cup diced; (Skewers already approved) | **Approve 1 cup = 165 g fresh.** Approve the diced convention only if you agree |
| B10 | Pumpkin seeds | 170556 Seeds, pumpkin and squash seed kernels, dried | Hulled kernels (pepitas), unroasted, unsalted | 1 tbsp = 8.0625 g; 2 tbsp = 16.125 g (86847 ÷ 16, ÷ 8) | Clean | Raw/unsalted pepitas intended? Roasted or salted would need a different record | Brown Rice Veggie Bowl 2 tbsp; Crunchy Veggie Snack Plate 1 tbsp; Quinoa & Greens Bowl 2 tbsp | **Approve** if raw unsalted kernels |
| B11 | Swiss chard | 169991 Chard, swiss, raw | Raw input, sautéed in listed oil | 2 cups chopped raw = 72 g (85834 × 2) | Clean. Boiled 170401 is not a sautéed record | The bowls say "1 cup / 2 cups sautéed" and then sauté it: measured raw or cooked? | Steak & Swiss Chard 2 cups; Brown Rice Veggie Bowl 1 cup; Quinoa & Greens Bowl 2 cups | **Approve 72 g raw for Steak.** **Hold both bowls** unless their text changes to raw cups |
| B12 | Avocado | **171706 Avocados, raw, California** (alternative: 171705 all commercial varieties) | Raw flesh | 1 fruit without skin and seed = 136 g (89229); ½ = 68 g; ¼ = 34 g. (171705: 201 g → 100.5 / 50.25 g) | 171706 newly fetched, not yet compared with CSV. Both have an empty phytosterol row (kept unknown) | California/Hass (typical grocery) or the generic record (which includes larger Florida fruit)? | Salmon & Quinoa Bowl ¼; Gentle Avocado Toast ½ | **Prefer 171706** after a CSV comparison. Both recipes stay blocked by other items |
| B13 | Almonds | 170567 Nuts, almonds | Raw, unsalted whole kernels | ¼ cup whole = 35.75 g; 2 tbsp = 17.875 g (86863 ÷ 4, ÷ 8) | Clean; empty phytosterol row kept unknown | "1 tbsp chopped" has no native portion: measure whole before chopping (8.9375 g)? Raw, not roasted? | Turkey Lettuce Wraps 1 tbsp chopped; Loaded Popcorn Trail Mix 2 tbsp; Dark Chocolate Trail Mix ¼ cup | **Approve whole-cup conversions. Hold "chopped"** unless you accept measuring whole |
| B14 | Whole-grain bread | 172688 Bread, whole-wheat, commercially prepared | As purchased, then toasted | 1 slice = 32 g (91108), untoasted input | Clean | Is whole-wheat an acceptable identity for "whole-grain bread"? | Gentle Avocado Toast 1 slice | **Approve as whole-wheat** (rename label) or keep on hold |

Additional Chamomile Toast inputs (outside the 14-label batch, newly API-verified):

| # | Ingredient | USDA ID | State | Proposed weight | Verification | Question | Recommendation |
|---|---|---|---|---|---|---|---|
| C1 | Ground cinnamon | 171320 Spices, cinnamon, ground | Dry spice | 1/16 tsp = 0.1625 g (88429: 2.6 g ÷ 16) | API = CSV | Accept the derived 1/16 tsp weight (the measurement itself was already approved)? | **Approve** for the 1/16 tsp uses (Toast, Oatmeal). Pancakes' ½ tsp = 1.3 g if wanted |
| C2 | Chamomile tea (brewed) | 174156 Beverages, tea, herb, brewed, chamomile | Brewed; the bag is removed and not eaten | 1 cup (8 fl oz) = 237 g (93843) | API = CSV. Zeros are USDA-reported zeros | The recipe never states the water volume. Change the step to "steep in 1 cup (8 fl oz) hot water"? Exclude the bag like the skewers? | **Approve with that recipe wording.** Otherwise the Toast can't be complete |

## Recipe eligibility after the proposals

**Only Chamomile & Sweet Potato Toast can become complete.** It needs all of B1, B2 and B3 (toast use), plus C1 and C2. Its inputs would then be: sweet potato 130 g raw, almond butter 32 g, banana 59 g, ground cinnamon 0.1625 g and brewed chamomile 237 g. The tea bag is excluded. It serves one. Needed recipe-text clarifications:
- the sweet-potato size and whether it is peeled;
- "1 cup (8 fl oz) hot water" for the tea.

Totals would be summed from raw inputs. Toasting changes water, not this calculation. Added sugars would show Unknown.

Every other recipe stays blocked after these approvals:

| Recipe | Still blocking |
|---|---|
| Green Tea Oat Bites | Matcha/green tea powder |
| Gentle Avocado Toast | Chili-flake grams; fine-salt composition |
| Warm Oatmeal | Milk or alternative, mixed berries, chopped walnuts |
| Sunshine Pancakes | Oat flour, topping berries, olive oil |
| Berry Kefir Smoothie | Kefir, ice |
| Tropical Fruit Smoothie | Coconut water, chia seeds, ice |
| Orange Yogurt Smoothie | Orange, ginger, unlisted ice; yogurt fat level |
| Berry Yogurt Parfait | Granola, mixed berries; yogurt fat level |
| Cozy Sweet Potato Hash | Turkey, paprika, salt & pepper, olive oil |
| Rice, Egg & Greens Bowl | Roasted sweet potato, egg method, kale, sesame, soy, unlisted oil |
| Beef & Spinach Stir-Fry; Steak & Swiss Chard | Beef cut, garlic, spinach, oil, soy, salt & pepper |
| Brown Rice Veggie Bowl; Quinoa & Greens Bowl | Sautéed-chard measurement, tahini, lemon juice, olive oil, quinoa |
| Salmon & Quinoa Bowl; Turkey Lettuce Wraps; snack plate, trail mixes, fruit salad | Salmon, turkey, hummus, chocolate, popcorn, sea salt and other unreviewed items |

No partial totals are proposed for any recipe.

## User decisions (2026-10-14)

The user approved every row marked **Approve**, with its recommended conventions. Held uses stay on hold, and Greek yogurt (B8) stays pending. Avocado (B12) was marked "Prefer", not "Approve", so it also stays pending. Its CSV comparison is now done: 171706 matches the CSV exactly (nutrients and portions).

Approved and recorded in `src/data/usda/approved-ingredients.json`:
- B1 banana 173944 (medium 118 g)
- B2 almond butter 168588 (phytosterols: keep sourced row 1372134 = 139 mg; the empty duplicate stays as evidence)
- B3 sweet potato 168482 (130 g, Toast and Hash only)
- B4 egg: 171287 raw for Hash, 173424 hard-boiled for Avocado Toast
- B5 eggs 171287
- B6 long-grain brown rice 169704
- B7 rolled oats 173904
- B9 fresh pineapple 169124 (Tropical Fruit Smoothie only)
- B10 raw unsalted pumpkin-seed kernels 170556
- B11 raw chard 169991 (Steak only)
- B13 raw whole almonds 170567 (cup-derived uses only)
- B14 whole-wheat bread 172688; the label is renamed "Whole-wheat bread" in the recipe, meal and artwork coverage
- C1 ground cinnamon 171320 (1/16 tsp uses only)
- C2 brewed chamomile 174156; the Toast step now says "1 cup (8 fl oz) hot water… then remove the bag"

Each conversion is tied to its exact quantity, unit, notes and recipe IDs. Any other use is unreviewed. CSV rows for 171320, 171706, 172688, 173904 and 174156 are retained in `approved-source-records.json` (built by `extract-source-records.py`). The build checks every approved record's CSV nutrients against its saved API report.

Still on hold:
- Rice, Egg & Greens Bowl: the egg and the "½ roasted" sweet potato
- the sautéed-chard bowls
- chopped almonds
- diced pineapple
- the pancake cinnamon (½ tsp)

Pending: Greek yogurt fat level and avocado record.

**Chamomile & Sweet Potato Toast is now fully reviewed at the ingredient level, but no totals are calculated or shown.** Two decisions remain before calculating it:
1. Whether the sweet potato is peeled. The record describes flesh; the 130 g is edible weight.
2. Explicit approval to publish its estimate.
