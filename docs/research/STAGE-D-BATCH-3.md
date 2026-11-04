# Stage D, batch 3: owner confirmation of the 47 AI-reviewed food tags

Prepared by Claude Code on 2026-11-04. It uses the stage C evaluator with the same CSV snapshot (`FoodData_Central_csv_2026-04-30`), food map, Daily Values and 10% bar. The current tags come from `bc1e20d` (batch 2).

When this packet was prepared, nothing in it had been applied. Each decision needs the owner's approval, and the app changes only after that.

## What these tags are

Of the 73 published food tags, 26 have owner-approved USDA evidence from batches 1 and 2. The other 47 are shown on an AI-assisted source check only: an NIH or MedlinePlus page naming the food as a source, with no amount.

- 39 meet the 10% bar on every mapped record.
- 8 can't be assessed, because water and omega-3 have no FDA Daily Value.

Confirming a tag changes nothing users see except its sources. As in batches 1 and 2, the USDA record would be added under "Sources & review notes", marked owner-approved. Holding a tag removes it the same way batch 1 did.

## Decision 1: confirm the 30 tags that are not protein

| Food | Tag | Lowest %DV per RACC (records) |
| --- | --- | --- |
| Wild Salmon | B12 | 145.8 (4 salmon records) |
| Steel-cut Oats | fiber | 17.1 (2346397) |
| Steel-cut Oats | magnesium | 12.2 (2346397) |
| Dark Chocolate | iron | 19.8 (170273) |
| Dark Chocolate | magnesium | 16.3 (170273) |
| Greek Yogurt | calcium | 14.4 (3 candidate records) |
| Greek Yogurt | B12 | 48.9 (3 records) |
| Orange | vitamin C | 82.8 (169097) |
| Orange | fiber | 12.0 (169097) |
| Banana | fiber | 13.0 (173944, approved) |
| Banana | B6 | 30.2 (173944, approved) |
| Spinach | magnesium | 16.0 (raw 168462; baby 18.8) |
| Kale | fiber | 12.4 (168421) |
| Lean Beef | iron | 12.7 (172173) |
| Lean Beef | B12 | 127.8 (172173) |
| Quinoa | fiber | 14.0 (168917) |
| Eggs | B12 | 18.5 (raw and hard-boiled, both approved) |
| Blueberries | fiber | 12.0 (171711) |
| Kefir | calcium | 23.6 (2 records) |
| Brown Rice | magnesium | 13.0 (169704 approved; 168875 14.7) |
| Avocado | fiber | 12.0 (171705) |
| Turkey | B12 | 62.3 (174516) |
| Turkey | B6 | 41.5 (174516) |
| Almonds | magnesium | 19.3 (170567, approved) |
| Almonds | fiber | 13.4 (170567, approved) |
| Apple | fiber | 12.0 (171688) |
| Pumpkin Seeds | magnesium | 42.3 (170556, approved) |
| Popcorn | fiber | 15.5 (both air-popped records) |
| Strawberries | vitamin C | 91.5 (167762) |
| Chia Seeds | fiber | 36.9 (2 records) |

Checks made for this packet, beyond the stage C map:

- **Dark chocolate:** the food is "Dark Chocolate (70%+)", which matches 170273 (70–85% cacao). The recipes' chocolate chips have no stated cacao percentage, so the two lower USDA ranges were also checked:
  - Iron is 13.4% at 45–59% cacao (170271) and 10.5% at 60–69% (170272).
  - Magnesium is 10.4% and 12.6% at those ranges.
  - Both tags therefore meet the bar at every range. Fiber doesn't (7.5% and 8.6%), which supports holding chocolate fiber in batch 2.
- **Oats:** rolled oats and oat flour map to this food. On the approved rolled-oats record (173904), fiber is 14.4% and magnesium 13.1%, so both tags hold for rolled oats too.
- **Avocado:** the California record (171706), the other candidate in the ledger, gives 12.1%.

**Recommended:** confirm all 30. Their evidence would list the stage C records, plus the extra chocolate, oat and avocado records above.

## Decision 2: protein from animal foods (6 tags)

| Food | Lowest %DV per RACC |
| --- | --- |
| Wild Salmon | 43.6 |
| Greek Yogurt | 29.9 |
| Lean Beef | 48.7 |
| Eggs | 12.6 |
| Kefir | 17.8 |
| Turkey | 50.2 |

