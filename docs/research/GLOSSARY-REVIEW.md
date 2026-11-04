# Glossary and educational text review

Prepared by Claude Code on 2026-11-04 from `2b0e135`. Claude Code (AI-assisted) downloaded each cited page on 2026-11-04 (NIH ODS, MedlinePlus, NHLBI, NIMH, NIDDK and NCCIH) and compared every statement with the page's own text. The owner did not repeat that comparison; the owner's part is the approval of the decisions below. The quotes below are short excerpts from those pages.

When this packet was prepared, nothing in it had been applied. Each decision needs the owner's approval, and the app changes only after that.

## What users read, and what they don't

Users see four kinds of text:

- the **glossary**: 12 written terms, plus 3 drawn from the nutrient list;
- the **nutrient chip explanations** (10);
- the **support goal explanations** (7);
- the **Wellness lessons** (10).

All of them carry the AI-assisted source check only.

Some text **no screen shows**, because `enrichFood`, `enrichMeal` and `enrichRecipe` replace it:

- the raw `description`, `nutrients` and `moodTags` of foods and meals;
- the raw ingredient lists of meals, which are replaced by the recipe's (some are stale, for example "Steel-cut oats" where the recipe uses rolled oats);
- all 72 recipe `nutritionHighlights`.

That unused text holds unreviewed claims, for example:

- "Contains L-theanine, an amino acid often paired with a sense of calm alertness";
- "A small amount of dark chocolate adds flavonoid antioxidants";
- "Slow-digesting oats topped with antioxidant-rich berries".

## Results

Supported as written by the cited page:

- **Nutrient chips:** all 10.
- **Goal explanations:** all 7. They are framing and disclaimers, and NIMH lists "regular meals", "stay hydrated", sleep, exercise, relaxing activities and "Stay connected".
- **Lessons:** 9 of 10.
- **Glossary terms:** potassium, vitamin C, folate, calcium, sodium and the 3 drawn terms (B12, B6 and water).

## Decision 1: rewrite six glossary entries to match their sources

| Term | Now | Source says | Proposed |
| --- | --- | --- | --- |
| Antioxidants | "help protect cells from damage caused by free radicals … supplements are not equivalent to eating a varied diet" | "may prevent or delay some types of cell damage"; whether the benefits of fruits and vegetables come from antioxidants "isn't clear"; high-dose supplements "may be linked to health risks" | "Substances that may prevent or delay some types of cell damage. Vegetables and fruits are rich sources. It isn't clear whether the benefits of these foods come from their antioxidants, and high-dose antioxidant supplements may carry risks." |
| Fiber | "not fully digested … some types help with cholesterol and blood sugar management" | "a substance found in plants"; "helps prevent constipation"; "soluble fiber lowers cholesterol". Blood sugar isn't stated. | "A type of carbohydrate found in plants. It aids digestion and helps prevent constipation, and soluble fiber can lower cholesterol. Found in whole grains, beans, vegetables and fruit." |
| Protein | "build and maintain tissues … eggs … tofu … some kidney conditions require an individualized plan" | "build and maintain bones, muscles and skin"; "meat, dairy products, nuts, and certain grains and beans". Eggs, tofu and the kidney sentence aren't on this page. | "Used to build and maintain bones, muscles and skin. Meat, dairy, nuts, beans and some grains provide protein." |
| Iron | "Anemia has different causes; do not start iron supplements without checking the cause with a clinician." | Food sources and hemoglobin match. On supplements, it says to tell your doctor about any you take, and "Accidental overdose of iron-containing products is a leading cause of fatal poisoning in children under 6." | Keep the first two sentences. Replace the third with: "Tell your health care provider about any iron supplement you take, and keep iron products away from children." |
| Omega-3 | "involved in normal cell function … walnuts and some seeds provide ALA" | "important components of the membranes that surround each cell"; "ALA is found mainly in plant oils"; nuts and seeds (flaxseed, chia seeds, walnuts) are listed as omega-3 sources | "Fats that are part of the membrane around every cell. Fish and seafood provide EPA and DHA. ALA comes mainly from plant oils, and nuts and seeds such as walnuts and chia also provide omega-3s. Supplements can interact with medicines." |
| Carbohydrates | "… provide carbohydrates along with other nutrients" | only whole grains are said to "offer lots of nutrients … vitamins, minerals, and fiber" | "… Whole grains, beans, vegetables and fruit provide carbohydrates, and whole grains also provide vitamins, minerals and fiber." |

- **Magnesium:** "energy functions" isn't on its consumer page, though the health professional fact sheet says magnesium "is required for energy production". Proposed: "Helps regulate muscle and nerve function, blood sugar and blood pressure. Nuts, seeds, whole grains and leafy vegetables are sources." This is the consumer page's own list.
- **Protein:** the kidney caution is useful, but neither cited page states it. It could return with a reviewed kidney source, such as NIDDK's eating guidance for chronic kidney disease, which wasn't checked here. The Health tools already turn off condition-based ranking for kidney disease.

