# Mood-to-goal rules review

Prepared by Claude Code on 2026-11-04 from `598f010`. It covers `goalsForMood` and the ranking filters in `src/lib/recommendations.ts`, the mood records in `src/data/emotions.ts`, and what each check-in returns with default preferences.

When this packet was prepared, nothing in it had been applied. Each decision needs the owner's approval, and the app changes only after that.

## What the rules are

The goal for each mood is a framing choice. It isn't a nutrition claim and doesn't need a nutrition source. Every goal explanation already says that food doesn't treat a mood. Each goal cites NIMH "Caring for Your Mental Health" (regular meals, hydration, routine).

| Mood | Goal | Picks (default preferences) |
| --- | --- | --- |
| Happy, Silly | Balanced Nutrition | 6 foods, 6 meals |
| Sad, Shy | Everyday Mood Support | 6, 6 |
| Tired | Steady Energy | 6, 6 |
| Scared, Angry, Nervous, Worried | Calm & Grounded | 6, 6 |
| Bored | Focus & Attention | 6, 6 |
| Excited, Sick | Hydration | 5 foods, 4 meals |

At intensity 8 or more, Worried, Nervous and Angry also get **Wind Down**. With Calm & Grounded or Wind Down, any item whose **id** contains `green-tea` or `chocolate` is left out.

## Decision 1: Excited goes to Hydration

There's no clear reason for this pairing. The unused old description spoke of "balanced meals … and electrolytes". Hydration also gives Excited the narrowest results: 5 drinks and water-rich foods, and 4 meals.

| Option | Effect |
| --- | --- |
| A. Keep Hydration | No change. |
| **B. Balanced Nutrition** | Excited gets the same picks as Happy and Silly. |
| C. Balanced Nutrition and Hydration | Both labels and explanations appear. The picks are mostly the same as B, because ranking counts matching nutrients and water-only items rank low. |

**Recommended:** B. Sick stays on Hydration: drinking enough fluids while unwell is common self-care advice, and the explanation already mentions fluid restrictions.

## Decision 2: Wind Down at high intensity

Wind Down's nutrients (fiber and protein) are a subset of Calm & Grounded's. Adding it therefore **never changes the picks**. It only adds the "Wind Down" label and its explanation: "Simple food ideas alongside a sleep routine. No food is being recommended as a sleep aid."

Scared also maps to Calm & Grounded but doesn't get Wind Down.

| Option | Effect |
| --- | --- |
| **A. Keep it and add Scared** | The four calm moods behave the same way at high intensity. |
| B. Keep as is | Scared stays the exception. |
| C. Remove Wind Down from moods | Simpler. The goal remains, but no mood reaches it. |

**Recommended:** A.

## Decision 3: the caffeine filter checks ids, not ingredients (bug)

Under Calm & Grounded or Wind Down, these items are left out because of their ids: Green Tea (food), Dark Chocolate (food), Green Tea Oat Bites and Dark Chocolate Trail Mix.

**Loaded Popcorn Trail Mix** contains dark chocolate chips, but its id doesn't match, so it isn't filtered. It isn't in today's top 6 for the calm moods, but preference filters could bring it in.

Fix: leave out any food or meal whose name or ingredients mention green tea, matcha or chocolate. Matching ingredient names is needed because matcha powder has no food mapping since batch 4.

**Recommended:** apply the fix, with a test.

## Decision 4: unused mood fields hold unreviewed claims

Each mood record has `description`, `nutrientFocus`, `exampleFoods` and `exampleMeals`. **No screen shows them.** They hold wording and nutrients that the reviewed system doesn't support. For example:

- "Probiotic and magnesium-rich foods support your gut";
- "Iron, B vitamins, and steady-releasing carbs can help support normal energy metabolism";
- the nutrients Tryptophan, Zinc, L-theanine, Probiotics and "Calming Herbs";
- an example meal named "Immune-Support Smoothie".

**Recommended:** delete these four fields from the mood records and from the `Emotion` type, so they can't reach a screen later. Nothing users see changes.

## Decision 5: a support note for strong check-ins

The results page ends with the wellness disclaimer: "If you're struggling, please reach out to a healthcare professional or someone you trust". Nothing appears near the top for a strong check-in.

Proposal: at intensity 8 or more, show one short line above the goal card.

- Sad, Worried, Scared, Nervous and Angry: "If this feeling is strong or lasting, consider talking with a healthcare professional or someone you trust."
- Sick: "If you feel very unwell or symptoms are getting worse, contact a healthcare professional."

No crisis line or phone number would be shown. That depends on the launch country, which is still undecided (see `AI_HANDOFF.md`, Known Issues). Add one once the country is chosen.

**Recommended:** add the note.

## If approved

- Change `goalsForMood` (decisions 1 and 2) and the caffeine filter (decision 3).
- Remove the unused mood fields (decision 4).
- Add the note to `MoodResultPage` (decision 5).
- Extend the knowledge test for the mapping, the caffeine filter and the note. The browser suite runs again before any commit.

## Owner decisions (2026-11-04)

- Decision 1: **B**. Excited now maps to Balanced Nutrition.
- Decision 2: **A**. Scared now joins Worried, Nervous and Angry, adding Wind Down at intensity 8 or more.
- Decision 3: **fix**. The new `hasCaffeineSource(item)` checks names and ingredient names. It flags Green Tea, Dark Chocolate, Green Tea Oat Bites, Dark Chocolate Trail Mix and, newly, Loaded Popcorn Trail Mix.
- Decision 4: **delete**. `description`, `nutrientFocus`, `exampleFoods` and `exampleMeals` were removed from `src/data/emotions.ts` and the `Emotion` type.
- Decision 5: **not approved**. No support note was added. It can be raised again with the launch-country decision.

**Applied 2026-11-04 and committed with this packet:**
- A new knowledge test (52 in total) pins all 12 mappings at intensity 5 and 8, the removed fields, the caffeine-flagged items, and that no calm pick contains a caffeine source.
- The typecheck, avatar tests, the build, the browser suite (no browser errors) and 48 research tests pass.
