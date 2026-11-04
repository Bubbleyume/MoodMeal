# Stage D, batch 7: more tag-check weights, and juiced orange

Prepared by Claude Code on 2026-11-04 from `09c445e` (batch 6). It uses the same rule and evidence. The USDA portions come from `food_portion.csv` in the CSV snapshot `FoodData_Central_csv_2026-04-30`.

When this packet was prepared, nothing in it had been applied. Each decision needs the owner's approval, and the app changes only after that. All weights here are **tag-check weights**, as in batch 6: they are not USDA mappings, and they never feed the calculator or recipe estimates. The holds in the USDA ledger stay as they are.

`AI_HANDOFF.md` records that the owner prefers recommended defaults to repeated questions. So each group below can be approved as a whole.

## Decision 1: weights that need no recipe choice (7 lines, 14 tags)

In each case, every candidate record has the same weight, or the lowest candidate weight is used. The open product question, such as fat level or fresh versus frozen, therefore doesn't change the result. Each tag check still uses the food's lowest evidence record.

| Recipe line | Weight and USDA portion | Tags that would meet (per serving) |
| --- | --- | --- |
| Berry Yogurt Parfait: Greek yogurt, 1 cup | 245 g. Whole, low-fat and nonfat records all list 1 cup = 245 g (290696, 290701, 290706) | protein 43.1%, calcium 20.8%, B12 70.5% |
| Orange Yogurt Smoothie: Greek yogurt, 1/2 cup | 122.5 g (half of 245 g) | protein 21.5%, calcium 10.4% (borderline), B12 35.2% |
| Berry Kefir Smoothie: Kefir, 1 cup | 243 g, the lower of the two records (170904 is 243 g, 2705394 is 244 g) | protein 17.5%, calcium 23.2%, B12 29.4% |
| Berry Kefir Smoothie: Blueberries, 1/2 cup | 74 g, half of 171711's 148 g cup (fresh; frozen cups weigh more) | with the approved banana: fiber 11.8%, vitamin C 13.7% |
| Tropical Fruit Smoothie: Coconut water, 1 cup | 245 g (174831, ready-to-drink, unsweetened) | water 233 g |
| Quinoa Fruit Salad: Pineapple, 1/2 cup diced | 82.5 g, half of 169124's 165 g cup of chunks, with "diced" read as chunks | with the strawberries: vitamin C 49.0% |
| Quinoa Fruit Salad: Strawberries, 1/2 cup sliced | 83 g, half of 167762's 166 g sliced cup (an exact portion match) | with the batch 6 quinoa: fiber 12.2% |

**Recommended:** approve all 7.

## Decision 2: sizes the recipes leave unstated (6 lines, 7 tags)

Each of these needs a size or measuring convention. The ledger warns against choosing one silently, so this decision is the owner's explicit choice. The basis of each weight would record it.

| Recipe line | Proposed definition and weight | Tags that would meet (per serving) |
| --- | --- | --- |
| Crunchy Veggie Snack Plate: Apple, 1 sliced | medium apple, 3 in, 182 g (171688 portion 89193) | fiber 15.6% |
| Crunchy Veggie Snack Plate: Cucumber, 1/2 sliced | half of USDA's 8¼ in cucumber, 150.5 g (168409, 301 g) | water 143 g |
| Cooling Cucumber & Watermelon Salad: Cucumber, 1 sliced | USDA's 8¼ in cucumber, 301 g, split into its servings | water 143 g |
| Gentle Avocado Toast: Avocado, 1/2 | half of USDA's reference avocado (201 g), 100.5 g | fiber 24.1% |
| Orange Yogurt Smoothie: Orange, 1 peeled | USDA's 2⅝ in orange, 131 g (169097 portion 84230) | vitamin C 77.5%, fiber 11.2% |
| Energizing Power Bowl: Kale, 1 cup massaged | 1 cup of raw kale, loosely filled and measured **before** massaging, 21 g (168421) | vitamin C 21.8% |

- **Cucumber** is weighed with its peel. The salad's 143 g of water comes from the cucumber alone; the watermelon would only add to it.
- **Kale:** calcium (4.1%) and fiber (3.1%) stay unchecked, not below.

**Recommended:** approve all 6.

## Decision 3: juiced orange inherits fiber

Ginger Citrus Soup lists "Orange, 1, juiced", which is the juice of one orange (USDA: about 86 g of juice per fruit). The line maps to the Orange food, so the soup shows orange's **fiber** tag. That tag comes from the whole fruit, and juice has very little fiber.

| Option | Effect |
| --- | --- |
| **A. Juiced lines don't inherit fiber** | A small rule in `catalog.ts`: an ingredient line whose notes say "juiced" passes on no fiber. The soup keeps vitamin C, so it keeps Balanced Nutrition and Everyday Mood Support, and loses the four goals that came only through fiber. Its vitamin C is still checked against the whole-fruit record, and stays unchecked until it's weighed. |
| B. Don't map juiced orange at all | The soup loses fiber and vitamin C. It would then have no tags left and drop out of mood results. |
| C. Leave it | The soup keeps a fiber chip that its ingredient doesn't support. |

The soup has no other tagged ingredients.

**Recommended:** option A.

## Still held after this batch

These need information only the recipe or a kitchen can give. They stay unchecked:

- mixed berries and pancake berries (which fruits, and how much of each);
- dark chocolate chips (cacao percentage, and a tablespoon weight);
- oat flour (type and weight);
- Swiss chard in the two bowls (measured raw or sautéed);
- baby spinach and stir-fry spinach (weights);
- popcorn (cup weight);
- walnuts in the trail mix (halves or chopped);
- almonds in the wraps (chopped tablespoon).

## Effect if all three are approved

- Decision 3A takes the soup's fiber tag off, which was a not-shown tag, so there would be 109 meal tags.
- Meal tags that meet the rule: 57 → 78. Not shown: 52 → 30. Below: 1 (unchanged).
- Users would see one change: the soup's fiber chip goes. The soup would then appear only for Balanced Nutrition and Everyday Mood Support, which come through vitamin C. It would no longer appear for Steady Energy, Calm & Grounded, Focus & Attention or Wind Down.

## If approved

- Add the 13 weights to `src/data/tagCheckWeights.ts`, each with its basis.
- Add the juiced-line rule, with a test.
- Regenerate `mealTagReviews.ts`, extend the knowledge test, and run the full validation again before any commit.

## Owner decisions (2026-11-04)

All three recommendations were approved: the 7 weights that need no recipe choice, the 6 size definitions (recipe text unchanged), and option A for juiced lines.

**Applied 2026-11-04 and committed with this packet:**
- `tagCheckWeights.ts` now has 23 weights, each with its USDA portion and decision in the basis.
- New `inheritedNutrients(line)` in `catalog.ts`: a line whose notes say "juiced" passes no fiber. `metadata()` and `checkMealTags` both use it.
- Ginger Citrus Soup now shows only vitamin C.
- `mealTagReviews.ts` was regenerated: 109 meal tags, of which 78 meet, 1 is below and 30 are not shown.
- Validation passes:
  - 51 knowledge tests, with updated counts and new checks on the juiced rule and the soup's tags.
  - The typecheck, avatar tests and the build.
  - The browser suite, with no browser errors.
  - 48 research tests.
