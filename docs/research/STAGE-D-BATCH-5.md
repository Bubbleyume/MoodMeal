# Stage D, batch 5: amounts behind meal tags

Prepared by Claude Code on 2026-11-04. It uses the tags and evidence in `fd69ea4` (batch 4), the approved recipe-scoped USDA gram weights, and the two published recipe estimates.

When this packet was prepared, nothing in it had been applied. Each decision needs the owner's approval, and the app changes only after that.

## How meal tags work today

- A meal shows every tag carried by any of its ingredients, through `foodIdForIngredient`. Amounts are never checked.
- The meal's explanation reads "This meal brings together ingredients that provide …". That sentence is true at the ingredient level, but the chip looks like a claim about the meal.
- There are 110 meal tags across 24 meals.

## Decision 1: pineapple is mapped to apple (bug)

The alias list checks `/apple/` before `/pineapple/`, so every "Pineapple" ingredient is treated as **Apple**.

- Tropical Fruit Smoothie, Quinoa Fruit Salad and Rainbow Fruit Skewers inherit apple's fiber through pineapple, instead of pineapple's vitamin C.
- The set of tags on those meals happens not to change, because other ingredients carry fiber and vitamin C. What's wrong is the attribution in the source lines and the knowledge export.
- Every other ingredient maps as intended. I checked all 72 ingredient names. Some mappings are approximations: almond butter counts as almonds, and rolled oats and oat flour as oats.

**Recommended:** match "apple" only as a whole word (`/\bapple/i`), and add a test that "Pineapple" maps to pineapple.

## Decision 2: a per-serving rule for meal tags

Proposed rule. A meal tag is **shown to meet** when one serving provides:

- at least 10% of the FDA Daily Value, the same bar as food tags but per serving instead of per reference amount;
- for omega-3, at least 0.16 g;
- for water, at least **120 g** (half a US cup) from ingredients that meet the 90% water rule.

The amount comes from:

1. the published recipe estimate, when the recipe has one (Rainbow Fruit Skewers, Chamomile & Sweet Potato Toast);
2. otherwise, only the tagged ingredients that have an approved gram weight. This is a **lower bound**. Unweighed ingredients are never assumed to be zero or any other amount, so a low lower bound is "not shown", never "below".

Per-gram amounts use the tag's lowest evidence record. The bar is MoodMeal's own. FDA's rules for claims on meals and main dishes weren't reviewed.

The water bar is the only new number. At 240 g (1 cup), the toast's 236 g of tea would just miss it.

### Results under this rule

- **Shown to meet (32 tags, 15 meals):**

  | Meal | Tags shown to meet (per serving) |
  | --- | --- |
  | Warm Oatmeal with Berries | fiber 14.6%, magnesium 15.1%, omega-3 0.66 g |
  | Rice, Egg & Greens Bowl | magnesium 14.1%, B6 10.9% |
  | Beef & Spinach Stir-Fry | B6 10.9%, magnesium 14.1% |
  | Chamomile & Sweet Potato Toast (estimate) | B6 30.7%, magnesium 33.4%, fiber 31.5%, water 236 g |
  | Cozy Sweet Potato Hash | B6 16.1%, protein 25.2%, B12 37.0% |
  | Steak & Swiss Chard | vitamin C 24.0%, magnesium 13.9% |
  | Berry Kefir Smoothie | B6 12.7% |
  | Brown Rice Veggie Bowl | magnesium 36.8%, B6 10.9% |
  | Gentle Avocado Toast | protein 12.6%, B12 18.5% |
  | Tropical Fruit Smoothie | vitamin C 93.4%, B6 12.7% |
  | Crunchy Veggie Snack Plate | magnesium 11.4% |
  | Rainbow Fruit Skewers (estimate) | vitamin C 94.8%, fiber 12.4% |
  | Sunshine Banana Pancakes | B6 12.7%, protein 12.6%, B12 18.5% |
  | Quinoa & Greens Bowl | magnesium 22.7% |
  | Green Tea Oat Bites | fiber 10.6%, magnesium 13.1% |

