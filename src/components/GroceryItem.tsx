import React from "react";
import type { GroceryItem as GroceryItemType } from "../types";
import { Check, Trash2 } from "./icons";
import IngredientThumb from "./IngredientThumb";

interface GroceryItemProps {
  item: GroceryItemType;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function GroceryItem({ item, onToggle, onRemove }: GroceryItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-card ring-1 ring-slate-100 animate-fade-in">
      <IngredientThumb name={item.name} />

      <button
        onClick={() => onToggle(item.id)}
        aria-label={item.checked ? "Mark as not done" : "Mark as done"}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          item.checked ? "border-moodGreen-500 bg-moodGreen-500 text-white" : "border-slate-300 text-transparent"
        }`}
      >
        <Check size={14} strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium ${
            item.checked ? "text-slate-400 line-through" : "text-slate-800"
          }`}
        >
          {item.name}
          {item.quantity ? (
            <span className="ml-1.5 text-xs font-normal text-slate-400">{item.quantity}</span>
          ) : null}
        </p>
        {item.addedFrom && (
          <p className="truncate text-[11px] text-slate-400">from {item.addedFrom}</p>
        )}
      </div>

      <button
        onClick={() => onRemove(item.id)}
        aria-label="Remove item"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-coral-50 hover:text-coral-500 active:scale-90"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
