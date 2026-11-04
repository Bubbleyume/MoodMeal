# Stage D, batch 4: a rule for the water and omega-3 tags

Prepared by Claude Code on 2026-11-04 from the same CSV snapshot (`FoodData_Central_csv_2026-04-30`). The current tags come from `8f7dee0` (batch 3).

When this packet was prepared, nothing in it had been applied. Each decision needs the owner's approval, and the app changes only after that.

## Why these 8 need their own rule

The 10% Daily Value bar can't apply to water or omega-3, because FDA sets no Daily Value for either. These 8 tags are still shown on an AI-assisted source check only:

- water: Chamomile Tea, Coconut Water, Watermelon, Cucumber and Green Tea;
- omega-3: Wild Salmon, Walnuts and Chia Seeds.

Both rules proposed below are the app's own rules, not FDA label-claim standards. I haven't reviewed FDA's rules on omega-3 content claims. If the app should follow them, that's a separate check.

## Decision 1: water rule

Proposed rule: **the USDA record is at least 90% water by weight** (FDC nutrient 1051).

| Food | Record | Water, g per 100 g | Basis |
| --- | --- | --- | --- |
| Chamomile Tea | 174156, brewed chamomile | 99.70 | recipe-scoped approval |
| Green Tea | 171917, brewed green tea, regular | 99.93 | proposed for this packet |
| Cucumber | 168409, with peel, raw | 95.23 | ledger candidate |
| Coconut Water | 174831, ready-to-drink, unsweetened | 95.03 | ledger candidate |
| Watermelon | 167765, raw | 91.45 | ledger candidate |

- All 5 meet the rule. Watermelon has the smallest margin.
- I considered a share of the National Academies' Adequate Intake for total water (2.7 L a day for women) per reference amount. None of the 5 foods would reach 10% of it, and a reference amount of watermelon (280 g) gives about 256 g of water, or 9.5%. That rule would remove every water tag, so it isn't proposed.
- Green Tea has no record in the stage C map yet. 171917 matches the food card ("1 warm cup, brewed 2–3 minutes"). The decaffeinated record, 171910, would be the alternative.

**Recommended:** adopt the 90% rule and confirm all 5, with 171917 as the Green Tea record.

## Decision 2: omega-3 rule

Proposed rule: **at least 0.16 g of omega-3 fatty acids per reference amount**, counting ALA, EPA, DPA and DHA together. 0.16 g is 10% of the National Academies' Adequate Intake for ALA (1.6 g a day for men, the higher value). There is no intake reference for EPA, DPA or DHA. ALA uses FDC nutrient 1404 where the record has it, and the undifferentiated 18:3 row (1270) otherwise. The table shows which.

| Food | Record (reference amount) | Total omega-3 per reference amount | EPA + DHA |
| --- | --- | --- | --- |
| Wild Salmon | 173686 Atlantic wild, raw (110 g) | 2.22 g (ALA from 1270) | 1.58 g |
| Wild Salmon | 175136 coho wild, raw (110 g) | 1.62 g (ALA from 1270) | 1.19 g |
| Wild Salmon | 173691 sockeye, raw (110 g) | 0.93 g (ALA from 1404) | 0.79 g |
| Wild Salmon | 173692 sockeye, cooked (85 g) | 0.86 g (ALA from 1270) | 0.73 g |
| Walnuts | 170187 (30 g) | 2.72 g (ALA from 1270) | 0 |
| Chia Seeds | 170554 (30 g) | 5.35 g (ALA from 1404) | not reported |
| Chia Seeds | 2707590 (30 g) | 5.35 g (ALA from 1270) | 0 |

- Every record meets the rule, by at least five times.
- Salmon would meet it on EPA and DHA alone. Walnuts and chia meet it on ALA alone.
- The 1270 row can include small amounts of omega-6 18:3. With margins this wide, that doesn't change any result.

**Recommended:** adopt the rule and confirm all 3. Each source line would state the amount and say that the bar is the app's own, based on the ALA Adequate Intake.

## Decision 3: matcha powder passes the water tag to a meal

`foodIdForIngredient` maps any ingredient matching "green tea" or "matcha" to the Green Tea food, which is brewed tea. The Green Tea Energy Bites recipe (meal `green-tea-oat-bites`) uses "Matcha or green tea powder", 1 tsp. That's a dry powder, but the meal inherits the water tag and the Hydration goal from it.

- Recommended fix: map only brewed green tea to the Green Tea food. Leave matcha and green tea powder unmapped, as other unreviewed ingredients are.
- Effect: the bites lose water and Hydration. They keep their other tags through oats and almond butter, so Focus & Attention stays (through fiber).
- `foodIdForIngredient` is used only for tag inheritance and the knowledge export. Ingredient artwork uses its own resolver and isn't affected.
- The other water inheritances use the food itself:
  - Chamomile & Sweet Potato Toast: 1 cup of brewed chamomile.
  - Cooling Cucumber & Watermelon Salad.
  - Tropical Fruit Smoothie: coconut water.
  - Crunchy Veggie Snack Plate: cucumber.

**Recommended:** apply the fix.

## If approved

- The generator would add batch 4 entries:
  - `confirmed` for the 5 water and 3 omega-3 tags;
  - evidence recording the water percentage or the omega-3 grams per reference amount, instead of a %DV.
- `foodTagReviews.ts` would need an evidence shape for these measures, and the source line in `catalog.ts` would describe them.
- The matcha mapping would change in `catalog.ts`, with a test.
- Every published food tag would then have owner-approved USDA evidence: 70 of 70.

## Owner decisions (2026-11-04)

All three recommendations were approved: the 90% water rule, with 171917 for Green Tea; the 0.16 g omega-3 rule; and the matcha mapping fix.

**Applied 2026-11-04 and committed in `fd69ea4`:**
- `foodTagReviews.ts` now has 88 entries. Batch 4 adds 8 `confirmed` entries, and the earlier entries are unchanged.
  - Water and omega-3 evidence carries a `rule` with `waterPercent`, or with `omega3Grams`, `epaDhaGrams` and `alaNutrientId`.
  - `percentDV` is null for them, and `raccGrams` and `raccCategory` are null for water.
  - The generator checks each value against its rule.
- In `catalog.ts`, each of these source lines states the measure and says the bar is MoodMeal's own.
- `foodIdForIngredient` maps only brewed green tea to the Green Tea food. "Matcha or green tea powder" is unmapped.
- **Every published food tag (70 of 70) now has owner-approved USDA evidence.**
- Meal tags went from 111 to 110: Green Tea Energy Bites lost water and Hydration, and keep fiber.
- Stage C still lists the 8 tags as not assessable, because its check is the Daily Value bar. Batch 4's rules are applied by the generator.
- Validation passes:
  - 50 knowledge tests. The review test now requires every published food tag to be reviewed, and covers the batch 4 rules, the source text and the matcha mapping.
  - The typecheck, avatar tests and the build.
  - The browser suite, with no browser errors.
  - 48 research tests.
