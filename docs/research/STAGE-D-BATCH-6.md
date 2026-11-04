# Stage D, batch 6: gram weights for meal tag checks

Prepared by Claude Code on 2026-11-04 from `20cd6f6`. It uses the batch 5 rule, the owner-approved food tag evidence and the USDA review ledger (`docs/usda/remaining-ingredient-review.json`).

When this packet was prepared, nothing in it had been applied. Each decision needs the owner's approval, and the app changes only after that.

## The idea: a weight for tag checks only

77 meal tags can't be checked because an ingredient has no approved gram weight. Most of those ingredients are on hold for reasons a **nutrition estimate** needs but a **tag check** doesn't:

- **What a nutrition estimate needs:** one exact USDA record for the ingredient (species, cut, fat level or variety), because every nutrient is added up from it.
- **What a tag check needs:** only the ingredient's grams. The batch 5 rule already uses the **lowest** owner-approved evidence record for the food, so it doesn't depend on which record is chosen. For salmon, that means the lowest of the Atlantic, coho, sockeye and cooked sockeye records.

So this packet proposes **tag-check weights**. Each is a gram amount for one recipe line, used only by the meal tag rule.

- They don't approve a USDA mapping. They don't feed the Nutrition Calculator or any recipe estimate, and they don't touch `approved-ingredients.json`.
- They would live in a new file, `src/data/tagCheckWeights.ts`, with the basis for each weight.
- Every meal tag record would say whether each weight came from an approved USDA conversion or a tag-check weight.

The holds in the USDA ledger stay as they are.

## Decision 1: exact mass conversions for "oz" quantities (5 lines, 14 tags)

The quantity is a mass, so the grams are exact: 1 oz = 28.349523125 g, 4 oz = 113.4 g and 3 oz = 85.0 g. No USDA portion is involved.

| Recipe line | Tags that would meet (per serving) |
| --- | --- |
| Salmon & Quinoa Bowl: Wild salmon fillet, 4 oz | protein 44.9%, B12 150%, omega-3 1.0 g, B6 36.6% |
| Steak & Swiss Chard: Lean beef, 4 oz | protein 48.4%, iron 12.6%, B12 127%, B6 36.2% |
| Beef & Spinach Stir-Fry: Lean beef strips, 4 oz | protein 48.4%, iron 12.6%, B12 127% |
| Turkey Lettuce Wraps: Cooked turkey breast, 4 oz | protein 67.0%, B12 83.1%, B6 55.4% |
| Cozy Sweet Potato Hash: Cooked turkey breast, 3 oz | none new; its tags already meet through the egg and sweet potato |

Caveats:

- **Salmon:** the recipe doesn't say whether the 4 oz is raw or cooked. Salmon has both raw and cooked records, and the lowest of them is used, so either reading is covered.
- **Beef:** the only evidence record is raw top sirloin cap, so the check reads the 4 oz as raw.
  - If it's cooked weight, cooked beef holds more protein and iron per gram, so the result is still a lower bound for those.
  - B6 and B12 can be partly lost in cooking. Their margins are wide (36% and 127%).
  - Iron, at 12.6%, has the smallest margin. Iron isn't lost in cooking.
- **Turkey:** the recipes say cooked, and the record (174516) is roasted breast meat. These match.

**Recommended:** approve all 5.

## Decision 2: a large egg, 50 g (1 line, 2 tags)

Energizing Power Bowl lists "Egg, 1" without a size. Three other recipes already use the approved large-egg convention of 50 g edible: the hash and the pancakes use raw egg, and the avocado toast uses hard-boiled. The bowl's own approval is held only because its cooking method is unspecified. A tag check uses the lower of the raw and hard-boiled records.

- Tags that would meet: protein 12.6% and B12 18.5%.

**Recommended:** approve.

## Decision 3: chia seeds, 1 tbsp = 10.5 g (1 line, 2 tags)

This is derived from the USDA cup weight (FNDDS 2707590, 168 g per cup) using the US convention of 16 tbsp to the cup. It's the same kind of derivation you approved for walnuts on 2026-10-20 (1 tbsp chopped = 117 g ÷ 16). The ledger calls it a derived portion that needs a convention decision, not a measured tablespoon.

- Tropical Fruit Smoothie, tags that would meet: fiber 18.4% (chia plus the approved banana) and omega-3 1.9 g.
- Its calcium (5.1%), iron (4.5%) and magnesium (8.4%) stay unchecked. They don't count as below, because other ingredients aren't weighed.

**Recommended:** approve.

## Decision 4: cooked quinoa, 185 g per cup (3 lines, 8 tags)

All the recipes measure quinoa cooked. The ledger candidate for the Magnesium Boost Bowl, FDC 168917 "Quinoa, cooked", gives 185 g per cup.

- Magnesium Boost Bowl: Quinoa, 3/4 cup cooked = 138.75 g. Tags that would meet: fiber 13.9%, iron 19.4% and B6 10.0% (borderline).
- Salmon & Quinoa Bowl: Cooked quinoa, 3/4 cup = 138.75 g. Tags that would meet: fiber 13.9%, iron 11.5% and magnesium 21.1%. B6 also meets, through the salmon from decision 1.
- Quinoa Fruit Salad: Cooked quinoa, 1 cup, cooled = 185 g, split into its servings. Tag that would meet: magnesium 14.1%. Its other quinoa tags (fiber, iron and B6) stay unchecked.

Cup weights for cooked grains depend on how firmly the cup is packed. 185 g is USDA's figure for the record and has not been measured in a kitchen.

**Recommended:** approve.

## Effect if all four are approved

- Meal tags that meet the rule rise from 32 to 57. The 25 new ones are 14 + 2 + 2 + 8, minus the salmon bowl's B6, which is counted in both decisions 1 and 4.
- 52 tags stay unchecked, and none falls below.
- No tag is added or removed, so nothing users see changes. The source notes stay at ingredient level.
- The later work isn't changed. The USDA ledger holds, recipe estimates and calculator approvals stay as they are, and they still need exact records.

## If approved

- Add `src/data/tagCheckWeights.ts`, listing each line's recipe ID, ingredient, quantity, unit, grams and basis.
- `checkMealTags` would use an approved USDA conversion first, then a tag-check weight. Each contributor would record which basis it used.
- Regenerate `mealTagReviews.ts`, extend the knowledge test, and run the full validation again before any commit.

## Owner decisions (2026-11-04)

All four recommendations were approved.

**Applied 2026-11-04 and committed with this packet:**
- `src/data/tagCheckWeights.ts` lists the 10 weights, each matched to one exact recipe line (name, quantity, unit and notes) and recorded with its basis.
- `checkMealTags` uses an approved USDA conversion first, then a tag-check weight. Each contributor records `gramsBasis`.
- `mealTagReviews.ts` was regenerated: 57 tags meet, 1 is below (toast vitamin C, unchanged) and 52 are not shown. No meal tag was added or removed, so nothing users see changed.
- The knowledge test now checks that:
  - each weight matches exactly one recipe line;
  - no weighted line is a USDA approval;
  - none of those recipes gained a nutrition estimate.
- Validation passes: 51 knowledge tests, the typecheck, avatar tests, the build, the browser suite with no browser errors, and 48 research tests.
