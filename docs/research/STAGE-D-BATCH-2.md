# Stage D, batch 2: tags the USDA evidence supports but the app does not show

Prepared by Claude Code on 2026-11-04. It uses the stage C evaluator with the same CSV snapshot (`FoodData_Central_csv_2026-04-30`), food map, Daily Values and 10% bar. The current tags come from the knowledge export of `c5d9908` (batch 1).

When this packet was prepared, nothing in it had been applied. Each decision needs the owner's approval, and the app changes only after that.

**Bar:** at least 10% of the FDA Daily Value per reference amount customarily consumed (RACC), as in batch 1.

## What adding a tag does

- A new tag shows as a chip on the food and passes to every meal that contains the food.
- It also adds the nutrient's support goals. In this batch, only dark chocolate fiber would add goals to a food: Everyday Mood Support, Focus & Attention and Wind Down. Every other candidate food already has a goal that the new nutrient maps to.
- Every addition is a new published claim. As in batch 1, the evidence record would be shown under "Sources & review notes", and the wording would stay "is a source of", never a health effect.

## Every untagged pair the evaluator checked

20 untagged food and nutrient pairs either meet the bar or depend on which record is used. 17 meet it and 3 depend on the record.

| Food | Nutrient | %DV per RACC (records) | Record basis |
| --- | --- | --- | --- |
| Wild Salmon | B6 | 52.9 / 35.5 / 47.3 (raw Atlantic, coho, sockeye; 110 g); 41.3 (sockeye cooked, 85 g) | ledger candidates |
| Mixed Berries | vitamin C | 91.5 (strawberries) / 15.1 (blueberries) / 68.8 (Berries, NFS) / 27.1 (Berries, frozen); 140 g | ledger candidates |
| Banana | vitamin C | 13.5 (173944, 140 g) | recipe-scoped approval |
| Kale | calcium | 16.6 (168421 raw, 85 g) | ledger candidate |
| Kale | vitamin C | 88.2 (168421 raw, 85 g) | ledger candidate |
| Lean Beef | B6 | 36.4 (172173 top sirloin cap, lean, raw, 114 g) | ledger candidate |
| Quinoa | iron | 11.6 (168917 cooked, 140 g) | ledger candidate |
| Quinoa | magnesium | 21.3 (168917) | ledger candidate |
| Quinoa | B6 | 10.1 (168917), borderline | ledger candidate |
| Blueberries | vitamin C | 15.1 (171711, 140 g) | Skewers pilot record |
| Kefir | B12 | 29.8 (170904 lowfat plain) / 30.9 (2705394 Kefir); 240 mL | ledger candidates |
| Pumpkin Seeds | iron | 14.7 (170556, 30 g) | recipe-scoped approval |
| Chia Seeds | calcium | 14.6 (170554 and 2707590, 30 g) | ledger candidates |
| Chia Seeds | iron | 12.9 (both) | ledger candidates |
| Chia Seeds | magnesium | 23.9 (both) | ledger candidates |
| Steel-cut Oats | protein | 10.0 (2346397 dry, 40 g), borderline | proposed in stage C |
| Dark Chocolate | fiber | 11.7 (170273, 70–85% cacao, 30 g) | ledger candidate |
| Popcorn | magnesium | 10.3 (167959 air-popped) vs 9.4 (170246 air-popped, unsalted); 30 g | proposed in stage C |
| Spinach | B12 | 0.0 (168462); baby spinach record has no value | not supported |
| Chia Seeds | B6 | 6.9 (2707590); 170554 has no value | not supported |

Spinach B12 and chia B6 are listed only because the evaluator could not rule them out from every record. Neither meets the bar on any record, so they are not decisions.

## Decision 1: add 15 clearly supported tags

Wild Salmon B6, Mixed Berries vitamin C, Banana vitamin C, Kale calcium and vitamin C, Lean Beef B6, Quinoa iron, magnesium and B6, Blueberries vitamin C, Kefir B12, Pumpkin Seeds iron, and Chia Seeds calcium, iron and magnesium.

- Every record meets the bar.
- Quinoa B6, at 10.1%, is borderline. It meets the rule as written, as the berry fiber tags did in batch 1.
- Lean Beef B6 rests on one cut (top sirloin cap). The recipes' beef cut is still unresolved, but the margin is wide (36%). The beef protein, iron and B12 tags already rest on the same record.
- Mixed Berries and Kefir meet the bar on every candidate record, so the unresolved product identity does not change the result.

