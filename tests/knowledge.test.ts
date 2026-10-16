import { calculateNutrition } from "../src/lib/nutrition";
import { approvedPilotNutrition, PILOT_RECIPE_ID } from "../src/data/usdaPilot";
import { APPROVED_INGREDIENTS, approvedIngredientInput, recipeReviewCoverage } from "../src/data/usdaApprovals";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { ingredientImages, COVERED_INGREDIENT_LABELS, thumbnailPath } from "../src/data/ingredientImages";
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
import { parseIngredient, ingredientLine } from "../src/lib/catalog";
import {
  extractCandidates,
  transition,
  canPublish,
  importDraftRecords,
} from "../src/lib/libraryReview";
import { historyInsights } from "../src/lib/interactions";
import { NUTRIENTS, GOALS, source } from "../src/data/knowledge";
import { readableQuantity, US_VOLUME_IN_TSP } from "../src/lib/units";
import { validateBarcode, mapProduct, isCalculable, lookupProduct, createLookupLimiter, OFF_NUTRIENT_MAP, OFF_APP_ID } from "../src/lib/openFoodFacts";
import { CALCULATOR_FOODS, calculateCustom, parseQuantity, parseServings, findFood, productFood } from "../src/lib/nutritionCalculator";
import { PILOT_INGREDIENTS } from "../src/data/usdaPilot";

