import { calculateNutrition } from "../src/lib/nutrition";
import { approvedPilotNutrition, PILOT_RECIPE_ID } from "../src/data/usdaPilot";
import { APPROVED_INGREDIENTS, approvedIngredientInput, recipeReviewCoverage } from "../src/data/usdaApprovals";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import {
  getRecommendations,
  matchingNutrients,
  whyPick,
  goalsForMood,
  explainPick,
  displayedNutrients,
  nutrientDisplay,
  verifiedNutrients,
  USDA_NUTRIENT_IDS,
} from "../src/lib/recommendations";
import type { RecipeNutritionEstimate } from "../src/types/nutrition";
import type { GoalId } from "../src/types/library";
import { FOODS } from "../src/data/foods";
import { MEALS } from "../src/data/meals";
import { RECIPES } from "../src/data/recipes";
import { EMOTIONS } from "../src/data/emotions";
import { DEFAULT_PREFERENCES, eligible } from "../src/lib/preferences";
import { aggregateGroceries } from "../src/lib/grocery";
import { parseIngredient } from "../src/lib/catalog";
import {
  extractCandidates,
  transition,
  canPublish,
  importDraftRecords,
} from "../src/lib/libraryReview";
import { historyInsights } from "../src/lib/interactions";
import { NUTRIENTS, GOALS, source } from "../src/data/knowledge";

let checks = 0;
const test = (name: string, fn: () => void) => {
  fn();
  checks++;
  console.log("PASS", name);
};
test("all moods and intensities have source-backed matching explanations", () => {
  for (const mood of EMOTIONS)
    for (const intensity of [1, 5, 10]) {
      const r = getRecommendations({
        emotionId: mood.id,
        intensity,
        preferences: DEFAULT_PREFERENCES,
      });
      assert(r.foods.length + r.meals.length > 0);
      for (const item of [...r.foods, ...r.meals]) {
        const ids = matchingNutrients(item, r.goals);
        assert(ids.length);
        assert(ids.every((id) => r.nutrientIds.includes(id)));
        assert(
          ids
            .slice(0, 3)
            .every((id) =>
              whyPick(item, r.goals).toLowerCase().includes(NUTRIENTS[id].label.toLowerCase()),
            ),
        );
      }
    }
});
test("tired salmon matches protein and B12, not omega-3 alone", () => {
  const salmon = FOODS.find((f) => f.id === "wild-salmon")!;
  assert.deepEqual(matchingNutrients(salmon, ["steady-energy"]), [
    "protein",
    "b12",
  ]);
});
test("health conditions do not silently influence rankings", () => {
  const input = {
    emotionId: "tired" as const,
    intensity: 5,
    preferences: DEFAULT_PREFERENCES,
  };
  assert.deepEqual(
    getRecommendations(input),
    getRecommendations({
      ...input,
      health: {
        conditions: ["hypertension", "anemia"],
        notes: "",
        personalized: true,
      },
    }),
  );
});
test("intensity can introduce wind-down goal", () =>
  assert(goalsForMood("worried", 9).includes("wind-down")));