**Recommended:** add all 15. (The owner question on 2026-11-04 said "14" by mistake but listed all 15 by name.)

Meals that would gain tags from them (no meal gains a support goal):

- Salmon & Quinoa Bowl: B6.
- Warm Oatmeal with Berries: vitamin C.
- Rice, Egg & Greens Bowl: calcium and vitamin C.
- Chamomile & Sweet Potato Toast: vitamin C.
- Steak & Swiss Chard: B6.
- Berry Kefir Smoothie: vitamin C and B12.
- Brown Rice Veggie Bowl: iron.
- Tropical Fruit Smoothie: vitamin C, calcium, iron and magnesium.
- Quinoa Fruit Salad: iron, magnesium and B6.
- Crunchy Veggie Snack Plate: iron.
- Sunshine Banana Pancakes: vitamin C.
- Quinoa & Greens Bowl: iron and B6.
- Berry Yogurt Parfait: vitamin C.

As before, meal quantities are not assessed. A meal inherits a tag from any ingredient that carries it, however little the meal contains.

## Decision 2: Steel-cut Oats protein (10.0%, uncorrected)

- The dry steel-cut record gives exactly 10.0% before any protein-quality correction. FDA requires a %DV for protein that has been corrected for quality (PDCAAS). Oat protein scores well below 1, so the corrected value would fall under 10%.
- The record was proposed in stage C and is not in the ledger.
- The app maps every "oats" or "oat flour" ingredient to this food. Warm Oatmeal with Berries would therefore gain a protein chip from rolled oats, judged by a steel-cut record.

**Recommended:** don't add it. Record it as needs-review.

## Decision 3: Dark Chocolate fiber (11.7%, one product range)

- The only mapped record is 70–85% cacao. The recipes' cacao percentage is still unresolved in the USDA ledger, and lower-cacao chocolate has less fiber.
- It is the only addition that gives a food new support goals: Everyday Mood Support, Focus & Attention and Wind Down. Chocolate would then appear for Wind Down check-ins.

**Recommended:** don't add it until the cacao percentage is chosen. Record it as needs-review.

## Decision 4: Popcorn magnesium (records disagree)

The two air-popped records give 10.3% and 9.4%. The recipe says "air-popped popcorn" but doesn't say whether it is salted.

**Recommended:** don't add it. Record it as needs-review, the same rule batch 1 would have applied without a record choice.

## If approved

- The same generator (`tools/research/generate_food_tag_reviews.py`) would add these entries to `src/data/foodTagReviews.ts`. Added tags would be `published`, and the three held tags `needs-review`.
- `FOOD_FACTS` would be updated to match. The knowledge test would be extended, and the full validation would run again before any commit.
- Food tags would go from 58 to 73, with 26 having owner-approved evidence.

## Owner decisions (2026-11-04)

All four recommendations were approved: add the 15 tags in decision 1, and hold steel-cut oats protein, dark chocolate fiber and popcorn magnesium.

**Applied 2026-11-04 and committed in `bc1e20d`:**
- `src/data/foodTagReviews.ts` now has 41 entries, each with a `batch` field. Batch 2 adds 15 `added` entries (published) and 3 `held` entries (needs-review, with the reason in the note). `held` is a new action: the evidence looked supportive, but the owner chose not to publish the tag.
- `FOOD_FACTS` was updated to match. Dark chocolate keeps only iron and magnesium, so it gains no goal.
- Food tags went from 58 to 73, and 26 now have owner-approved evidence. Meal tags went from 98 to 119, through the 21 inherited chips listed under decision 1. No meal gains a support goal.
- Rerunning stage C: 64 food tags meet the bar, 8 are not assessable, and 1 is record-dependent (spinach iron, as in batch 1). Of the meal tags, 108 have every contributing food meeting the bar, 2 have some, and 9 are not assessable.
- One existing test pinned salmon's Steady Energy matches to protein and B12. It now expects B6 as well.
- Validation passes: 50 knowledge tests (the review test now covers both batches, the held tags, Warm Oatmeal having no protein chip and chocolate's tags), the typecheck, avatar tests, the build, the browser suite with no browser errors, and 48 research tests.