These percentages are not corrected for protein quality (PDCAAS), which FDA requires for a protein %DV. Egg, milk, meat and fish proteins are the standard high-quality proteins and score at or near the maximum of 1.0. The corrected value would therefore be about the same, and each tag keeps a clear margin. Eggs, at 12.6%, have the smallest. No PDCAAS source is recorded in the app yet.

**Recommended:** confirm all 6, with a note that the %DV is uncorrected.

## Decision 3: protein from plant foods (3 tags)

| Food | Uncorrected %DV per RACC |
| --- | --- |
| Quinoa | 12.3 (168917) |
| Almonds | 12.7 (170567, approved) |
| Pumpkin Seeds | 18.1 (170556, approved) |

- Plant proteins usually score below 1.0, so the corrected value could fall under 10%, especially for quinoa and almonds.
- This is the same concern that held steel-cut oats protein in batch 2.
- No PDCAAS values have been sourced or reviewed for these foods.

What holding them would change:

- Quinoa and almonds keep every support goal through their other tags.
- Pumpkin Seeds lose Focus & Attention, Wind Down and Everyday Mood Support. They keep magnesium and iron.
- 8 meals lose a protein chip. Brown Rice Veggie Bowl also loses Focus & Attention and Wind Down, and the other 7 keep their goals.
  - Lose a chip only: Chamomile & Sweet Potato Toast (almond butter maps to almonds), Quinoa Fruit Salad, Crunchy Veggie Snack Plate, Loaded Popcorn Trail Mix, Quinoa & Greens Bowl, Green Tea Oat Bites and Dark Chocolate Trail Mix.

**Recommended:** hold all 3 as needs-review until reviewed PDCAAS values are recorded, for consistency with oats. The alternative is to confirm them now as uncorrected upper bounds, with a note.

## Decision 4: the 8 tags that can't be assessed

- Water: Chamomile Tea, Coconut Water, Watermelon, Cucumber and Green Tea.
- Omega-3: Wild Salmon, Walnuts and Chia Seeds.

There is no FDA Daily Value for water or omega-3, so the 10% bar can't apply.

**Recommended:** leave these as they are (published, AI-assisted only) and set a separate rule later. That rule could be a minimum water content per reference amount, or a stated ALA, EPA and DHA amount. Nothing would change now.

## If approved

- The generator (`tools/research/generate_food_tag_reviews.py`) would add batch 3 entries:
  - confirmed tags as `published` with a new `confirmed` action;
  - held plant protein tags as `needs-review` with `held`.
- `FOOD_FACTS` would change only for held tags.
- The knowledge test would be extended, and the full validation would run again before any commit.
- With decisions 1 to 3 as recommended: 70 food tags, 62 with owner-approved evidence, and 8 non-assessable tags still AI-assisted.

## Owner decisions (2026-11-04)

All four recommendations were approved:
- confirm the 30 non-protein tags;
- confirm the 6 animal protein tags, with a note;
- hold the 3 plant protein tags;
- leave the 8 water and omega-3 tags for a later rule.

**Applied 2026-11-04 and committed in `8f7dee0`:**
- `foodTagReviews.ts` now has 80 entries. Batch 3 adds 36 `confirmed` entries (published) and 3 `held` entries (needs-review). The batch 1 and 2 entries are unchanged.
- The extra chocolate, oat and avocado records are evaluated for batch 3 only, so the evidence for batches 1 and 2 is unchanged.
- `FOOD_FACTS` drops protein from quinoa, almonds and pumpkin seeds.
- Each confirmed protein source line says "Not corrected for protein quality (PDCAAS)".
- Food tags went from 73 to 70, and 62 have owner-approved evidence. The 8 that remain AI-assisted are the water and omega-3 tags. Meal tags went from 119 to 111.
- Rerunning stage C: 61 food tags meet the bar, 8 are not assessable, and 1 is record-dependent (spinach iron).
- Validation passes:
  - 50 knowledge tests. The review test now covers batch 3, and checks that every published tag other than water and omega-3 has owner-approved evidence.
  - The typecheck, avatar tests and the build.
  - The browser suite, with no browser errors.
  - 48 research tests.
