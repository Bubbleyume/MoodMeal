import type { GroceryItem } from "../types";
import { parseIngredient, ingredientId } from "./catalog";
import { US_VOLUME_IN_TSP } from "./units";

// Only US customary volume units (see units.ts) are converted; weights,
// counts and other units stay on their own rows.
const TSP_PER = US_VOLUME_IN_TSP;

/**
 * Expresses a volume total in the largest unit that gives a tidy amount:
 * cups in 1/8 steps (from 1/4 cup), then tablespoons in 1/2 steps (from
 * 1 tbsp), otherwise teaspoons. 1 tbsp + 1 tsp stays "4 tsp".
 */
export function tidyVolume(tsp: number): { amount: number; unit: string } {
  const step = (v: number, size: number) => Math.abs(v / size - Math.round(v / size)) < 1e-9;
  const cups = tsp / TSP_PER.cup, tbsp = tsp / TSP_PER.tbsp;
  if (cups >= 0.25 && step(cups, 0.125)) return { amount: cups, unit: "cup" };
  if (tbsp >= 1 && step(tbsp, 0.5)) return { amount: tbsp, unit: "tbsp" };
  return { amount: Number(tsp.toFixed(4)), unit: "tsp" };
}

export function aggregateGroceries(
  previous: GroceryItem[],
  entries: { name: string; quantity?: string }[],
  addedFrom?: string,
): GroceryItem[] {
  const next = previous.map((i) => ({ ...i }));
  for (const entry of entries) {
    const parsed = parseIngredient({
      name: entry.name,
      quantity: entry.quantity ?? "",
    });
    const candidates = next.filter((i) => {
      const p = parseIngredient({ name: i.name, quantity: i.quantity ?? "" });
      return (
        !i.checked &&
        ingredientId(i.name) === parsed.ingredientId &&
        p.quantity !== null &&
        parsed.quantity !== null &&
        p.notes === parsed.notes
      );
    });
    const unitOf = (i: GroceryItem) =>
      parseIngredient({ name: i.name, quantity: i.quantity ?? "" }).unit;
    // Prefer a row in the same unit; otherwise a convertible volume row.
    const existing =
      candidates.find((i) => unitOf(i) === parsed.unit) ??
      candidates.find((i) => unitOf(i) in TSP_PER && parsed.unit in TSP_PER);
    if (existing) {
      const old = parseIngredient({
        name: existing.name,
        quantity: existing.quantity ?? "",
      });
      let amount: number;
      let unit = parsed.unit;
      if (old.unit === parsed.unit) {
        amount = Number(((old.quantity ?? 0) + (parsed.quantity ?? 0)).toFixed(4));
      } else {
        const total = (old.quantity ?? 0) * TSP_PER[old.unit] + (parsed.quantity ?? 0) * TSP_PER[parsed.unit];
        ({ amount, unit } = tidyVolume(total));
      }
      existing.quantity = [
        amount,
        unit === "each" ? "" : unit,
        parsed.notes,
      ]
        .filter((x) => x !== "")
        .join(" ");
      existing.addedFrom = [existing.addedFrom, addedFrom]
        .filter((x, i, a) => x && a.indexOf(x) === i)
        .join(" + ");
    } else
      next.unshift({
        id: `g-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: entry.name,
        quantity: entry.quantity,
        checked: false,
        addedFrom,
        createdAt: new Date().toISOString(),
      });
  }
  return next;
}
