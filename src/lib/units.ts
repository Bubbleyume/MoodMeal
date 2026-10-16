/**
 * The one kitchen-volume standard MoodMeal uses: US customary measures.
 * 1 cup = 8 US fl oz = 16 tbsp = 48 tsp, and 1 tbsp = 3 tsp. Grocery
 * aggregation converts with these ratios. The derived USDA conversions
 * (tsp from tbsp, tbsp from cup) follow them too, and a test checks this.
 * Gram weights always come from USDA portions, never from volume.
 */
export const US_VOLUME_IN_TSP: Record<string, number> = { tsp: 1, tbsp: 3, cup: 48 };

const GLYPHS: Record<string, string> = {
  "1/2": "½", "1/3": "⅓", "2/3": "⅔", "1/4": "¼", "3/4": "¾",
  "1/8": "⅛", "3/8": "⅜", "5/8": "⅝", "7/8": "⅞",
};
const DENOMINATORS = [2, 3, 4, 8, 16];
// Stored amounts keep 4 decimals (thirds are 0.3333), so allow that much rounding.
const TOLERANCE = 5e-4;

/**
 * Formats a positive amount with a common kitchen fraction when it is one:
 * 0.875 → "⅞", 1.5 → "1½", 0.0625 → "1/16". Other values are returned
 * unchanged. `spoken` is a screen-reader-friendly form ("1 and 1/2").
 */
export function formatAmount(n: number): { text: string; spoken: string } {
  const plain = { text: String(n), spoken: String(n) };
  if (!Number.isFinite(n) || n <= 0 || Number.isInteger(n)) return plain;
  const whole = Math.floor(n + TOLERANCE);
  const part = n - whole;
  for (const d of DENOMINATORS) {
    const k = Math.round(part * d);
    if (k > 0 && k < d && Math.abs(part - k / d) < TOLERANCE) {
      const key = `${k}/${d}`;
      const frac = GLYPHS[key] ?? key;
      return {
        text: whole ? `${whole}${GLYPHS[key] ? "" : " "}${frac}` : frac,
        spoken: whole ? `${whole} and ${key}` : key,
      };
    }
  }
  return plain;
}

/**
 * Display form of a stored quantity such as "0.875 cup" or "1.5 cup cooked".
 * Only the leading number changes; the stored string keeps full precision.
 */
export function readableQuantity(quantity: string): { text: string; spoken: string } {
  const m = quantity.match(/^(\d+(?:\.\d+)?)(\s.*)?$/);
  if (!m) return { text: quantity, spoken: quantity };
  const amount = formatAmount(Number(m[1]));
  const rest = m[2] ?? "";
  return { text: amount.text + rest, spoken: amount.spoken + rest };
}