test("diet and every declared allergen excluded", () => {
  for (const allergen of [
    "milk",
    "egg",
    "fish",
    "tree nuts",
    "soy",
    "wheat",
    "sesame",
  ]) {
    const p = { ...DEFAULT_PREFERENCES, allergies: [allergen] };
    for (const i of [...FOODS, ...MEALS])
      if (i.allergens.includes(allergen)) assert(!eligible(i, p), i.name);
  }
  for (const i of [...FOODS, ...MEALS])
    if (!i.dietaryTags.includes("vegan"))
      assert(!eligible(i, { ...DEFAULT_PREFERENCES, dietaryPattern: "vegan" }));
});
test("time, snack and skill preferences constrain meals", () => {
  const p = {
    ...DEFAULT_PREFERENCES,
    maxPrepTime: 10,
    recommendationType: "snack" as const,
    cookingSkill: "Easy" as const,
  };
  const r = getRecommendations({
    emotionId: "happy",
    intensity: 5,
    preferences: p,
  });
  assert(
    r.meals.every(
      (m) =>
        m.prepTimeMinutes <= 10 &&
        m.mealType !== "full-meal" &&
        m.difficulty === "Easy",
    ),
  );
});
test("published gate excludes unreviewed nutrient facts", () => {
  const food = {
    ...FOODS[0],
    nutrientFacts: FOODS[0].nutrientFacts.map((f) => ({
      ...f,
      reviewStatus: "draft" as const,
    })),
  };
  assert.deepEqual(matchingNutrients(food, ["steady-energy"]), []);
});
test("grocery aggregates compatible quantities including same batch", () => {
  const result = aggregateGroceries(
    [],
    [
      { name: "Spinach", quantity: "1 cup" },
      { name: "Spinach", quantity: "2 cups" },
      { name: "Spinach", quantity: "1/2 cup" },
    ],
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].quantity, "3.5 cup");
});
test("grocery keeps incompatible units, notes and completed entries", () => {
  const a = aggregateGroceries(
    [],
    [
      { name: "Spinach", quantity: "1 cup" },
      { name: "Spinach", quantity: "100 g" },
      { name: "Spinach", quantity: "1 cup cooked" },
    ],
  );
  assert.equal(a.length, 3);
  a[0].checked = true;
  assert.equal(
    aggregateGroceries(a, [{ name: "Spinach", quantity: "1 cup cooked" }])
      .length,
    4,
  );
  assert.equal(
    parseIngredient({ name: "Oats", quantity: "1 1/2 cups" }).quantity,
    1.5,
  );
});
test("every meal uses canonical recipe quantity and time", () => {
  for (const m of MEALS) {
    const r = RECIPES.find((r) => r.id === m.recipeId)!;
    assert(r);
    assert.equal(m.prepTimeMinutes, r.totalTime);
    assert.deepEqual(m.structuredIngredients, r.structuredIngredients);
    assert(r.id === PILOT_RECIPE_ID ? r.nutrientTotals !== null : r.nutrientTotals === null);
    assert(existsSync("public" + m.image));
  }
  for (const f of FOODS) assert(existsSync("public" + f.image));
});
const provenance = source("Test source", "https://example.org", "Section 1");
test("resource import never copies prose or inherits publication", () => {
  const text =
    "Vitamin B12 treats depression with a 50 mg supplement. Recipe: cup of spinach. Sleep and gut health.";
  const candidates = extractCandidates(
    [{ location: "page 5", text }],
    provenance,
  );
  assert.equal(candidates.length, 4);
  assert(
    candidates.every(
      (c) =>
        c.reviewStatus === "draft" &&
        c.originalCopy === "" &&
        c.sourceProvenance[0].pageOrSection === "page 5",
    ),
  );
  assert(
    candidates.some((c) => c.flags.includes("Medical or treatment claim")),
  );
  assert.throws(() => transition(candidates[0], "published"));
});
test("review must proceed in order with source and copyright checks", () => {
  let c = extractCandidates(
    [{ location: "section", text: "diet and food" }],
    provenance,
  )[0];
  c = {
    ...c,
    claimType: "wellness-education",
    originalCopy:
      "A regular meal can be one manageable part of an everyday routine.",
    reviewer: "Test editor",
    reviewNote: "Compared wording with source.",
    originalOrLicensed: true,
    sourceProvenance: [{ ...provenance, reviewedBy: "Test editor" }],
  };
  c = transition(c, "needs-review");
  c = transition(c, "reviewed");
  c = transition(c, "published");
  assert.equal(c.reviewStatus, "published");
  assert(
    canPublish({ ...c, originalCopy: "This food cures depression." }).length >
      0,
  );
  assert(
    canPublish({
      ...c,
      sourceProvenance: [{ ...provenance, evidenceStatus: "unverified" }],
    }).length > 0,
  );
});
test("history ignores seed data and orphan interactions", () => {
  const now = new Date("2026-10-13T16:00:00");
  const entries = [
    {
      id: "real",
      date: now.toISOString(),
      emotionId: "tired" as const,
      intensity: 5,
    },
    {
      id: "seed-1",
      date: now.toISOString(),
      emotionId: "happy" as const,
      intensity: 8,
    },
  ];
  const insights = historyInsights(
    entries,
    [
      {
        id: "x",
        date: now.toISOString(),
        itemId: "oats",
        name: "Oats",
        kind: "food",
        action: "save",
        checkInId: "missing",
        emotionId: "tired",
      },
    ],
    now,
  );
  assert(insights.some((t) => t.includes("tired 1 time")));
  assert(!insights.some((t) => /Oats|happy/.test(t)));
});
test("restored JSON retains sources but resets publishing decisions", () => {
  const restored = importDraftRecords({ records: [{ title: "Original note", originalCopy: "An original educational explanation for review.", claimType: "wellness-education", reviewStatus: "published", originalOrLicensed: true, sourceProvenance: [provenance, { ...provenance, sourceTitle: "Second source", pageOrSection: "page 9" }] }] });
  assert.equal(restored[0].reviewStatus, "draft");
  assert.equal(restored[0].originalOrLicensed, false);
  assert.equal(restored[0].sourceProvenance.length, 2);
  assert(restored[0].sourceProvenance.every(s => s.evidenceStatus === "unverified"));
  assert.throws(() => importDraftRecords({ records: [{}] }));
  assert.throws(() => transition(restored[0], "published"));
});
test("snack-only picks exclude cooking ingredients", () => {
  const prefs = { ...DEFAULT_PREFERENCES, recommendationType: "snack" as const };
  for (const food of FOODS.filter(f => /salmon|turkey|beef/.test(f.id))) assert.equal(eligible(food, prefs), false);
});
test("only approved raw-fruit pilot exposes USDA nutrition with preserved unknowns", () => {
  const pilot = RECIPES.find(r => r.id === PILOT_RECIPE_ID)!;
  const estimate = pilot.nutritionEstimate!;
  assert.equal(RECIPES.filter(r => r.nutritionEstimate).length, 1);
  assert.equal(estimate.servings, 2);
  assert.deepEqual(estimate.ingredients.map(i => [i.fdcId,i.grams,i.portionId]), [["167762",144,"81922"],["169124",165,"84287"],["171711",74,"89238"]]);
  const expected: Record<string,number> = {"1008":85.38,"1003":1.2017,"1005":21.7149,"1004":0.4371,"1079":3.483,"1162":85.36};
  for(const [id, amount] of Object.entries(expected)) assert(Math.abs(estimate.values.find(n => n.id === id)!.perServing! - amount) < 1e-9);
  assert.equal(estimate.values.find(n => n.id === "1235")!.perServing, null);
  assert.equal(estimate.values.find(n => n.id === "1178")!.perServing, 0);
  assert.equal(pilot.nutrientTotals!.find(n => n.nutrientId === "1235")!.amount,null);
  assert(estimate.sources.every(s => s.evidenceStatus === "source-supported" && s.reviewStatus === "reviewed"));
  assert(MEALS.every(m => m.nutrientTotals === null));
});
test("recipe changes invalidate the approved pilot instead of showing stale totals", () => {
  const pilot = RECIPES.find(r => r.id === PILOT_RECIPE_ID)!;
  assert.equal(approvedPilotNutrition({...pilot,servings:3}),null);
  assert.equal(approvedPilotNutrition({...pilot,cookTimeMinutes:5}),null);
  assert.equal(approvedPilotNutrition({...pilot,instructions:["Cook the fruit"]}),null);
  assert.equal(approvedPilotNutrition({...pilot,ingredients:[...pilot.ingredients,{name:"Sugar",quantity:"1 tsp"}]}),null);
  assert.equal(approvedPilotNutrition({...pilot,ingredients:pilot.ingredients.map((i,n) => n===0 ? {...i,quantity:"2 cups"}:i)}),null);
});
test("nutrition calculations propagate missing weights, units and values without losing actual zeros", () => {
  const base = {name:"Test food",fdcId:"test",grams:100,portionId:"test",portionDescription:"test",nutrients:{n:{amount:0,unit:"G",sourceRowId:"row"}}};
  const defs = [{id:"n",name:"Test",unit:"G"}];
  assert.equal(calculateNutrition([base],defs,2)[0].perServing,0);
  assert.equal(calculateNutrition([base,{...base,grams:null}],defs,2)[0].total,null);
  assert.equal(calculateNutrition([{...base,nutrients:{}}],defs,2)[0].total,null);
  assert.equal(calculateNutrition([{...base,nutrients:{n:{amount:1,unit:"MG",sourceRowId:"row"}}}],defs,2)[0].total,null);
  assert.equal(calculateNutrition([base],defs,0)[0].perServing,null);
  assert.equal(calculateNutrition([],defs,2)[0].total,null);
});
test("approved small measurements parse and conditional recipes remain without totals", () => {
  for(const id of ["recipe-warm-oatmeal-berries","recipe-chamomile-comfort-toast"]) {
    const recipe=RECIPES.find(r => r.id===id)!;
    const cinnamon=recipe.structuredIngredients.find(i=>i.name==="Ground cinnamon")!;
    assert.equal(cinnamon.quantity,1/16); assert.equal(cinnamon.unit,"tsp");
    assert.equal(recipe.nutrientTotals,null);
  }
  const toast=RECIPES.find(r=>r.id==="recipe-gentle-avocado-toast")!;
  assert.equal(toast.structuredIngredients.find(i=>i.name==="Crushed chili flakes")!.quantity,1/16);
  assert.equal(toast.structuredIngredients.find(i=>i.name==="Fine table salt")!.quantity,1/16);
  const popcorn=RECIPES.find(r=>r.id==="recipe-loaded-popcorn-mix")!;
  assert.equal(popcorn.structuredIngredients.find(i=>i.name==="Sea salt")!.quantity,.4);
  assert.equal(popcorn.nutrientTotals,null);
});
const DEFS = Object.values(USDA_NUTRIENT_IDS).map(n => ({id:n.id,name:n.id,unit:n.unit}));
const synthetic = (inputs: {name:string; grams:number|null; per100g:Record<string,number|null>}[], servings = 2): RecipeNutritionEstimate => {
  const ingredients = inputs.map(i => ({name:i.name,fdcId:"test",grams:i.grams,portionId:"test",portionDescription:"test",
    nutrients:Object.fromEntries(DEFS.map(d => [d.id,{amount:i.per100g[d.id] ?? null,unit:d.unit,sourceRowId:"row"}]))}));
  return {status:"approved-pilot-estimate",servings,ingredients,values:calculateNutrition(ingredients,DEFS,servings),sources:[]};
};
const meal = (id: string) => MEALS.find(m => m.id === id)!;
const FORBIDDEN = /\b(treat|treats|cure|cures|heal|heals|prevent|prevents|fixes|reduces anxiety|improves? (your )?mood|the fruit)\b/i;
const ALL_GOALS = Object.keys(GOALS) as GoalId[];
test("pilot explanation keeps fiber from its verified estimate without fruit-specific wording", () => {
  const pilot = RECIPES.find(r => r.id === PILOT_RECIPE_ID)!;
  const text = explainPick(meal("rainbow-fruit-skewers"), ["balanced-nutrition"], pilot.nutritionEstimate);
  assert.match(text, /about 3\.5 g of fiber/);
  assert.match(text, /estimated from the reviewed USDA portions/);
  assert(!FORBIDDEN.test(text), text);
  for (const i of pilot.nutritionEstimate!.ingredients) assert(!text.includes(i.name), text);
});
test("estimate explanations cite only displayed goal nutrients with known values across ingredient types", () => {
  const cases: [string, ReturnType<typeof synthetic>][] = [
    ["brown-rice-veggie-bowl", synthetic([{name:"Cooked brown rice",grams:150,per100g:{"1003":2.7,"1079":1.6,"1090":39,"1089":0.5}},{name:"Raw Swiss chard",grams:72,per100g:{"1003":1.8,"1079":1.6,"1090":81,"1089":1.8}}])],
    ["salmon-quinoa-bowl", synthetic([{name:"Cooked salmon",grams:120,per100g:{"1003":22,"1079":0,"1178":3.2,"1089":0.3}},{name:"Cooked quinoa",grams:90,per100g:{"1003":4.4,"1079":2.8,"1178":0,"1089":1.5}}])],
    ["steak-and-greens", synthetic([{name:"Cooked steak",grams:110,per100g:{"1003":27,"1089":2.6,"1178":2.5,"1079":0}},{name:"Raw greens",grams:72,per100g:{"1003":1.8,"1089":1.8,"1178":0,"1079":1.6}}])],
    ["berry-yogurt-parfait", synthetic([{name:"Greek yogurt",grams:245,per100g:{"1003":9,"1087":110,"1079":0,"1162":0}},{name:"Mixed berries",grams:74,per100g:{"1003":0.7,"1087":6,"1079":2.4,"1162":9.7}}])],
  ];
  for (const [id, estimate] of cases) for (const goals of ALL_GOALS.map(g => [g])) {
    const item = meal(id);
    const text = explainPick(item, goals, estimate);
    assert(!FORBIDDEN.test(text), text);
    for (const i of estimate.ingredients) assert(!text.includes(i.name), `${id}: ${text}`);
    const shown = new Set(displayedNutrients(item, goals));
    for (const [nutrient, usda] of Object.entries(USDA_NUTRIENT_IDS)) {
      const label = NUTRIENTS[nutrient].label.replace(/^./, c => c.toLowerCase());
      if (!text.includes(`of ${label}`)) continue;
      assert(shown.has(nutrient) && matchingNutrients(item, goals).includes(nutrient), `${id}/${goals}: ${nutrient} not displayed`);
      assert(estimate.values.find(v => v.id === usda.id)!.perServing! > 0, `${id}: ${nutrient} unknown or zero`);
    }
    if (!/per serving, estimated/.test(text)) assert.equal(text, whyPick(item, goals));
  }
  const bowl = explainPick(meal("brown-rice-veggie-bowl"), ["calm-grounded"], cases[0][1]);
  assert.match(bowl, /This recipe provides about \d.* per serving/, bowl);
});
test("missing, zero and unmapped nutrition falls back to safe goal-based wording", () => {
  const item = meal("brown-rice-veggie-bowl");
  const goals: GoalId[] = ["calm-grounded"];
  const partial = synthetic([{name:"Rice",grams:150,per100g:{"1079":1.6,"1003":2.7}},{name:"Unweighed chard",grams:null,per100g:{"1079":1.6,"1003":1.8}}]);
  assert.equal(explainPick(item, goals, partial), whyPick(item, goals));
  const fiberUnknown = synthetic([{name:"Rice",grams:150,per100g:{"1079":null,"1003":2.7,"1090":39}}]);
  const text = explainPick(item, goals, fiberUnknown);
  assert(!/fiber/.test(text) || text === whyPick(item, goals), text);
  const traces = synthetic([{name:"Rice",grams:1,per100g:{"1079":0.01,"1003":0.01,"1090":0.01}}]);
  assert.equal(explainPick(item, goals, traces), whyPick(item, goals));
  assert.equal(explainPick(item, goals, null), whyPick(item, goals));
  assert.equal(explainPick(item, goals, undefined), whyPick(item, goals));
  assert.equal(explainPick(meal("cooling-cucumber-salad"), ["hydration"], partial), whyPick(meal("cooling-cucumber-salad"), ["hydration"]));
  const empty = {...item, nutrientFacts: []};
  assert.equal(explainPick(empty, goals, partial), "A meal idea to explore. No verified nutrient in it matches your calm & grounded food picks yet.");
  for (const m of MEALS) for (const g of ALL_GOALS) assert(!FORBIDDEN.test(explainPick(m, [g], null)));
});
const labelIn = (text: string, id: string) =>
  new RegExp(`\\b${NUTRIENTS[id].label.replace(/^./, c => c.toLowerCase())}\\b`).test(text);
