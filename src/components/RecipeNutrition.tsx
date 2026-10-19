import type { RecipeNutritionEstimate, NutritionValue } from "../types/nutrition";
import { Sources } from "./Knowledge";

const primary = [
  { id:"1008", label:"Energy" }, { id:"1003", label:"Protein" },
  { id:"1005", label:"Carbs" }, { id:"1004", label:"Fat" }, { id:"1079", label:"Fiber" },
];
function display(value: NutritionValue | undefined, digits = 1) {
  if (!value || value.perServing === null) return "Unknown";
  const unit = value.unit === "UG" ? "µg" : value.unit.toLowerCase();
  return `${value.perServing.toFixed(digits)} ${unit}`;
}
export default function RecipeNutrition({estimate}:{estimate:RecipeNutritionEstimate | null | undefined}) {
  if (!estimate) return <p className="mt-3 text-xs text-slate-500">Nutrition totals: not calculated. Nutrient tags describe documented ingredients, not measured amounts per serving.</p>;
  const byId = (id:string) => estimate.values.find(n => n.id === id);
  const inputWeight = estimate.ingredients.reduce((sum, i) => sum + (i.grams ?? 0), 0);
  return <section aria-label="Estimated nutrition per serving" className="mt-4 border-t border-slate-100 pt-4">
    <h2 className="section-title">Estimated nutrition</h2>
    <p className="mt-1 text-sm text-slate-600">Per serving · {estimate.servings} equal servings</p>
    <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {primary.map(n => <div key={n.id} className="rounded-xl bg-brand-50 p-3">
        <dt className="text-xs text-slate-600">{n.label}</dt>
        <dd className="mt-1 text-lg font-bold text-brand-700">{display(byId(n.id), n.id === "1008" ? 0 : 1)}</dd>
      </div>)}
    </dl>
    <p className="mt-3 text-sm text-slate-600">Added sugars: <strong>{display(byId("1235"))}</strong>. Missing USDA values are not treated as zero.</p>
    <p className="mt-2 text-xs text-slate-500">Estimated from reviewed USDA records and reference portion weights, not individually weighed ingredients. Not laboratory-verified or kitchen-tested.</p>
    <details className="mt-3 text-sm text-slate-600">
      <summary className="min-h-[24px] cursor-pointer py-1 font-semibold text-brand-700">Portions & calculation</summary>
      <ul className="mt-2 space-y-2">
        {estimate.ingredients.map(i => <li key={i.fdcId}><strong>{i.name}: {i.grams ?? "Unknown"} g</strong><br />{i.portionDescription}. FDC {i.fdcId}; portion {i.portionId}.</li>)}
      </ul>
      <p className="mt-3">Listed ingredient input weight: {inputWeight.toFixed(1)} g. Each nutrient is scaled from USDA amounts per 100 g, summed across ingredients, then divided by {estimate.servings} equal {estimate.servings === 1 ? "serving" : "servings"}. {estimate.calculationNote} Figures are rounded for display.</p>
    </details>
    <details className="mt-3 text-sm text-slate-600">
      <summary className="min-h-[24px] cursor-pointer py-1 font-semibold text-brand-700">More nutrients per serving</summary>
      <dl className="mt-2 space-y-2">
        {estimate.values.filter(n => !primary.some(p => p.id === n.id) && n.id !== "1235").map(n => <div key={n.id} className="flex flex-wrap justify-between gap-2"><dt>{n.name}</dt><dd>{display(n,2)}</dd></div>)}
      </dl>
    </details>
    <Sources sources={estimate.sources} />
  </section>;
}
