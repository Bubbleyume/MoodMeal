# Stage D, batch 1: food tags that miss or sit near the 10% bar

Prepared by Claude Code on 2026-11-04 from `research-output/tag-evidence.json` (stage C, CSV snapshot `FoodData_Central_csv_2026-04-30`, knowledge export from `3cc274b`).

When this packet was prepared, nothing in it had been applied. Each decision needs the owner's approval; the app changes only after that.

**Bar:** at least 10% of the FDA Daily Value per reference amount customarily consumed (RACC), the owner's choice of 2026-11-04.

## How tags work in the app today

- `FOOD_FACTS` in `src/data/knowledge.ts` gives each food its nutrient tags.
- Every tag is published. It shows as a chip, gives the food its support goals, and passes to every meal containing that food.
- Mood results (`getRecommendations`) list only foods and meals that have at least one tag matching the mood's goals. A food left with no tags still appears in the Foods browse list, but never in mood results.

## Decision 1: the 12 tags below 10%

| Food | Tag | %DV per RACC (record) | Record basis |
| --- | --- | --- | --- |
| Walnuts | protein | 9.1 (170187, 30 g) | recipe-scoped approval |
| Walnuts | fiber | 7.2 (170187, 30 g) | recipe-scoped approval |
| Sweet Potato | fiber | 9.1 (168482, 85 g raw) | recipe-scoped approval |
| Spinach | fiber | 6.7 (168462), 4.7 (1999632 baby), 85 g | ledger candidates |
| Brown Rice | fiber | 8.0 (169704), 9.0 (168875), 140 g cooked | approval / candidate |
| Watermelon | fiber | 4.0 (167765, 280 g) | ledger candidate |
| Cucumber | fiber | 1.5 (168409, 85 g) | ledger candidate |
| Pumpkin Seeds | fiber | 6.4 (170556, 30 g) | recipe-scoped approval |
| Rainbow Carrots | fiber | 8.5 (170393, 85 g) | ledger candidate |
| Pineapple | fiber | 7.0 (169124, 140 g) | recipe-scoped approval |
| Swiss Chard | fiber | 4.9 (169991, 85 g) | recipe-scoped approval |
| Chia Seeds | protein | 9.9 (170554 and 2707590, 30 g) | ledger candidates |

**Recommended:** withdraw all 12. Each is a published claim that fails the bar you chose. A withdrawn tag would move to needs-review rather than be deleted, so it can return if better evidence appears.

What changes for users if all 12 are withdrawn and nothing is added (decision 4):

- **Gone from mood results entirely**, because no tags remain: Sweet Potato, Rainbow Carrots, Pineapple and Swiss Chard.
- **Keep only their water tag (Hydration):** Watermelon and Cucumber. They lose Balanced Nutrition, Calm & Grounded, Everyday Mood Support, Steady Energy and Wind Down.
- **Walnuts** keep only omega-3, so only Balanced Nutrition and Everyday Mood Support. They lose Calm & Grounded, Focus & Attention, Steady Energy and Wind Down.
- **Brown Rice** keeps only magnesium, so it appears only for Calm & Grounded.
- **Spinach** loses Everyday Mood Support, Focus & Attention and Wind Down. It keeps iron (decision 2) and magnesium.
- **No goal lost:** Pumpkin Seeds keep magnesium and protein, and Chia Seeds keep fiber and omega-3.
- **Meals:** 7 meals lose a chip but keep their goals through other ingredients, except **Cooling Cucumber & Watermelon Salad**, which drops to Hydration only.
  - Warm Oatmeal with Berries: protein.
  - Tropical Fruit Smoothie: protein.
  - Beef & Spinach Stir-Fry: fiber.
  - Cozy Sweet Potato Hash: fiber.
  - Steak & Swiss Chard: fiber.
  - Brown Rice Veggie Bowl: fiber.
  - Cooling Cucumber & Watermelon Salad: fiber.

## Decision 2: Spinach iron (the records disagree)

Raw spinach (168462, "Spinach, raw") gives 12.8%. Baby spinach (1999632, Foundation) gives 6.0%. The catalog food is "Spinach"; baby spinach has its own ledger entry ("Baby spinach").

