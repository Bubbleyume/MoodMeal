import React, { useState } from "react";
import GroceryItem from "../components/GroceryItem";
import { useGroceryList } from "../hooks/useGroceryList";
import { Plus, ShoppingCart, Trash2 } from "../components/icons";

export default function GroceryListPage() {
  const { items, addItem, toggleItem, removeItem, clearCompleted } = useGroceryList();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");

  const active = items.filter((i) => !i.checked);
  const completed = items.filter((i) => i.checked);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    addItem(trimmed, quantity.trim() || undefined, "Added manually");
    setName("");
    setQuantity("");
  };

  return (
    <div className="flex h-full flex-1 flex-col mm-soft-bg">
      <div className="mm-gradient-bg px-4 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))] text-white">
        <h1 className="font-display text-xl font-extrabold">Grocery List</h1>
        <p className="mt-0.5 text-xs text-white/70">
          {active.length} item{active.length === 1 ? "" : "s"} to get
        </p>
      </div>

      <div className="screen-scroll -mt-4 rounded-t-[2rem] bg-transparent px-4 pt-5">
        <form onSubmit={handleAdd} className="card flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Add an item…"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
          />
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Qty"
            className="w-16 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
          />
          <button
            type="submit"
            aria-label="Add item"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition-transform active:scale-90 disabled:opacity-40"
            disabled={!name.trim()}
          >
            <Plus size={18} />
          </button>
        </form>

        {items.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center text-slate-400">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-brand-300 shadow-card">
              <ShoppingCart size={28} />
            </span>
            <p className="mt-3 text-sm font-medium text-slate-500">Your grocery list is empty</p>
            <p className="mt-1 max-w-[220px] text-xs text-slate-400">
              Add items above, or add suggested foods from a mood check-in or recipe.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {active.length > 0 && (
              <div>
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  To get ({active.length})
                </h2>
                <div className="space-y-2">
                  {active.map((item) => (
                    <GroceryItem key={item.id} item={item} onToggle={toggleItem} onRemove={removeItem} />
                  ))}
                </div>
              </div>
            )}

            {completed.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Completed ({completed.length})
                  </h2>
                  <button
                    onClick={clearCompleted}
                    className="flex items-center gap-1 text-xs font-semibold text-coral-500"
                  >
                    <Trash2 size={13} /> Clear completed
                  </button>
                </div>
                <div className="space-y-2">
                  {completed.map((item) => (
                    <GroceryItem key={item.id} item={item} onToggle={toggleItem} onRemove={removeItem} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
