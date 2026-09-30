import { useCallback, useState } from "react";
import { readStorage, writeStorage } from "../lib/storage";

/**
 * Generic localStorage-backed piece of state, JSON-serialized.
 *
 * The write happens as a plain, synchronous side effect at the moment the
 * setter is *called* — not inside a React state updater function, and not
 * in a `useEffect` keyed on the value. That distinction matters here:
 * several flows in this app update state and then immediately navigate
 * away in the same event handler (e.g. submitting a mood then routing to
 * the result screen). If the write happened inside `setValue(prev => ...)`
 * or a `useEffect`, React can drop it entirely: when a sibling/ancestor
 * state update (like the route change) causes this component to unmount
 * within the same render pass, React never bothers invoking this fiber's
 * pending updater or committing its effects, so the write silently never
 * happens. Calling `writeStorage` directly, before `setValue`, makes it an
 * ordinary function call in the same synchronous stack as the event
 * handler, independent of whatever React decides to do with the component
 * afterward.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => readStorage(key, initialValue));

  const setStoredValue = useCallback(
    (update: T | ((prev: T) => T)) => {
      const next = typeof update === "function" ? (update as (prev: T) => T)(value) : update;
      writeStorage(key, next);
      setValue(next);
    },
    [key, value]
  );

  const reset = useCallback(() => {
    writeStorage(key, initialValue);
    setValue(initialValue);
  }, [key, initialValue]);

  return [value, setStoredValue, reset] as const;
}