- **Shown to fall below (1):** Chamomile & Sweet Potato Toast, vitamin C. The full estimate is 8.3 mg per serving, 9.2% of the Daily Value. The toast keeps all its support goals without it.
- **Not yet shown (77):** at least one contributing ingredient has no approved weight, and the weighed part doesn't reach the bar on its own. Examples:
  - every tag on Salmon & Quinoa Bowl, Turkey Lettuce Wraps and the yogurt meals;
  - Brown Rice Veggie Bowl iron: 7.9% from pumpkin seeds alone, plus other ingredients that aren't weighed.

The skewers show why the lower bound matters. Their tagged ingredients alone give 8.3% fiber, but the full estimate, which includes pineapple's fiber, gives 12.4%.

**Recommended:** adopt the rule, with the 120 g water bar.

## Decision 3: what to do with tags that aren't shown to meet

| Option | Effect |
| --- | --- |
| **A. Withdraw only what is shown to fall below; record the rest** | The toast loses its vitamin C chip. The other 77 stay visible with their ingredient-level wording. A generated record keeps each meal tag's status (meets, below, not yet shown) and is checked again as gram weights are approved. |
| B. Show only the 32 that are shown to meet | 9 of 24 meals keep no tags and leave mood results: Salmon & Quinoa Bowl, Cooling Cucumber & Watermelon Salad, Turkey Lettuce Wraps, Quinoa Fruit Salad, Loaded Popcorn Trail Mix, Ginger Citrus Soup, Orange Yogurt Smoothie, Berry Yogurt Parfait and Dark Chocolate Trail Mix. Many more lose goals. |

Option B mostly reflects how few weights have been approved (26 of 110 tags have every contributing ingredient weighed), not what the meals contain.

**Recommended:** option A. Tests would pin the statuses, and nothing would change for the 77 tags until weights are approved.

## If approved

- Fix the pineapple alias in `catalog.ts`, with a test.
- A generator, alongside the food tag generator, would write `src/data/mealTagReviews.ts`. It would hold every meal tag's status, per-serving amount and basis (estimate or lower bound), plus the withdrawn toast vitamin C tag.
- `metadata()` would leave out withdrawn meal tags. The test would check each status against the rule.
- The full validation would run again before any commit.

## Owner decisions (2026-11-04)

All three recommendations were approved: fix the pineapple alias, adopt the rule with the 120 g water bar, and withdraw only the tag shown to fall below (option A).

**Applied 2026-11-04 and committed in `6564822`:**
- `catalog.ts`: "apple" now matches only as a whole word, so "Pineapple" maps to the Pineapple food. No meal's set of tags changed, but the pineapple contributions are now credited correctly.
- `src/lib/mealTagRule.ts` holds the rule (`checkMealTags`).
- `tools/research/generate-meal-tag-reviews.mjs` writes `src/data/mealTagReviews.ts` with all 110 statuses: 32 meet, 1 is below and 77 are not shown.
- `metadata()` withholds `needs-review` meal tags. Only toast vitamin C is withheld, from both the meal and the recipe. The toast keeps B6, fiber, magnesium and water, and all its support goals.
- Meal tags went from 110 to 109.
- A new knowledge test (51 in total) checks:
  - the recorded statuses equal the rule applied to today's recipes, so they fail on drift, for example when a new gram weight is approved;
  - every shown meal tag has a published record;
  - a weighed-ingredient check is never "below";
  - the pineapple mapping.
- Validation also passes: the typecheck, avatar tests, the build, the browser suite with no browser errors, and 48 research tests.
- When a new gram weight is approved, the test will fail until `node tools/research/generate-meal-tag-reviews.mjs` is run and the diff reviewed. A tag that becomes "below" is withdrawn only through that reviewed regeneration.
