import type { GroceryItem } from "../types";
import { parseIngredient, ingredientId } from "./catalog";
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
    const existing = next.find((i) => {
      const p = parseIngredient({ name: i.name, quantity: i.quantity ?? "" });
      return (
        !i.checked &&
        ingredientId(i.name) === parsed.ingredientId &&
        p.quantity !== null &&
        parsed.quantity !== null &&
        p.unit === parsed.unit &&
        p.notes === parsed.notes
      );
    });
    if (existing) {
      const old = parseIngredient({
        name: existing.name,
        quantity: existing.quantity ?? "",
      });
      const amount = Number(
        ((old.quantity ?? 0) + (parsed.quantity ?? 0)).toFixed(4),
      );
      existing.quantity = [
        amount,
        parsed.unit === "each" ? "" : parsed.unit,
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