let checks = 0;
const test = (name: string, fn: () => void) => {
  fn();
  checks++;
  console.log("PASS", name);
};
const pendingTests: Promise<void>[] = [];
const testAsync = (name: string, fn: () => Promise<void>) => {
  pendingTests.push(fn().then(() => {
    checks++;
    console.log("PASS", name);
  }));
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
test("grocery converts tsp/tbsp/cup of the same ingredient into one row", () => {
  const add = (...quantities: string[]) =>
    aggregateGroceries([], quantities.map((quantity) => ({ name: "Soy sauce", quantity })), "R");
  // 1 tbsp + 1 tsp = 4 tsp: no tidy tbsp or cup amount, so teaspoons.
  assert.deepEqual(add("1 tbsp", "1 tsp").map((i) => i.quantity), ["4 tsp"]);
  assert.deepEqual(add("1 tbsp", "3 tsp").map((i) => i.quantity), ["2 tbsp"]);
  assert.deepEqual(add("0.75 cup", "2 tbsp").map((i) => i.quantity), ["0.875 cup"]);
  assert.deepEqual(add("2 tbsp", "6 tsp").map((i) => i.quantity), ["0.25 cup"]);
  assert.deepEqual(add("1 tsp", "0.5 tsp").map((i) => i.quantity), ["1.5 tsp"]);
  // Same-unit rows keep their unit (no conversion when it isn't needed).
  assert.deepEqual(add("2 tbsp", "2 tbsp").map((i) => i.quantity), ["4 tbsp"]);
  // A same-unit row is preferred over a convertible one.
  const mixed = aggregateGroceries(
    [{ id: "a", name: "Soy sauce", quantity: "1 tbsp", checked: false, createdAt: "" },
     { id: "b", name: "Soy sauce", quantity: "1 tsp", checked: false, createdAt: "" }],
    [{ name: "Soy sauce", quantity: "1 tsp" }]);
  assert.deepEqual(mixed.map((i) => i.quantity), ["1 tbsp", "2 tsp"]);
  // Never converted: different notes, weights or counts, other ingredients, completed rows.
  assert.equal(aggregateGroceries([], [{ name: "Brown rice", quantity: "0.75 cup cooked" }, { name: "Brown rice", quantity: "1 tbsp" }]).length, 2);
  assert.equal(aggregateGroceries([], [{ name: "Honey", quantity: "1 tsp" }, { name: "Honey", quantity: "21 g" }]).length, 2);
  assert.equal(aggregateGroceries([], [{ name: "Honey", quantity: "1 tsp" }, { name: "Soy sauce", quantity: "1 tbsp" }]).length, 2);
  const done = add("1 tbsp").map((i) => ({ ...i, checked: true }));
  assert.equal(aggregateGroceries(done, [{ name: "Soy sauce", quantity: "1 tsp" }]).length, 2);
  // Real recipes: the bowl's 1 tsp and the stir-fry's 1 tbsp soy sauce become 4 tsp.
  const lines = ["recipe-energizing-power-bowl", "recipe-iron-rich-stir-fry"].flatMap((id) =>
    RECIPES.find((r) => r.id === id)!.structuredIngredients.filter((i) => i.name === "Soy sauce").map(ingredientLine));
  assert.deepEqual(aggregateGroceries([], lines).map((i) => i.quantity), ["4 tsp"]);
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
test("batch approvals B1-B14/C1-C2 apply only to their exact approved uses", () => {
  const approvedUses: Record<string, string> = {};
  for (const r of RECIPES)
    for (const i of r.structuredIngredients) {
      const input = approvedIngredientInput(i, r.id);
      if (input && i.name !== "Honey") approvedUses[`${r.id} | ${i.name}`] = `${input.fdcId} ${input.grams}`;
    }
  assert.deepEqual(approvedUses, {
    "recipe-chamomile-comfort-toast | Sweet potato": "168482 130",
    "recipe-chamomile-comfort-toast | Almond butter": "168588 32",
    "recipe-chamomile-comfort-toast | Banana": "173944 59",
    "recipe-chamomile-comfort-toast | Chamomile tea bag": "174156 237",
    "recipe-chamomile-comfort-toast | Ground cinnamon": "171320 0.1625",
    "recipe-calming-kefir-smoothie | Banana": "173944 59",
    "recipe-tropical-energy-smoothie | Banana": "173944 59",
    "recipe-tropical-energy-smoothie | Pineapple": "169124 165",
    "recipe-sunshine-pancakes | Banana": "173944 118",
    "recipe-sunshine-pancakes | Eggs": "171287 100",
    "recipe-green-tea-oat-bites | Almond butter": "168588 125",
    "recipe-green-tea-oat-bites | Rolled oats": "173904 81",
    "recipe-warm-oatmeal-berries | Rolled oats": "173904 40.5",
    "recipe-warm-oatmeal-berries | Ground cinnamon": "171320 0.1625",
    "recipe-cozy-sweet-potato-hash | Sweet potato": "168482 130",
    "recipe-cozy-sweet-potato-hash | Egg": "171287 100",
    "recipe-gentle-avocado-toast | Egg": "173424 50",
    "recipe-gentle-avocado-toast | Whole-wheat bread": "172688 32",
    "recipe-energizing-power-bowl | Brown rice": "169704 151.5",
    "recipe-iron-rich-stir-fry | Brown rice": "169704 151.5",
    "recipe-brown-rice-veggie-bowl | Brown rice": "169704 151.5",
    "recipe-brown-rice-veggie-bowl | Pumpkin seeds": "170556 16.125",
    "recipe-magnesium-boost-bowl | Pumpkin seeds": "170556 16.125",
    "recipe-crunchy-veggie-snack-plate | Pumpkin seeds": "170556 8.0625",
    "recipe-steak-and-greens | Swiss chard": "169991 72",
    "recipe-dark-chocolate-trail-mix | Almonds": "170567 35.75",
    "recipe-loaded-popcorn-mix | Almonds": "170567 17.875",
  });
  // Held uses: power-bowl egg and roasted sweet potato, sauteed chard, chopped
  // almonds, diced pineapple, pancake cinnamon; avocado and Greek yogurt pending.
  const held = (id: string, name: string) => {
    const r = RECIPES.find(x => x.id === id)!;
    return approvedIngredientInput(r.structuredIngredients.find(i => i.name === name)!, id);
  };
  for (const [id, name] of [
    ["recipe-energizing-power-bowl", "Egg"], ["recipe-energizing-power-bowl", "Sweet potato"],
    ["recipe-brown-rice-veggie-bowl", "Swiss chard"], ["recipe-magnesium-boost-bowl", "Swiss chard"],
    ["recipe-turkey-lettuce-wraps", "Almonds"], ["recipe-quinoa-fruit-salad", "Pineapple"],
    ["recipe-sunshine-pancakes", "Cinnamon"], ["recipe-gentle-avocado-toast", "Avocado"],
    ["recipe-salmon-quinoa-bowl", "Avocado"], ["recipe-berry-yogurt-parfait", "Greek yogurt"],
    ["recipe-immune-boost-smoothie", "Greek yogurt"],
  ]) assert.equal(held(id, name), null, `${id} ${name}`);
  // A recipe-scoped conversion never applies without its recipe.
  const toast = RECIPES.find(r => r.id === "recipe-chamomile-comfort-toast")!;
  assert.equal(approvedIngredientInput(toast.structuredIngredients[0]), null);
  assert.equal(approvedIngredientInput({ ...toast.structuredIngredients[0], notes: "" }, toast.id), null);
  // Every source value is sourced or null; added sugars stay unknown; USDA zeros stay zero.
  for (const record of APPROVED_INGREDIENTS) {
    assert.equal(record.nutrients["1235"].amount, null, record.ingredient);
    assert(Object.values(record.nutrients).every(n => n.amount === null || n.sourceRowId), record.ingredient);
  }
  const tea = APPROVED_INGREDIENTS.find(r => r.fdcId === "174156")!;
  assert.equal(tea.nutrients["1079"].amount, 0);
  // Chamomile Toast is fully reviewed but publishes nothing until totals are approved.
  assert.deepEqual(recipeReviewCoverage(toast).unreviewed, []);
  assert.equal(toast.nutritionEstimate, null);
  assert.equal(toast.nutrientTotals, null);
  for (const r of RECIPES.filter(r => r.id !== "recipe-chamomile-comfort-toast" && r.id !== PILOT_RECIPE_ID))
    assert(recipeReviewCoverage(r).unreviewed.length > 0, r.id);
  assert.equal(RECIPES.filter(r => r.nutritionEstimate).length, 1);
});
test("ingredient artwork coverage matches recipe labels and existing files", () => {
  const labels = new Set([...RECIPES, ...MEALS].flatMap((r) => r.structuredIngredients.map((i) => i.name)));
  assert.deepEqual([...COVERED_INGREDIENT_LABELS].sort(), [...labels].sort());
  const coverage: { ingredient: string; images: string[] }[] = JSON.parse(readFileSync("docs/ingredient-artwork-coverage.json", "utf8"));
  for (const entry of coverage) {
    assert(entry.images.length > 0, entry.ingredient);
    for (const image of entry.images) {
      assert(existsSync("public" + image), image);
      assert(existsSync("public" + thumbnailPath(image)), thumbnailPath(image));
    }
  }
  const manifest: { id: string; asset: string }[] = JSON.parse(readFileSync("docs/ingredient-artwork-manifest.json", "utf8"));
  const pngs = readdirSync("public/assets/ingredients").filter((f) => f.endsWith(".png")).sort();
  assert.equal(pngs.length, 35);
  assert.deepEqual(manifest.map((m) => m.asset).sort(), pngs.map((f) => `/assets/ingredients/${f}`));
  assert(manifest.every((m) => m.asset === `/assets/ingredients/${m.id}.png`));
  const used = new Set(coverage.flatMap((e) => e.images));
  for (const f of pngs) {
    assert(used.has(`/assets/ingredients/${f}`), `unused artwork ${f}`);
    const thumb = `public/assets/ingredients/thumbs/${f.replace(/\.png$/, ".webp")}`;
    assert(statSync(thumb).size < 20_000, thumb);
  }
});
test("ingredient image resolver never borrows artwork from another food", () => {
  const srcs = (name: string) => ingredientImages(name).map((i) => i.src);
  assert.deepEqual(srcs("Oat flour"), ["/assets/ingredients/thumbs/oat-flour.webp"]);
  assert.deepEqual(srcs("Rolled oats"), ["/assets/ingredients/thumbs/rolled-oats.webp"]);
  assert.deepEqual(srcs("Dark chocolate chips"), ["/assets/ingredients/thumbs/dark-chocolate-chips.webp"]);
  assert.deepEqual(srcs("lemon juice"), ["/assets/ingredients/thumbs/lemon-juice.webp"]);
  assert.deepEqual(srcs("Salt & pepper"), ["/assets/ingredients/thumbs/table-salt.webp", "/assets/ingredients/thumbs/black-pepper.webp"]);
  assert.deepEqual(srcs("Wild Salmon"), ["/assets/foods/thumbs/wild-salmon.webp"]);
  assert.deepEqual(srcs("Saffron threads"), []);
  assert.deepEqual(srcs("Oats"), []);
  for (const label of COVERED_INGREDIENT_LABELS)
    for (const image of ingredientImages(label)) {
      assert.match(image.alt, /^Illustration of [a-z]/);
      assert(!image.src.endsWith(".png"), image.src);
    }
  // A food named exactly like a recipe label uses the label's coverage entry
  // (Chia Seeds -> chia-seeds.png); every other food uses its own artwork.
  const covered = new Set(COVERED_INGREDIENT_LABELS.map((l) => l.toLowerCase()));
  for (const food of FOODS)
    if (!covered.has(food.name.toLowerCase()))
      assert.equal(ingredientImages(food.name)[0]?.original, food.image, food.name);
});
test("nutrition calculator offers only approved records, states and conversions", () => {
  const approvedIds = new Set([...APPROVED_INGREDIENTS.map((r) => r.fdcId), ...PILOT_INGREDIENTS.map((i) => i.fdcId)]);
  assert.deepEqual(new Set(CALCULATOR_FOODS.map((f) => f.fdcId)), approvedIds);
  // 16 approval records share 15 FDC IDs ("Egg" B4 raw and "Eggs" B5 are both 171287);
  // the pilot adds strawberries and blueberries (its pineapple 169124 is already approved).
  assert.equal(APPROVED_INGREDIENTS.length, 16);
  assert.equal(new Set(APPROVED_INGREDIENTS.map((r) => r.fdcId)).size, 15);
  assert.deepEqual(PILOT_INGREDIENTS.map((i) => i.fdcId).filter((id) => !APPROVED_INGREDIENTS.some((r) => r.fdcId === id)), ["167762", "171711"]);
  assert.equal(CALCULATOR_FOODS.length, 17);
  // Pending or unapproved candidates are not selectable (Greek yogurt, avocado, alternates).
  for (const id of ["2705422", "2705423", "2705424", "171705", "171706", "168483", "168875", "170401", "2346396"])
    assert.equal(findFood(id), undefined, id);
  for (const f of CALCULATOR_FOODS) {
    assert(f.state.length >= 3, f.name);
    assert(ingredientImages(f.imageLabel).length > 0, f.imageLabel);
    assert.equal(f.measures[0].id, "g");
    for (const m of f.measures.slice(1)) {
      // Every household measure is an approved conversion per unit, or the pilot's approved USDA portion.
      const fromApproval = APPROVED_INGREDIENTS.filter((r) => r.fdcId === f.fdcId).flatMap((r) => r.conversions)
        .some((c) => c.basePortionId === m.portionId && Math.abs(c.grams / c.quantity - m.gramsPerUnit) < 1e-9);
      const fromPilot = PILOT_INGREDIENTS.some((i) => i.fdcId === f.fdcId && i.portionId === m.portionId);
      assert(fromApproval || fromPilot, `${f.name}: ${m.label}`);
    }
  }
  const labels = (id: string) => findFood(id)!.measures.map((m) => `${m.label}=${m.gramsPerUnit}`);
  assert.deepEqual(labels("169640"), ["grams=1", "tsp=7", "cup=339"]); // no unapproved tbsp
  assert.deepEqual(labels("173944"), ["grams=1", "medium banana (7–7⅞ in)=118"]);
  assert.deepEqual(labels("169704"), ["grams=1", "cup, cooked=202"]);
  assert.deepEqual(labels("170567"), ["grams=1", "cup, whole=143", "tbsp, whole=8.9375"]);
  assert.deepEqual(labels("174156"), ["grams=1", "cup brewed (1 bag in 8 fl oz water)=237"]);
  assert.deepEqual(labels("171711"), ["grams=1", "cup=148"]);
  assert.equal(findFood("168482")!.state, "Raw, peeled flesh");
  assert.equal(findFood("173424")!.state, "Cooked (hard-boiled), without shell");
  assert.equal(findFood("169704")!.state, "Cooked");
});
test("nutrition calculator: known weights, serving division and conversions", () => {
  const row = (key: string, fdcId: string, measureId: string, quantity: string) => ({ key, fdcId, measureId, quantity });
  const near = (a: number | null, b: number) => assert(a !== null && Math.abs(a - b) < 1e-9, `${a} vs ${b}`);
  // One medium banana (118 g): USDA per-100 g values x 1.18.
  let r = calculateCustom([row("a", "173944", "each-93515", "1")], "1").result!;
  assert.equal(r.rows[0].grams, 118);
  const by = (id: string) => r.nutrients.find((n) => n.id === id)!;
  near(by("1008").total, 105.02); near(by("1003").total, 1.2862); near(by("1005").total, 26.9512);
  near(by("1004").total, 0.3894); near(by("1079").total, 3.068); near(by("2000").total, 14.4314);
  assert.deepEqual(r.nutrients.map((n) => n.label), ["Calories", "Protein", "Carbohydrates", "Fat", "Fiber", "Total sugars"]);
  // Grams and household units give the same result; servings divide the total.
  r = calculateCustom([row("a", "173944", "g", "118"), row("b", "168588", "tbsp-83375", "2")], "2").result!;
  near(r.nutrients[0].total, 105.02 + 196.48);
  near(r.nutrients[0].perServing, (105.02 + 196.48) / 2);
  assert.equal(r.totalGrams, 150);
  // Approved conversions per unit, including fractions and derived cup/tbsp weights.
  const grams = (fdcId: string, measureId: string, q: string) => calculateCustom([row("x", fdcId, measureId, q)], "1").result!.rows[0].grams;
  assert.equal(grams("169704", "cup-85378", "3/4"), 151.5);
  assert.equal(grams("170556", "tbsp-86847", "2"), 16.125);
  assert.equal(grams("169640", "cup-85264", "1/4"), 84.75);
  assert.equal(grams("173904", "cup-93454", "1 1/2"), 121.5);
  assert.equal(grams("171320", "tsp-88429", "1/16"), 0.1625);
  assert.equal(grams("167762", "portion-81922", "1"), 144);
  assert.equal(grams("171711", "portion-89238", ".5"), 74);
  // Rainbow Fruit Skewers inputs reproduce the approved pilot energy.
  const skewers = calculateCustom([row("s", "167762", "portion-81922", "1"), row("p", "169124", "cup-84287", "1"), row("b", "171711", "portion-89238", "0.5")], "2").result!;
  const pilotEnergy = RECIPES.find((x) => x.id === PILOT_RECIPE_ID)!.nutritionEstimate!.values.find((v) => v.id === "1008")!;
  near(skewers.nutrients[0].total, pilotEnergy.total!);
  near(skewers.nutrients[0].perServing, pilotEnergy.perServing!);
});
test("nutrition calculator keeps missing nutrients unknown and rejects invalid input", () => {
  const banana = findFood("173944")!;
  const saved = banana.nutrients;
  banana.nutrients = { ...saved, "1079": { amount: null, unit: "G", sourceRowId: null } };
  try {
    const r = calculateCustom([
      { key: "a", fdcId: "173944", measureId: "g", quantity: "100" },
      { key: "b", fdcId: "168588", measureId: "g", quantity: "100" },
    ], "2").result!;
    const fiber = r.nutrients.find((n) => n.id === "1079")!;
    assert.equal(fiber.total, null);
    assert.equal(fiber.perServing, null);
    assert.deepEqual(fiber.missing, ["Banana"]);
    assert.equal(r.nutrients.find((n) => n.id === "1008")!.total, 89 + 614);
  } finally {
    banana.nutrients = saved;
  }
  const bad = (q: string) => { const p = parseQuantity(q); return "error" in p ? p.error : p.value; };
  assert.equal(bad(""), "Enter an amount.");
  assert.equal(bad("0"), "Amount must be greater than 0.");
  assert.equal(bad("-1"), "Amount must be greater than 0.");
  assert.equal(bad("0/3"), "Amount must be greater than 0.");
  for (const q of ["abc", "1,5", "1/0", "2 cups", "1e3", "NaN", "Infinity", "1.2.3"])
    assert.equal(typeof bad(q), "string", q);
  assert.equal(bad("10001"), "Amount must be 10,000 or less.");
  assert.equal(bad("1/2"), 0.5); assert.equal(bad("1 1/2"), 1.5); assert.equal(bad(".5"), 0.5); assert.equal(bad(" 2 "), 2);
  for (const sv of ["", "0", "-2", "1.5", "abc", "101"]) assert("error" in parseServings(sv), sv);
  assert.deepEqual(parseServings("4"), { value: 4 });
  // Any invalid row, an empty list, a bad serving count, or an unapproved unit/food gives no result.
  const ok = { key: "a", fdcId: "173944", measureId: "g", quantity: "50" };
  assert.equal(calculateCustom([], "1").result, undefined);
  assert.equal(calculateCustom([ok, { ...ok, key: "b", quantity: "-3" }], "1").result, undefined);
  assert.equal(calculateCustom([ok, { ...ok, key: "b", quantity: "-3" }], "1").rowErrors.b, "Amount must be greater than 0.");
  assert.equal(calculateCustom([ok], "0").result, undefined);
  assert.equal(calculateCustom([{ ...ok, measureId: "tbsp-83375" }], "1").rowErrors.a, "Choose an approved ingredient and unit.");
  assert.equal(calculateCustom([{ ...ok, fdcId: "999999" }], "1").rowErrors.a, "Choose an approved ingredient and unit.");
});
test("nutrition calculator never changes catalog nutrition or approvals", () => {
  const snapshot = () => JSON.stringify({ a: APPROVED_INGREDIENTS, e: RECIPES.map((r) => [r.id, r.nutritionEstimate, r.nutrientTotals]) });
  const before = snapshot();
  const toast = RECIPES.find((r) => r.id === "recipe-chamomile-comfort-toast")!;
  const rows = toast.structuredIngredients.map((i, n) => {
    const input = approvedIngredientInput(i, toast.id)!;
    return { key: String(n), fdcId: input.fdcId, measureId: "g", quantity: String(input.grams) };
  });
  assert(calculateCustom(rows, "1").result);
  assert.equal(snapshot(), before);
  assert.equal(toast.nutritionEstimate, null);
  assert.equal(RECIPES.filter((r) => r.nutritionEstimate).length, 1);
});
test("grocery fractions display readably while stored precision is unchanged", () => {
  const show = (q: string) => readableQuantity(q).text;
  assert.equal(show("0.875 cup"), "⅞ cup");
  assert.equal(show("1.5 cup cooked"), "1½ cup cooked");
  assert.equal(show("0.25 sliced"), "¼ sliced");
  assert.equal(show("0.3333 cup"), "⅓ cup");
  assert.equal(show("2.6667 tbsp"), "2⅔ tbsp");
  assert.equal(show("0.0625 tsp"), "1/16 tsp");
  assert.equal(show("1.0625 tsp"), "1 1/16 tsp");
  assert.equal(show("0.75 cup"), "¾ cup");
  // Not common fractions, whole numbers and non-numeric text stay as stored.
  for (const q of ["0.4 g weighed", "151.5 g", "4 tsp", "2 cup", "to taste", "1 carton", ""])
    assert.equal(show(q), q === "151.5 g" ? "151½ g" : q, q);
  assert.equal(readableQuantity("1.5 cup").spoken, "1 and 1/2 cup");
  assert.equal(readableQuantity("0.875 cup").spoken, "7/8 cup");
  // Aggregation stores full precision; only the display changes.
  const merged = aggregateGroceries([], [{ name: "Oats", quantity: "0.75 cup" }, { name: "Oats", quantity: "2 tbsp" }]);
  assert.equal(merged[0].quantity, "0.875 cup");
  assert.equal(readableQuantity(merged[0].quantity).text, "⅞ cup");
});
test("one US customary volume standard is used for grocery and USDA-derived conversions", () => {
  assert.deepEqual(US_VOLUME_IN_TSP, { tsp: 1, tbsp: 3, cup: 48 });
  // Approved conversions derived across units (tsp from tbsp, tbsp from cup) follow the same ratios.
  let crossUnit = 0;
  for (const record of APPROVED_INGREDIENTS) {
    for (const c of record.conversions) {
      const base = record.portions.find((p) => p.id === c.basePortionId)!;
      const baseUnit = base.modifier.split(",")[0].trim();
      if (!(baseUnit in US_VOLUME_IN_TSP) || !(c.unit in US_VOLUME_IN_TSP) || baseUnit === c.unit) continue;
      crossUnit++;
      const expected = Number(base.gram_weight) / Number(base.amount) * US_VOLUME_IN_TSP[c.unit] / US_VOLUME_IN_TSP[baseUnit];
      assert(Math.abs(c.grams / c.quantity - expected) < 1e-9, `${record.ingredient} ${c.quantity} ${c.unit}`);
    }
  }
  assert.equal(crossUnit, 4); // honey tsp from tbsp; pumpkin seeds (1 and 2 tbsp) and almonds tbsp from cup
  // Ingredient identity and notes still gate merging; units only convert within volume.
  assert.equal(aggregateGroceries([], [{ name: "Brown rice", quantity: "0.5 cup cooked" }, { name: "Brown rice", quantity: "0.5 cup" }]).length, 2);
  assert.equal(aggregateGroceries([], [{ name: "Honey", quantity: "1 tbsp" }, { name: "Honey", quantity: "21 g" }]).length, 2);
});
test("single-entry and identical-intensity observations read naturally", () => {
  const now = new Date("2026-10-15T15:00:00Z");
  const entry = (id: string, intensity: number) => ({ id, date: now.toISOString(), emotionId: "tired" as const, intensity });
  const lines = (entries: ReturnType<typeof entry>[]) => historyInsights(entries, [], now);
  assert(lines([entry("a", 6)]).includes("Your tired mood intensity was 6/10."));
  assert(!lines([entry("a", 6)]).some((t) => /ranged/.test(t)));
  assert(lines([entry("a", 6), entry("b", 6)]).includes("Your tired check-ins were all 6/10 intensity."));
  assert(lines([entry("a", 3), entry("b", 7)]).includes("Your tired check-ins ranged from 3 to 7/10 intensity."));
});
// ---- Open Food Facts (mocked; no network) ----
const offSolid = (extra: Record<string, unknown> = {}, nutriments: Record<string, unknown> = {}) => ({
  code: "0012345678905", product_name: "Test Granola", brands: "Example Co", quantity: "400 g",
  product_quantity: 400, product_quantity_unit: "g", nutrition_data_per: "100g",
  nutriments: { "energy-kcal_100g": 400, "energy-kj_100g": 1674, proteins_100g: 10, carbohydrates_100g: 60, fat_100g: 12, fiber_100g: 0, ...nutriments },
  allergens_tags: ["en:milk", "en:soybeans"], traces_tags: ["en:nuts"], ingredients_text: "Oats, sugar, <b>milk</b> powder",
  ...extra,
});
const at = new Date("2026-10-15T12:00:00Z");
test("barcodes: supported formats, check digits and leading zeros", () => {
  assert.deepEqual(validateBarcode("0012345678905"), { code: "0012345678905" });
  assert.deepEqual(validateBarcode("012345678905"), { code: "012345678905" });
  assert.deepEqual(validateBarcode(" 0 12345-678905 "), { code: "012345678905" });
  assert.deepEqual(validateBarcode("96385074"), { code: "96385074" });
  assert.deepEqual(validateBarcode("00012345678905"), { code: "00012345678905" });
  for (const [input, start] of [["", "Enter"], ["12AB", "Use digits"], ["12345", "Barcodes have"], ["0012345678904", "This barcode's check digit"]] as const) {
    const r = validateBarcode(input);
    assert("error" in r && r.error.startsWith(start), input);
  }
});
test("Open Food Facts mapping: explicit units, zero vs missing, kJ conversion, modifiers", () => {
  let p = mapProduct(offSolid(), "0012345678905", at);
  assert.equal(p.basis, "per100g");
  assert.equal(p.code, "0012345678905");
  assert.deepEqual(OFF_NUTRIENT_MAP.map((m) => [m.id, m.offKey, m.unit]), [
    ["1008", "energy-kcal", "KCAL"], ["1003", "proteins", "G"], ["1005", "carbohydrates", "G"],
    ["1004", "fat", "G"], ["1079", "fiber", "G"], ["2000", "sugars", "G"]]);
  assert.equal(p.nutrients["1008"].amount, 400);
  assert.equal(p.nutrients["1079"].amount, 0); // recorded zero stays zero
  assert.equal(p.nutrients["2000"].amount, null); // missing stays null
  assert.equal(p.nutrients["2000"].note, "Not recorded by Open Food Facts.");
  p = mapProduct(offSolid({}, { "energy-kcal_100g": undefined }), "0012345678905", at);
  assert(Math.abs(p.nutrients["1008"].amount! - 1674 / 4.184) < 1e-9);
  assert.match(p.nutrients["1008"].note!, /Converted from 1674 kJ/);
  p = mapProduct(offSolid({}, { "energy-kcal_100g": undefined, "energy-kj_100g": undefined, energy_100g: 418.4 }), "0012345678905", at);
  assert(Math.abs(p.nutrients["1008"].amount! - 100) < 1e-9);
  p = mapProduct(offSolid({}, { "energy-kcal_100g": undefined, "energy-kj_100g": undefined }), "0012345678905", at);
  assert.equal(p.nutrients["1008"].amount, null);
  p = mapProduct(offSolid({}, { fat_100g: 0.5, fat_modifier: "<", proteins_100g: "12.5", sugars_100g: "lots" }), "0012345678905", at);
  assert.equal(p.nutrients["1004"].amount, null);
  assert.match(p.nutrients["1004"].note!, /< 0.5/);
  assert.equal(p.nutrients["1003"].amount, 12.5);
  assert.equal(p.nutrients["2000"].amount, null);
  // Estimated values are never read.
  p = mapProduct({ ...offSolid({}, { proteins_100g: undefined }), nutriments_estimated: { proteins_100g: 9 } }, "0012345678905", at);
  assert.equal(p.nutrients["1003"].amount, null);
  // Allergen and ingredient text: cleaned tags; "none" and missing are distinct; text kept as plain data.
  p = mapProduct(offSolid(), "0012345678905", at);
  assert.deepEqual(p.allergens, ["milk", "soybeans"]);
  assert.deepEqual(p.traces, ["nuts"]);
  assert.equal(p.ingredientsText, "Oats, sugar, <b>milk</b> powder");
  assert.equal(mapProduct(offSolid({ allergens_tags: ["en:none"] }), "0012345678905", at).allergens, "none");
  assert.equal(mapProduct(offSolid({ allergens_tags: undefined, traces_tags: [] }), "0012345678905", at).allergens, null);
  assert.equal(mapProduct(offSolid({ code: "javascript:1" }), "0012345678905", at).url, "https://world.openfoodfacts.org/product/0012345678905");
});
test("Open Food Facts nutrition basis: per 100 ml, unclear and missing bases are not calculable", () => {
  const liquid = mapProduct(offSolid({ quantity: "1.5 L", product_quantity: 1500, product_quantity_unit: "ml", serving_quantity: 250, serving_quantity_unit: "ml", serving_size: "250 ml" }), "0012345678905", at);
  assert.equal(liquid.basis, "per100ml");
  assert.equal(isCalculable(liquid), false);
  assert.equal(productFood(liquid), null);
  assert.match(liquid.calculation, /per 100 ml.*density/);
  const v35 = mapProduct(offSolid({ nutrition_data_per: "100ml" }), "0012345678905", at);
  assert.equal(v35.basis, "per100ml");
  const unclear = mapProduct(offSolid({ quantity: undefined, product_quantity_unit: undefined }), "0012345678905", at);
  assert.equal(unclear.basis, "unclear");
  assert.equal(productFood(unclear), null);
  const none = mapProduct(offSolid({ no_nutrition_data: "on" }), "0012345678905", at);
  assert.equal(none.basis, "none");
  assert.equal(productFood(none), null);
  // Serving offered only with an explicit gram weight; never from ml.
  assert.equal(mapProduct(offSolid({ serving_quantity: 30, serving_quantity_unit: "g", serving_size: "30 g" }), "x", at).servingGrams, 30);
  assert.equal(mapProduct(offSolid({ serving_quantity: 30, serving_size: "1 bowl (30 g)" }), "x", at).servingGrams, 30);
  assert.equal(mapProduct(offSolid({ serving_quantity: 30, serving_size: "1 bowl" }), "x", at).servingGrams, null);
  assert.equal(mapProduct(offSolid({ serving_quantity: 30, serving_size: "30 ml" }), "x", at).servingGrams, null);
  const perServingNoGrams = mapProduct(offSolid({ nutrition_data_per: "serving", serving_size: "1 bar" }), "0012345678905", at);
  assert.equal(perServingNoGrams.basis, "perServing");
  assert.equal(productFood(perServingNoGrams), null);
});
test("Open Food Facts products join calculations without changing USDA foods; mixed totals and servings", () => {
  const solid = productFood(mapProduct(offSolid({ serving_quantity: 30, serving_quantity_unit: "g", serving_size: "30 g" }), "0012345678905", at))!;
  assert.equal(solid.source, "openfoodfacts");
  assert.equal(solid.fdcId, "off:0012345678905");
  assert.deepEqual(solid.measures.map((m) => [m.id, m.gramsPerUnit]), [["g", 1], ["off-serving", 30]]);
  const rows = [
    { key: "u", fdcId: "173944", measureId: "each-93515", quantity: "1" },
    { key: "o", fdcId: solid.fdcId, measureId: "g", quantity: "50" },
  ];
  // Without the confirmed product in the extra foods, the row is rejected.
  assert.equal(calculateCustom(rows, "2").result, undefined);
  const r = calculateCustom(rows, "2", [solid]).result!;
  assert.deepEqual(r.sources, ["usda", "openfoodfacts"]);
  const by = (id: string) => r.nutrients.find((n) => n.id === id)!;
  assert(Math.abs(by("1008").total! - (105.02 + 200)) < 1e-9);
  assert(Math.abs(by("1008").perServing! - (105.02 + 200) / 2) < 1e-9);
  assert.equal(by("1079").total, 3.068); // product fiber is a recorded 0
  assert.equal(by("2000").total, null); // product sugars missing → incomplete
  assert.deepEqual(by("2000").missing, ["Test Granola"]);
  // Product servings: 2 × 30 g at 400 kcal/100 g.
  const servingRun = calculateCustom([{ key: "s", fdcId: solid.fdcId, measureId: "off-serving", quantity: "2" }], "1", [solid]).result!;
  assert.deepEqual(servingRun.sources, ["openfoodfacts"]);
  assert.equal(servingRun.rows[0].grams, 60);
  assert(Math.abs(servingRun.nutrients[0].total! - 240) < 1e-9);
  // Per-serving label values: 2 servings of 150 kcal per 40 g serving = 300 kcal; grams not offered.
  const perServing = productFood(mapProduct(offSolid({ nutrition_data_per: "serving", serving_quantity: 40, serving_quantity_unit: "g", serving_size: "40 g" },
    { "energy-kcal_serving": 150, proteins_serving: 5, carbohydrates_serving: 20, fat_serving: 6, fiber_serving: 2, sugars_serving: 0 }), "96385074", at))!;
  assert.deepEqual(perServing.measures.map((m) => m.id), ["off-serving"]);
  const ps = calculateCustom([{ key: "p", fdcId: perServing.fdcId, measureId: "off-serving", quantity: "2" }], "1", [perServing]).result!;
  assert(Math.abs(ps.nutrients[0].total! - 300) < 1e-9);
  assert.equal(ps.nutrients.find((n) => n.id === "2000")!.total, 0);
  assert.equal(calculateCustom([{ key: "p", fdcId: perServing.fdcId, measureId: "g", quantity: "40" }], "1", [perServing]).rowErrors.p, "Choose an approved ingredient and unit.");
  // The USDA list and catalog are untouched.
  assert.equal(CALCULATOR_FOODS.length, 17);
  assert(CALCULATOR_FOODS.every((f) => f.source === "usda"));
  assert.equal(findFood(solid.fdcId), undefined);
  assert.equal(RECIPES.filter((x) => x.nutritionEstimate).length, 1);
});
test("Open Food Facts lookup limiter stays under the published rate limit", () => {
  const limiter = createLookupLimiter({ maxPerMinute: 10, minIntervalMs: 3000 });
  assert.deepEqual(limiter.check(0), { ok: true });
  limiter.record(0);
  assert.deepEqual(limiter.check(1000), { ok: false, waitSeconds: 2 });
  for (let i = 1; i < 10; i++) limiter.record(i * 3000);
  assert.deepEqual(limiter.check(30000), { ok: false, waitSeconds: 30 });
  assert.deepEqual(limiter.check(60001), { ok: true });
  limiter.block(60001, 45);
  assert.deepEqual(limiter.check(61001), { ok: false, waitSeconds: 44 });
});
testAsync("Open Food Facts lookup: one read-only request and every failure state (mocked)", async () => {
  const calls: { url: string; headers: Record<string, string> }[] = [];
  const respond = (status: number, body: unknown, headers: Record<string, string> = {}) =>
    async (url: string, init: { headers: Record<string, string>; signal: AbortSignal }) => {
      calls.push({ url, headers: init.headers });
      return { status, ok: status >= 200 && status < 300, headers: { get: (n: string) => headers[n] ?? null },
        json: async () => { if (body === "bad-json") throw new SyntaxError("bad"); return body; } };
    };
  let r = await lookupProduct("0012345678905", { fetchImpl: respond(200, { status: "success", result: { id: "product_found" }, product: offSolid() }), now: () => at });
  assert.equal(r.status, "found");
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /^https:\/\/world\.openfoodfacts\.org\/api\/v3\/product\/0012345678905\?fields=/);
  assert.equal(calls[0].headers["X-User-Agent"], OFF_APP_ID);
  assert.equal(r.status === "found" && r.product.retrievedAt, at.toISOString());
  r = await lookupProduct("0012345678905", { fetchImpl: respond(404, { status: "failure", result: { id: "product_not_found" } }) });
  assert.deepEqual(r, { status: "not-found", code: "0012345678905" });
  r = await lookupProduct("0012345678905", { fetchImpl: respond(200, { status: "failure", result: { id: "product_not_found" } }) });
  assert.equal(r.status, "not-found");
  r = await lookupProduct("0012345678905", { fetchImpl: respond(429, null, { "Retry-After": "30" }) });
  assert.deepEqual(r, { status: "rate-limited", retryAfterSeconds: 30 });
  r = await lookupProduct("0012345678905", { fetchImpl: respond(503, null) });
  assert.deepEqual(r, { status: "rate-limited", retryAfterSeconds: 60 });
  r = await lookupProduct("0012345678905", { fetchImpl: respond(500, {}) });
  assert.deepEqual(r, { status: "error", message: "Open Food Facts returned HTTP 500." });
  r = await lookupProduct("0012345678905", { fetchImpl: respond(200, "bad-json") });
  assert.equal(r.status, "error");
  r = await lookupProduct("0012345678905", { fetchImpl: async () => { throw new TypeError("Failed to fetch"); } });
  assert.deepEqual(r, { status: "network-error" });
  const hang = (_url: string, init: { signal: AbortSignal }) => new Promise<never>((_, reject) => {
    init.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })));
  });
  r = await lookupProduct("0012345678905", { fetchImpl: hang as never, timeoutMs: 20 });
  assert.deepEqual(r, { status: "timeout" });
});
Promise.all(pendingTests).then(
  () => console.log(`${checks} knowledge-system tests passed`),
  (e) => { console.error(e); process.exit(1); },
);
