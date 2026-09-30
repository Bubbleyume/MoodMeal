/**
 * A single-select option group for one AvatarConfig field, following the
 * WAI-ARIA radio group pattern: role="radiogroup" labelled by the section
 * heading, one role="radio" + aria-checked per option, and a roving
 * tabindex so Tab enters/leaves the group in one stop. Arrow keys move
 * selection (and focus) to the previous/next option, wrapping; Home/End
 * jump to the first/last; Space/Enter select the focused option.
 *
 * Callers supply the option's visual content via `renderOption` (a color
 * swatch, a small avatar thumbnail, ...) — every option keeps a visible or
 * aria-provided text label so selection never relies on color alone.
 */
import { useRef, type KeyboardEvent, type ReactNode } from "react";
import type { AvatarOption } from "../../data/avatarOptions";

interface AvatarRadioGroupProps<T extends string> {
  /** id of the visible heading that names this group. */
  labelledBy: string;
  options: AvatarOption<T>[];
  value: T;
  onChange: (id: T) => void;
  renderOption: (option: AvatarOption<T>, checked: boolean) => ReactNode;
  /** Layout classes for the group container (grid/flex). */
  className?: string;
  /** Classes for each option button, given whether it's checked. */
  optionClassName: (checked: boolean) => string;
}

export default function AvatarRadioGroup<T extends string>({
  labelledBy,
  options,
  value,
  onChange,
  renderOption,
  className = "",
  optionClassName,
}: AvatarRadioGroupProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const checkedIndex = Math.max(0, options.findIndex((o) => o.id === value));

  const select = (index: number) => {
    const next = (index + options.length) % options.length;
    onChange(options[next].id);
    refs.current?.[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        select(index + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        select(index - 1);
        break;
      case "Home":
        e.preventDefault();
        select(0);
        break;
      case "End":
        e.preventDefault();
        select(options.length - 1);
        break;
    }
  };

  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className={className}>
      {options.map((opt, i) => {
        const checked = i === checkedIndex;
        return (
          <button
            key={opt.id}
            ref={(el) => {
              if (refs.current) refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={opt.label}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(opt.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none ${optionClassName(checked)}`}
          >
            {renderOption(opt, checked)}
          </button>
        );
      })}
    </div>
  );
}
