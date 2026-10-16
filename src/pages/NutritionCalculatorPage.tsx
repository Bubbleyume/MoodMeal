import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import Button from "../components/Button";
import IngredientThumb from "../components/IngredientThumb";
import { Plus, Trash2 } from "../components/icons";
import {
  CALCULATOR_FOODS, SNAPSHOT, calculateCustom, findFood, searchFoods,
  type CalculatorRow, type CalculatedNutrient,
} from "../lib/nutritionCalculator";

function amount(n: CalculatedNutrient, value: number | null) {
  if (value === null) return "Unknown";
  return `${value.toFixed(n.digits)} ${n.unit === "KCAL" ? "kcal" : n.unit.toLowerCase()}`;
}

const formatGrams = (g: number) => `${Number(g.toFixed(2))} g`;

let rowCounter = 0;

/**
 * Custom nutrition estimate from approved USDA ingredients. Inputs live only
 * in this screen's state: nothing is saved, reviewed or attached to a recipe.
 */
export default function NutritionCalculatorPage() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<CalculatorRow[]>([]);
  const [servings, setServings] = useState("1");
  const [focusKey, setFocusKey] = useState<string | null>(null);

  const matches = useMemo(() => (query.trim() ? searchFoods(query) : []), [query]);
  const calc = useMemo(() => calculateCustom(rows, servings), [rows, servings]);

  useEffect(() => {
    if (!focusKey) return;
    document.getElementById(`qty-${focusKey}`)?.focus();
    setFocusKey(null);
  }, [focusKey]);

  const addFood = (fdcId: string) => {
    const food = findFood(fdcId)!;
    const key = `r${++rowCounter}`;
    const household = food.measures.find((m) => m.id !== "g") ?? food.measures[0];
    setRows((r) => [...r, { key, fdcId, measureId: household.id, quantity: "" }]);
    setQuery("");
    setFocusKey(key);
  };
  const update = (key: string, patch: Partial<CalculatorRow>) =>
    setRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  const remove = (key: string) => setRows((r) => r.filter((row) => row.key !== key));

  const result = calc.result;
  const hasErrors = Object.keys(calc.rowErrors).length > 0 || !!calc.servingsError;

  return (
    <div className="mm-soft-bg flex h-full flex-1 flex-col">
      <Header title="Nutrition Calculator" subtitle="USDA-based estimates for your own recipe" />
      <div className="screen-scroll space-y-4 px-4 pt-4">
        <section className="card text-sm text-slate-600">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Calculated estimate · USDA FoodData Central</p>
          <p className="mt-2">
            Combine ingredients that MoodMeal has reviewed against USDA records. Results are calculated for your own
            combination only. They are not saved, reviewed or added to MoodMeal recipes.
          </p>
        </section>

        <section className="card" aria-labelledby="calc-search-heading">
          <h2 id="calc-search-heading" className="section-title">Add ingredients</h2>
          <label htmlFor="calc-search" className="mt-3 block text-sm font-semibold text-slate-700">
            Search approved ingredients
          </label>
          <input
            id="calc-search"
            className="well-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try banana, rice or oats"
            aria-describedby="calc-search-help"
            autoComplete="off"
          />
          <p id="calc-search-help" className="mt-1 text-xs text-slate-500">
            {CALCULATOR_FOODS.length} approved ingredients. Only ingredients reviewed against USDA data are available.
          </p>
          {query.trim() && (
            <ul className="mt-3 space-y-2" aria-label="Matching ingredients">
              {matches.map((f) => (
                <li key={f.fdcId}>
                  <button
                    type="button"
                    onClick={() => addFood(f.fdcId)}
                    aria-label={`Add ${f.name} (${f.state})`}
                    className="flex min-h-[44px] w-full items-center gap-3 rounded-2xl bg-brand-50 px-3 py-2 text-left hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                  >
                    <IngredientThumb name={f.imageLabel} className="h-9 w-9" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-800">{f.name}</span>
                      <span className="block text-xs text-slate-600">{f.state} · FDC {f.fdcId}</span>
                    </span>
                    <Plus size={18} className="shrink-0 text-brand-700" aria-hidden="true" />
                  </button>
                </li>
              ))}
              {!matches.length && (
                <li className="text-sm text-slate-600">
                  No approved ingredient matches “{query.trim()}”. Unreviewed foods can’t be calculated yet.
                </li>
              )}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="calc-rows-heading">
          <h2 id="calc-rows-heading" className="section-title">Your ingredients</h2>
          {!rows.length && <p className="mt-2 text-sm text-slate-600">No ingredients yet. Search above to add one.</p>}
          <ul className="mt-2 divide-y divide-slate-100">
            {rows.map((row) => {
              const food = findFood(row.fdcId)!;
              const measure = food.measures.find((m) => m.id === row.measureId);
              const error = calc.rowErrors[row.key];
              const showError = error && row.quantity.trim() !== "";
              const calcRow = result?.rows.find((r) => r.key === row.key);
              return (
                <li key={row.key} className="py-3" data-testid="calc-row">
                  <div className="flex items-start gap-3">
                    <IngredientThumb name={food.imageLabel} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">{food.name}</p>
                      <p className="text-xs text-slate-600">
                        <span className="mr-1 inline-block rounded-full bg-moodGreen-50 px-2 py-0.5 font-semibold text-moodGreen-700">{food.state}</span>
                        FDC {food.fdcId}
                      </p>
                      {food.stateNote && <p className="mt-1 text-xs text-slate-500">{food.stateNote}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(row.key)}
                      aria-label={`Remove ${food.name}`}
                      className="-mr-1.5 -mt-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-coral-50 hover:text-coral-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input
                      id={`qty-${row.key}`}
                      className="well-input mt-0 w-24"
                      inputMode="decimal"
                      value={row.quantity}
                      onChange={(e) => update(row.key, { quantity: e.target.value })}
                      placeholder="Amount"
                      aria-label={`Amount of ${food.name}`}
                      aria-invalid={showError ? true : undefined}
                      aria-describedby={showError ? `err-${row.key}` : undefined}
                    />
                    <select
                      className="well-input mt-0 min-w-0 flex-1"
                      value={row.measureId}
                      onChange={(e: { target: { value: string } }) => update(row.key, { measureId: e.target.value })}
                      aria-label={`Unit for ${food.name}`}
                    >
                      {food.measures.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.id === "g" ? "grams" : `${m.label} (${formatGrams(m.gramsPerUnit)})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  {calcRow && measure && measure.id !== "g" && (
                    <p className="mt-1 text-xs text-slate-600">= {formatGrams(calcRow.grams ?? 0)}</p>
                  )}
                  {showError && (
                    <p id={`err-${row.key}`} className="mt-1 text-xs font-semibold text-red-700">{error}</p>
                  )}
                </li>
              );
            })}
          </ul>
          <label htmlFor="calc-servings" className="mt-3 block text-sm font-semibold text-slate-700">Servings</label>
          <input
            id="calc-servings"
            className="well-input w-24"
            inputMode="numeric"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            aria-invalid={calc.servingsError ? true : undefined}
            aria-describedby={calc.servingsError ? "err-servings" : undefined}
          />
          {calc.servingsError && (
            <p id="err-servings" className="mt-1 text-xs font-semibold text-red-700">{calc.servingsError}</p>
          )}
          {rows.length > 0 && (
            <Button variant="ghost" className="mt-3" onClick={() => { setRows([]); setServings("1"); }}>
              Clear calculator
            </Button>
          )}
        </section>

        <section className="card" aria-labelledby="calc-result-heading" aria-live="polite">
          <h2 id="calc-result-heading" className="section-title">Calculated estimate</h2>
          {!result && (
            <p className="mt-2 text-sm text-slate-600">
              {!rows.length
                ? "Add at least one ingredient and amount to see an estimate."
                : hasErrors
                  ? "Enter a valid amount for every ingredient and a whole number of servings to see the estimate."
                  : ""}
            </p>
          )}
          {result && (
            <>
              <p className="mt-1 text-sm text-slate-600">
                {formatGrams(result.totalGrams)} total · {result.servings} {result.servings === 1 ? "serving" : "equal servings"}
              </p>
              <table className="mt-3 w-full text-sm" data-testid="calc-results">
                <thead>
                  <tr className="text-left text-xs text-slate-600">
                    <th scope="col" className="py-1 font-semibold">Nutrient</th>
                    <th scope="col" className="py-1 text-right font-semibold">Whole recipe</th>
                    <th scope="col" className="py-1 text-right font-semibold">Per serving</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.nutrients.map((n) => (
                    <tr key={n.id}>
                      <th scope="row" className="py-2 text-left font-semibold text-slate-800">
                        {n.label}
                        {n.missing.length > 0 && (
                          <span className="block text-xs font-normal text-red-700">
                            Incomplete: no USDA value for {n.missing.join(", ")}
                          </span>
                        )}
                      </th>
                      <td className="py-2 text-right font-bold text-brand-700">{amount(n, n.total)}</td>
                      <td className="py-2 text-right font-bold text-brand-700">{amount(n, n.perServing)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-slate-500">
                Calculated estimate from USDA reference values and approved portion weights, not weighed or
                laboratory-tested food. Missing USDA values are never counted as zero. Not medical or dietary advice.
              </p>
              <details className="mt-3 text-sm text-slate-600">
                <summary className="min-h-[24px] cursor-pointer py-1 font-semibold text-brand-700">Ingredient weights & calculation</summary>
                <ul className="mt-2 space-y-3">
                  {result.rows.map((r) => (
                    <li key={r.key}>
                      <strong>
                        {r.food.name}: {r.quantity} {r.measure.id === "g" ? "g" : r.measure.label} = {formatGrams(r.grams ?? 0)}
                      </strong>
                      <br />
                      {r.food.description} ({r.food.state}). FDC {r.fdcId}
                      {r.measure.portionId ? `; portion ${r.measure.portionId}` : ""}. {r.measure.basis}
                    </li>
                  ))}
                </ul>
                <p className="mt-3">
                  Each nutrient = amount per 100 g × grams ÷ 100, summed across ingredients for the whole recipe, then
                  divided by {result.servings} for each serving. If any ingredient has no USDA value for a nutrient, that
                  nutrient is shown as Unknown. Figures are rounded for display.
                </p>
              </details>
              <details className="mt-3 text-sm text-slate-600">
                <summary className="min-h-[24px] cursor-pointer py-1 font-semibold text-brand-700">Sources</summary>
                <ul className="mt-2 space-y-2">
                  {[...new Map(result.rows.map((r) => [r.fdcId, r.food])).values()].map((f) => (
                    <li key={f.fdcId}>
                      <a className="text-brand-700 underline" href={f.sourceURL} target="_blank" rel="noreferrer">
                        USDA FoodData Central — {f.description} (FDC {f.fdcId})
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs">
                  USDA Agricultural Research Service, {SNAPSHOT}. Records and portions were reviewed for MoodMeal; this
                  custom combination was not.
                </p>
              </details>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
