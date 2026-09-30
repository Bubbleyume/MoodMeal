import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { STORAGE_KEYS } from "../lib/storage";
import type { GroceryItem } from "../types";

function makeId() {
  return `g-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useGroceryList() {
  const [items, setItems] = useLocalStorage<GroceryItem[]>(STORAGE_KEYS.groceryList, []);

  const addItem = useCallback(
    (name: string, quantity?: string, addedFrom?: string) => {
      setItems((prev) => {
        const existing = prev.find(
          (i) => i.name.toLowerCase() === name.toLowerCase() && !i.checked
        );
        if (existing) return prev; // avoid duplicate active entries
        const next: GroceryItem = {
          id: makeId(),
          name,
          quantity,
          checked: false,
          addedFrom,
          createdAt: new Date().toISOString(),
        };
        return [next, ...prev];
      });
    },
    [setItems]
  );

  const addMany = useCallback(
    (entries: { name: string; quantity?: string }[], addedFrom?: string) => {
      setItems((prev) => {
        const existingNames = new Set(
          prev.filter((i) => !i.checked).map((i) => i.name.toLowerCase())
        );
        const additions: GroceryItem[] = entries
          .filter((e) => !existingNames.has(e.name.toLowerCase()))
          .map((e) => ({
            id: makeId(),
            name: e.name,
            quantity: e.quantity,
            checked: false,
            addedFrom,
            createdAt: new Date().toISOString(),
          }));
        return [...additions, ...prev];
      });
    },
    [setItems]
  );

  const toggleItem = useCallback(
    (id: string) => {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i))
      );
    },
    [setItems]
  );

  const removeItem = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    [setItems]
  );

  const clearCompleted = useCallback(() => {
    setItems((prev) => prev.filter((i) => !i.checked));
  }, [setItems]);

  const clearAll = useCallback(() => {
    setItems([]);
  }, [setItems]);

  return { items, addItem, addMany, toggleItem, removeItem, clearCompleted, clearAll };
}