**Recommended:** keep the tag, with 168462 recorded as its evidence record, because the food is generic spinach. The alternative is to withdraw it until you choose a record. Withdrawing removes iron from the Salmon & Quinoa Bowl.

## Decision 3: Borderline tags that meet the bar

- **Strawberries fiber:** 10.0% (167762; 2.8 g per 140 g).
- **Mixed Berries fiber:** 10.0% to 20.5% across the four candidate records. Its lowest record is exactly 10.0%.

**Recommended:** keep both. They meet the rule as written. (Chia protein, at 9.9%, is in decision 1.)

## Decision 4: tags the same evidence supports but the app does not show

Using the same records, bar and Daily Values, these foods meet 10% for a nutrient they are not tagged with. Only foods in this batch are listed.

| Food | Would meet | %DV per RACC |
| --- | --- | --- |
| Pineapple | vitamin C | 74.4 |
| Swiss Chard | vitamin C; magnesium | 28.3; 16.4 |
| Watermelon | vitamin C | 25.2 |
| Spinach | vitamin C | 26.5 (raw), 25.0 (baby) |
| Sweet Potato | vitamin B6 | 10.5 (borderline) |
| Brown Rice | vitamin B6 | 10.1 (169704, borderline), 12.3 (168875) |
| Walnuts | magnesium | 11.3 |

Rainbow Carrots have no listed nutrient that meets the bar. Their main nutrient, vitamin A, is not one of the app's 10 nutrients. Adding a nutrient is a separate decision.

**Recommended:** approve these with decision 1, as a single change. Each is a new published claim on the same footing as the tags it replaces. Without them, Pineapple, Swiss Chard and Sweet Potato leave mood results even though the evidence supports other tags. Wellness wording stays unchanged: a tag says only that the food provides the nutrient, never that it treats anything.

The rest of the catalog shows 17 more such tags, for example salmon B6, kale vitamin C and calcium, quinoa iron and magnesium, and chia calcium, iron and magnesium. They belong to a later batch.

## Owner decisions (2026-11-04)

All four recommendations were approved: withdraw the 12 below-threshold tags; keep spinach iron on 168462; keep both borderline berry fiber tags; add the 8 new tags.

**Applied 2026-11-04 and committed in `c5d9908`:**
- `src/data/foodTagReviews.ts` (generated from the stage C evaluator) records all 23 decisions: 12 withdrawn as needs-review, 3 kept, 8 added. Each records its evidence: FDC ID, description, RACC grams and category, and %DV.
- `FOOD_FACTS` was updated to match.
- `catalog.ts` adds a USDA FoodData Central source to each reviewed food tag, marked owner-approved. It appears under "Sources & review notes".
- Food tags went from 62 to 58: 11 have owner-approved evidence and 47 still have AI-assisted review only. Meal tags went from 95 to 98.
- Rerunning stage C: 49 food tags meet the bar, 0 are below, 8 are not assessable, and 1 is record-dependent. That one is spinach iron, which the map still evaluates against both records; your decision rests on 168462.
- Meal tags added by inheritance: vitamin C in Salmon & Quinoa Bowl, Beef & Spinach Stir-Fry, Cooling Cucumber & Watermelon Salad, Steak & Swiss Chard, Brown Rice Veggie Bowl and Quinoa & Greens Bowl; magnesium in Steak & Swiss Chard; vitamin B6 in Rice, Egg & Greens Bowl, Beef & Spinach Stir-Fry and Brown Rice Veggie Bowl. Meal quantities are still not assessed.
- Validation passes: a new knowledge test (50 in total), the typecheck, avatar tests, the build, the browser suite with no browser errors, 48 research tests and the consistency checks. The checks report only the expected Skewers pineapple note.

## Implementation (as planned before approval)

- `FOOD_FACTS` gains a per-tag review state, so withdrawn tags stay recorded as needs-review instead of being deleted.
- Only published tags drive chips, support goals, meal inheritance and explanations.
- Each tag records its evidence: FDC ID, RACC, %DV and the stage C snapshot.
- Tests pin the new tag set. The browser suite runs again. The knowledge export and stage C report are regenerated and reviewed before a commit.