**Recommended:** apply all seven rewrites, the six in the table plus magnesium.

## Decision 2: fix the Gut & Digestion lesson's source

The lesson says "Increase it gradually", but its fiber source, MedlinePlus "Dietary Fiber", doesn't. The MedlinePlus encyclopedia page "Fiber" does: "Add fiber gradually over a period of a few weeks".

The line "a fermented food is not a proven treatment for a mood" is MoodMeal's own disclaimer. The NCCIH probiotics page doesn't discuss mood.

**Recommended:** add the encyclopedia page as a source and keep the disclaimer.

## Decision 3: record the owner's review on the checked text

The nutrient explanations, goal explanations and lessons cite sources marked `SEEDED_AI_REVIEW` (AI-assisted only). Once decisions 1 and 2 are applied, every visible sentence will have been checked against its source.

Proposal: give the sources of the nutrient explanations, goal explanations and lessons an owner-approved review. The record would be `reviewOrigin: "owner-approved"`, dated 2026-11-04, with a reviewer line that keeps the two roles apart: the source comparison by Claude Code (AI-assisted), and the approval by the project owner.

- Glossary terms carry only a source link, with no review record, so they would gain one in the same form.
- The packet notes that the sources were retrieved on 2026-11-04. These pages change over time, so a later recheck is worthwhile.

**Recommended:** apply.

## Decision 4: delete the unused text

Remove the unused raw fields listed at the top of this packet:

- `description`, `nutrients` and `moodTags` from `foods.ts` and `meals.ts`;
- the raw ingredient lists in `meals.ts`;
- `nutritionHighlights` from `recipes.ts`.

Remove `moodTags` and `nutritionHighlights` from the types too. The shown `description` and `nutrients` are generated in `catalog.ts` and stay.

This works the same way as removing the unused mood fields. Nothing users see changes, and the unreviewed claims can't reach a screen later.

**Recommended:** apply.

## If approved

- Update `glossary.ts`, `education.ts` and the source review records.
- Remove the unused fields.
- Add a knowledge test that pins the glossary wording and checks that every visible source is owner-reviewed. The full validation, including the browser suite, runs again before any commit.

## Owner decisions (2026-11-04)

All four recommendations were approved: rewrite the seven glossary entries (the protein kidney line is dropped), fix the lesson source, mark the checked text owner-reviewed, and delete the unused text.

**Applied 2026-11-04, uncommitted until the owner reviews the change:**
- `glossary.ts`: the seven definitions now use the proposed wording. Every term, including the three drawn from the nutrient list, carries the owner review (origin, reviewer and date).
- `knowledge.ts`: the new `OWNER_TEXT_REVIEW` record applies to the five sources behind the nutrient explanations and the goal explanations. These are the ODS fact sheets, the MedlinePlus protein, fiber and water pages, and NIMH.
  - The record's reviewer line reads "Source comparison: Claude Code (AI-assisted; cited page retrieved 2026-11-04). Approval: project owner (glossary review decisions, 2026-11-04)".
  - The food and meal "source of" facts that reuse those pages keep their AI-assisted review, because the owner approved the nutrient explanation, not each page's food list.
- `education.ts`: every lesson source is owner-reviewed, and Gut & Digestion also cites the MedlinePlus "Fiber" encyclopedia page.
- The unused raw fields were removed:
  - 35 food descriptions, nutrient lists and mood tags;
  - 24 meal descriptions, nutrient lists, mood tags and ingredient lists;
  - 24 recipe `nutritionHighlights` lists (72 tips);
  - `moodTags` and `nutritionHighlights` from the types.
- The knowledge export now counts 10 nutrient definitions, 10 lessons and 7 goals as owner-approved.
  - The development-only export doesn't yet read the glossary's or the mood mapping's review, so it lists them as "unspecified". That's a tooling gap; the app data records both reviews.
- A new knowledge test (53 in total) pins the rewritten wording, the owner review on every glossary term, goal and lesson source, the kept AI-assisted food claims, and the removed text.
- The typecheck, avatar tests, the build, the browser suite (no browser errors) and 48 research tests pass.

**Corrections after the automated review (session `MM-553cd456-dcc7-403b-83a6-e18ee96a768a`, round 1):**
- MM-GLOSSARY-001: removing the raw meal `nutrients` left enriched meals without the field the `Meal` type requires (read by `healthScore` in `src/lib/wellness.ts`). `enrichMeal` now derives it from the reviewed `nutrientFacts`, as `enrichFood` does.
- MM-GLOSSARY-002: the first reviewer line, "Project owner (text checked against the cited page …)", credited the owner with the source comparison. It now names Claude Code for the comparison and the owner for the approval, and the test comments say the same.
- The knowledge test now checks the derived meal nutrients and the reviewer line.
