import { aggregateGroceries } from "../lib/grocery";
import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { STORAGE_KEYS } from "../lib/storage";
import type { GroceryItem } from "../types";

function makeId() {
  return `g-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useGroceryList() {
  const [items, setItems] = useLocalStorage<GroceryItem[]>(
    STORAGE_KEYS.groceryList,
    [],
  );

  const addMany = (
    entries: { name: string; quantity?: string }[],
    addedFrom?: string,
  ) => setItems((prev) => aggregateGroceries(prev, entries, addedFrom));
  const addItem = (name: string, quantity?: string, addedFrom?: string) =>
    addMany([{ name, quantity }], addedFrom);

  const toggleItem = useCallback(
    (id: string) => {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
      );
    },
    [setItems],
  );

  const removeItem = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    [setItems],
  );

  const clearCompleted = useCallback(() => {
    setItems((prev) => prev.filter((i) => !i.checked));
  }, [setItems]);

  const clearAll = useCallback(() => {
    setItems([]);
  }, [setItems]);

  return {
    items,
    addItem,
    addMany,
    toggleItem,
    removeItem,
    clearCompleted,
    clearAll,
  };
}