test("goals with matching nutrients show only goal-matched chips and cite exactly those", () => {
  let checked = 0;
  for (const item of [...FOODS, ...MEALS]) for (const g of ALL_GOALS) {
    const goals = [g];
    const { matched, otherVerified } = nutrientDisplay(item, goals);
    if (!matched.length) continue;
    checked++;
    assert.deepEqual(matched, matchingNutrients(item, goals).slice(0, 3));
    assert.deepEqual(otherVerified, []);
    assert(matched.every(id => GOALS[g].nutrients.includes(id)));
    const text = whyPick(item, goals);
    for (const id of Object.keys(NUTRIENTS)) assert.equal(labelIn(text, id), matched.includes(id), `${item.id}/${g}/${id}: ${text}`);
    assert(text.includes(GOALS[g].label.toLowerCase()));
  }
  assert(checked > 50, `only ${checked} matched combinations`);
});
test("goals without matching nutrients label other verified chips and name the goal", () => {
  let checked = 0;
  for (const item of [...FOODS, ...MEALS]) for (const g of ALL_GOALS) {
    const goals = [g];
    const { matched, otherVerified } = nutrientDisplay(item, goals);
    if (matched.length) continue;
    checked++;
    assert(otherVerified.every(id => verifiedNutrients(item).includes(id) && !GOALS[g].nutrients.includes(id)));
    const text = explainPick(item, goals, null);
    assert.match(text, /^(A meal idea|An ingredient) to explore\. No verified nutrient in it matches your .+ food picks yet\.$/);
    assert(text.includes(GOALS[g].label.toLowerCase()));
    for (const id of Object.keys(NUTRIENTS)) assert(!labelIn(text, id), `${item.id}/${g}: ${text}`);
  }
  assert(checked > 10, `only ${checked} unmatched combinations`);
  const skewers = meal("rainbow-fruit-skewers");
  const estimate = RECIPES.find(r => r.id === PILOT_RECIPE_ID)!.nutritionEstimate;
  assert.deepEqual(nutrientDisplay(skewers, ["hydration"]).matched, []);
  assert(nutrientDisplay(skewers, ["hydration"]).otherVerified.length > 0);
  assert.equal(explainPick(skewers, ["hydration"], estimate), "A meal idea to explore. No verified nutrient in it matches your hydration food picks yet.");
  assert.match(explainPick(skewers, ["balanced-nutrition"], estimate), /about 85 mg of vitamin C and about 3\.5 g of fiber per serving/);
});
test("unverified nutrient facts never appear as chips for any goal", () => {
  const item = meal("salmon-quinoa-bowl");
  const draft = {...item, nutrientFacts: item.nutrientFacts.map(f => ({...f, reviewStatus: "draft" as const}))};
  const unsourced = {...item, nutrientFacts: item.nutrientFacts.map(f => ({...f, sourceProvenance: f.sourceProvenance.map(s => ({...s, evidenceStatus: "unverified" as const}))}))};
  for (const x of [draft, unsourced]) for (const g of ALL_GOALS) {
    assert.deepEqual(nutrientDisplay(x, [g]), {matched: [], otherVerified: []});
    assert.match(whyPick(x, [g]), /^A meal idea to explore/);
  }
  const multi = nutrientDisplay(item, ["hydration", "steady-energy"]);
  assert(multi.matched.length > 0 && multi.otherVerified.length === 0);
});
test("approved honey converts only its approved portions and publishes no new recipe totals", () => {
  const honey = APPROVED_INGREDIENTS.find(i => i.ingredient === "Honey")!;
  assert.equal(honey.fdcId, "169640");
  assert.equal(honey.recipeTotalsPublished, false);
  assert.equal(honey.nutrients["1235"].amount, null);
  assert.equal(honey.nutrients["1008"].amount, 304);
  assert(Object.values(honey.nutrients).every(n => n.amount === null || n.sourceRowId));
  const uses = RECIPES.flatMap(r => r.structuredIngredients.filter(i => i.name === "Honey").map(i => [r.id, approvedIngredientInput(i)?.grams] as const));
  assert.deepEqual(Object.fromEntries(uses), {
    "recipe-warm-oatmeal-berries": 7, "recipe-calming-kefir-smoothie": 7, "recipe-green-tea-oat-bites": 84.75,
    "recipe-immune-boost-smoothie": 7, "recipe-berry-yogurt-parfait": 7,
  });
  const line = RECIPES.flatMap(r => r.structuredIngredients).find(i => i.name === "Honey")!;
  for (const changed of [{...line, quantity: 2}, {...line, unit: "tbsp"}, {...line, quantity: null}, {...line, name: "Raw manuka honey"}, {...line, notes: "warmed"}])
    assert.equal(approvedIngredientInput(changed), null);
  const [contribution] = calculateNutrition([approvedIngredientInput(line)!], [{id:"1235",name:"Sugars, added",unit:"G"},{id:"1008",name:"Energy",unit:"KCAL"}], 1);
  assert.equal(contribution.total, null);
  for (const r of RECIPES.filter(r => r.structuredIngredients.some(i => i.name === "Honey"))) {
    assert.equal(r.nutritionEstimate, null);
    assert.equal(r.nutrientTotals, null);
    const coverage = recipeReviewCoverage(r);
    assert(coverage.approved.includes("Honey") && coverage.unreviewed.length > 0, r.id);
  }
  assert.equal(RECIPES.filter(r => r.nutritionEstimate).length, 1);
});
console.log(`${checks} knowledge-system tests passed`);
