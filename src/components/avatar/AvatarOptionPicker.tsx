/**
 * Generic picker for one AvatarConfig field: a row of color swatches when
 * the options carry a `hex` (skin tone, hair color, eye color, clothing
 * color), or a row of text pills otherwise (face shape, hair style, eye
 * style, eyebrows, facial hair, clothing style). Supports both single-
 * select (`value`/`onChange`) and multi-select (`values`/`onToggle`, used
 * for accessories) without duplicating the layout code.
 */
import type { SwatchOption } from "../../data/avatarOptions";
import { isLightColor } from "../../data/avatarAssets";
import { Check } from "../icons";

interface SingleSelectProps<T extends string> {
  label: string;
  options: SwatchOption<T>[];
  value: T;
  onChange: (id: T) => void;
  multi?: false;
}

interface MultiSelectProps<T extends string> {
  label: string;
  options: SwatchOption<T>[];
  values: T[];
  onToggle: (id: T) => void;
  multi: true;
}

type AvatarOptionPickerProps<T extends string> = SingleSelectProps<T> | MultiSelectProps<T>;

export default function AvatarOptionPicker<T extends string>(props: AvatarOptionPickerProps<T>) {
  const { label, options } = props;
  const isSelected = (id: T) => (props.multi ? props.values.includes(id) : props.value === id);
  const toggle = (id: T) => (props.multi ? props.onToggle(id) : props.onChange(id));

  const hasSwatches = options.some((o) => o.hex);

  return (
    <div className="mt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = isSelected(opt.id);
          if (hasSwatches) {
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggle(opt.id)}
                aria-pressed={selected}
                aria-label={`${label}: ${opt.label}`}
                title={opt.label}
                className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-offset-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none ${
                  selected ? "ring-2 ring-brand-500" : "ring-1 ring-slate-200"
                }`}
                style={{ backgroundColor: opt.hex }}
              >
                {/* The ring above is a secondary cue only — this checkmark
                    is what actually marks the selection so it never relies
                    on color/ring alone. */}
                {selected && (
                  <Check
                    size={16}
                    className={
                      isLightColor(opt.hex ?? "#000000") ? "text-slate-700" : "text-white"
                    }
                  />
                )}
              </button>
            );
          }
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              aria-pressed={selected}
              aria-label={`${label}: ${opt.label}`}
              className={`flex min-h-11 items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${
                selected ? "bg-brand-600 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
            >
              {selected && <Check size={13} strokeWidth={3} aria-hidden="true" />}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
