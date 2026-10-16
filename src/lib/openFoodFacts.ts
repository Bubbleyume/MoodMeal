/**
 * Read-only Open Food Facts (OFF) barcode lookup for the Nutrition
 * Calculator. Product data is crowd-sourced, unreviewed and kept in memory
 * only: it is never approved, stored or added to MoodMeal's catalog, and
 * nothing is ever written to Open Food Facts.
 *
 * API: GET {base}/api/v3.5/product/{barcode}?fields=… (read requests need no
 * account). v3.5 returns nutrition as `nutrition.aggregated_set` (explicit
 * per 100 g / 100 ml / serving, value, unit, source, modifier) plus the
 * `input_sets` exactly as contributors entered them. Limit: 15 product reads per minute per IP, so lookups only run
 * on an explicit button press and a client-side limiter stays well below
 * that. Browsers cannot set User-Agent, so the app identifies itself with
 * the X-User-Agent header that OFF's CORS policy allows.
 *
 * Data licence: Open Database License (database) and Database Contents
 * License (contents); attribution with a link to openfoodfacts.org is shown
 * wherever product data appears. Product images are not used.
 */
import type { UsdaNutrientValue } from "../types/nutrition";
import {
  OFF_NUTRIENT_MAP, adaptNutrition, checkConsistency, mapSet,
  type AdaptedSet, type ConsistencyCheck, type OffNutrient,
} from "./offNutritionAdapter";

export const OFF_BASE_URL = "https://world.openfoodfacts.org";
export const OFF_APP_ID = "MoodMeal/0.1.0 (web)";
export const OFF_TIMEOUT_MS = 10000;
export const OFF_ATTRIBUTION =
  "Product data from Open Food Facts (openfoodfacts.org), available under the Open Database License. Crowd-sourced and not reviewed by MoodMeal.";

const FIELDS = [
  "code", "product_name", "brands", "quantity", "product_quantity", "product_quantity_unit",
  "serving_size", "serving_quantity", "serving_quantity_unit",
  "no_nutrition_data", "nutrition", "ingredients_text", "allergens_tags", "traces_tags",
];

// ---------------------------------------------------------------- barcodes

/** GS1 check digit for the digits before it. */
function checkDigit(body: string): number {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const digit = Number(body[body.length - 1 - i]);
    sum += digit * (i % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10;
}

/**
 * Accepts EAN-8, UPC-A (12), EAN-13 and GTIN-14 with a valid check digit.
 * Spaces and hyphens are ignored; the code stays a string so leading zeros
 * are preserved.
 */
export function validateBarcode(input: string): { code: string } | { error: string } {
  const code = input.replace(/[\s-]/g, "");
  if (!code) return { error: "Enter a barcode." };
  if (!/^\d+$/.test(code)) return { error: "Use digits only (spaces and hyphens are fine)." };
  if (![8, 12, 13, 14].includes(code.length))
    return { error: "Barcodes have 8, 12, 13 or 14 digits (EAN-8, UPC-A, EAN-13 or GTIN-14)." };
  if (checkDigit(code.slice(0, -1)) !== Number(code[code.length - 1]))
    return { error: "This barcode's check digit doesn't match. Check the number and try again." };
  return { code };
}

export const productUrl = (code: string) => `${OFF_BASE_URL}/product/${encodeURIComponent(code)}`;

// ---------------------------------------------------------------- lookup

export type LookupOutcome =
  | { status: "found"; product: OffProduct }
  | { status: "not-found"; code: string }
  | { status: "rate-limited"; retryAfterSeconds: number }
  | { status: "timeout" }
  | { status: "network-error" }
  | { status: "error"; message: string };

type FetchLike = (url: string, init: { headers: Record<string, string>; signal: AbortSignal }) => Promise<{
  status: number;
  ok: boolean;
  headers: { get(name: string): string | null };
  json(): Promise<unknown>;
}>;

/** One read-only request; never retries automatically. */
export async function lookupProduct(
  code: string,
  options: { fetchImpl?: FetchLike; timeoutMs?: number; baseUrl?: string; now?: () => Date } = {},
): Promise<LookupOutcome> {
  const fetchImpl = options.fetchImpl ?? (globalThis.fetch as unknown as FetchLike);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? OFF_TIMEOUT_MS);
  const url = `${options.baseUrl ?? OFF_BASE_URL}/api/v3.5/product/${encodeURIComponent(code)}?fields=${FIELDS.join(",")}`;
  try {
    const res = await fetchImpl(url, {
      headers: { Accept: "application/json", "X-User-Agent": OFF_APP_ID },
      signal: controller.signal,
    });
    if (res.status === 429 || res.status === 503) {
      const retry = Number(res.headers.get("Retry-After"));
      return { status: "rate-limited", retryAfterSeconds: Number.isFinite(retry) && retry > 0 ? Math.ceil(retry) : 60 };
    }
    let body: unknown = null;
    try { body = await res.json(); } catch { body = null; }
    const json = (body && typeof body === "object" ? body : {}) as { status?: string; result?: { id?: string }; product?: unknown };
    if (res.status === 404 || json.result?.id === "product_not_found") return { status: "not-found", code };
    if (!res.ok) return { status: "error", message: `Open Food Facts returned HTTP ${res.status}.` };
    if (!json.product || typeof json.product !== "object") return { status: "error", message: "Open Food Facts returned an unexpected response." };
    return { status: "found", product: mapProduct(json.product as Record<string, unknown>, code, (options.now ?? (() => new Date()))()) };
  } catch (e) {
    if ((e as { name?: string })?.name === "AbortError") return { status: "timeout" };
    return { status: "network-error" };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Keeps lookups well under OFF's 15 reads/min/IP: at most `maxPerMinute`
 * lookups in any rolling minute and `minIntervalMs` between them. After a
 * rate-limit response, lookups wait for the server's retry time.
 */
export function createLookupLimiter({ maxPerMinute = 10, minIntervalMs = 3000 } = {}) {
  let times: number[] = [];
  let blockedUntil = 0;
  return {
    check(now: number): { ok: true } | { ok: false; waitSeconds: number } {
      times = times.filter((t) => now - t < 60000);
      const waits = [blockedUntil - now];
      if (times.length) waits.push(times[times.length - 1] + minIntervalMs - now);
      if (times.length >= maxPerMinute) waits.push(times[0] + 60000 - now);
      const wait = Math.max(...waits);
      return wait > 0 ? { ok: false, waitSeconds: Math.ceil(wait / 1000) } : { ok: true };
    },
    record(now: number) { times.push(now); },
    block(now: number, seconds: number) { blockedUntil = Math.max(blockedUntil, now + seconds * 1000); },
  };
}

// ---------------------------------------------------------------- mapping

export { OFF_NUTRIENT_MAP, KJ_PER_KCAL, describeConflict } from "./offNutritionAdapter";
export type { OffNutrient, OffConflict, ConsistencyCheck } from "./offNutritionAdapter";

export type NutritionBasis = "per100g" | "perServing" | "per100ml" | "unclear" | "none";

/** How the user resolved conflicting package entries (explicit choice, never automatic). */
export type ConflictResolution = "per100g" | "perServing";

export interface ResolutionOption {
  id: ConflictResolution;
  label: string;
  /** Values exactly as entered in that package entry. */
  nutrients: Record<string, OffNutrient>;
  servingGrams: number;
  available: boolean;
  unavailableReason?: string;
}

export interface OffProduct {
  code: string;
  name: string | null;
  brand: string | null;
  quantity: string | null;
  basis: NutritionBasis;
  basisLabel: string;
  /** Why the product can or cannot be calculated. */
  calculation: string;
  /** Whether the product is sold by weight, by volume, or unknown. */
  soldBy: "weight" | "volume" | "unknown";
  servingGrams: number | null;
  servingLabel: string | null;
  /** Aggregated values on the product's basis. */
  nutrients: Record<string, OffNutrient>;
  /** Result of comparing the record's package entries. */
  consistency: ConsistencyCheck;
  /** Choices offered only when package entries conflict. */
  resolutionOptions: ResolutionOption[];
  notes: string[];
  ingredientsText: string | null;
  allergens: string[] | "none" | null;
  traces: string[] | "none" | null;
  url: string;
  retrievedAt: string;
}

const VOLUME = /^(ml|cl|dl|l|fl ?oz|fl\. ?oz)$/i;
const MASS = /^(g|kg|mg)$/i;
const text = (v: unknown, max = 200): string | null => {
  if (typeof v !== "string") return null;
  const t = v.replace(/\s+/g, " ").trim();
  return t ? (t.length > max ? `${t.slice(0, max - 1)}…` : t) : null;
};
const tags = (v: unknown): string[] | "none" | null => {
  if (!Array.isArray(v) || !v.length) return null;
  const clean = v.filter((t): t is string => typeof t === "string")
    .map((t) => t.replace(/^[a-z]{2,3}:/, "").replace(/-/g, " ").trim()).filter(Boolean);
  if (clean.length === 1 && clean[0] === "none") return "none";
  return clean.length ? clean.slice(0, 20) : null;
};
const num = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" && /^\s*\d+(\.\d+)?\s*$/.test(v) ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : null;
};

function soldBy(p: Record<string, unknown>): OffProduct["soldBy"] {
  const productUnit = text(p.product_quantity_unit, 20) ?? "";
  const servingUnit = text(p.serving_quantity_unit, 20) ?? "";
  const quantity = text(p.quantity) ?? "";
  if (VOLUME.test(productUnit) || VOLUME.test(servingUnit) || /\d\s*(ml|cl|dl|l|fl\.? ?oz)\b/i.test(quantity)) return "volume";
  if (MASS.test(productUnit) || /\d\s*(g|kg)\b/i.test(quantity)) return "weight";
  return "unknown";
}

function determineBasis(p: Record<string, unknown>, agg: AdaptedSet | null, sold: OffProduct["soldBy"]): { basis: NutritionBasis; reason: string } {
  if (p.no_nutrition_data === "on")
    return { basis: "none", reason: "Open Food Facts records that this product's label has no nutrition facts." };
  if (!agg || !Object.keys(agg.nutrients).length)
    return { basis: "none", reason: "Open Food Facts has no nutrition values for this product." };
  const per = agg.per;
  if (per === "100ml" || (sold === "volume" && (per === "100g" || per === "serving")))
    return { basis: "per100ml", reason: "Nutrition is recorded per 100 ml (a liquid). MoodMeal does not convert milliliters to grams, because that needs the product's density." };
  if (per === "100g" && sold === "weight") return { basis: "per100g", reason: "Nutrition is recorded per 100 g and the product is sold by weight." };
  if (per === "serving") return { basis: "perServing", reason: "Nutrition is recorded per serving." };
  if (per === "100g")
    return { basis: "unclear", reason: "Nutrition is listed per 100 g, but the product's weight or volume unit isn't recorded, so MoodMeal can't confirm it isn't a liquid." };
  return { basis: "unclear", reason: "The nutrition basis (per 100 g, per 100 ml or per serving) isn't recorded." };
}

/** Serving weight only when Open Food Facts gives it explicitly in grams. */
function servingGrams(p: Record<string, unknown>): number | null {
  const amount = num(p.serving_quantity);
  if (amount === null || amount <= 0) return null;
  const unit = text(p.serving_quantity_unit, 20);
  const size = text(p.serving_size) ?? "";
  if (/\bml\b|\bl\b|fl\.? ?oz/i.test(size)) return null;
  if (unit === "g") return amount;
  const stated = size.match(/(\d+(?:\.\d+)?)\s*g\b/i);
  return !unit && stated && Number(stated[1]) === amount ? amount : null;
}

/** "30 g", or "1 bowl (30 g)" when the label wording doesn't already state the grams. */
function servingText(size: string | null, grams: number) {
  if (!size) return `${grams} g`;
  const stated = size.match(/(\d+(?:\.\d+)?)\s*g\b/i);
  return stated && Number(stated[1]) === grams ? size : `${size} (${grams} g)`;
}

/** The two package entries the user can choose between when they conflict. */
function resolutionOptions(consistency: ConsistencyCheck, sold: OffProduct["soldBy"]): ResolutionOption[] {
  if (consistency.status !== "conflict" || !consistency.pair) return [];
  const { per100, serving, servingGrams: grams, source } = consistency.pair;
  const volume = sold === "volume" ? "The product is sold by volume; MoodMeal doesn't assume a density." : undefined;
  return [
    {
      id: "perServing", label: `Per-serving entry (${grams} g, ${source})`, nutrients: mapSet(serving), servingGrams: grams,
      available: !volume, unavailableReason: volume,
    },
    {
      id: "per100g", label: `Per-100 g entry (${source})`, nutrients: mapSet(per100), servingGrams: grams,
      available: sold === "weight",
      unavailableReason: volume ?? (sold === "weight" ? undefined : "The product's weight or volume unit isn't recorded, so per-100 g values can't be confirmed as grams."),
    },
  ];
}

export function mapProduct(p: Record<string, unknown>, requestedCode: string, retrievedAt: Date): OffProduct {
  const code = typeof p.code === "string" && /^\d{8,14}$/.test(p.code) ? p.code : requestedCode;
  const adapted = adaptNutrition(p.nutrition);
  const sold = soldBy(p);
  const { basis, reason } = determineBasis(p, adapted.aggregated, sold);
  const grams = servingGrams(p);
  const nutrients = adapted.aggregated ? mapSet(adapted.aggregated)
    : Object.fromEntries(OFF_NUTRIENT_MAP.map((m) => [m.id, { amount: null, unit: m.unit, note: "Not recorded by Open Food Facts." } as OffNutrient]));
  const consistency = checkConsistency(adapted);
  const notes: string[] = [];
  if (nutrients["1008"].note?.startsWith("Converted")) notes.push("Calories were converted from kilojoules.");
  if (nutrients["1005"].note !== "Total carbohydrate, including fiber.")
    notes.push("Carbohydrates follow the product label. Some labels exclude fiber, so they may not match USDA \"carbohydrate, by difference\".");

  let calculation: string;
  if (consistency.status === "conflict") calculation = "Conflicting source nutrition values: choose which package entry matches your package before adding.";
  else if (basis === "per100g") calculation = `${reason} ${grams ? "Can be calculated by grams or by product serving." : "Can be calculated by grams. Product servings aren't offered because no serving weight in grams is recorded."}`;
  else if (basis === "perServing") calculation = grams ? `${reason} Can be calculated by product serving only.` : "Can't be calculated yet: nutrition is per serving, but no serving weight in grams is recorded.";
  else calculation = `Can't be calculated yet. ${reason}`;

  return {
    code,
    name: text(p.product_name, 120),
    brand: text(p.brands, 120),
    quantity: text(p.quantity, 60),
    basis,
    basisLabel: { per100g: "per 100 g", perServing: "per serving", per100ml: "per 100 ml (liquid)", unclear: "unclear basis", none: "no nutrition facts" }[basis],
    calculation,
    soldBy: sold,
    servingGrams: grams,
    servingLabel: grams ? servingText(text(p.serving_size, 60), grams) : null,
    nutrients,
    consistency,
    resolutionOptions: resolutionOptions(consistency, sold),
    notes,
    ingredientsText: text(p.ingredients_text, 800),
    allergens: tags(p.allergens_tags),
    traces: tags(p.traces_tags),
    url: productUrl(code),
    retrievedAt: retrievedAt.toISOString(),
  };
}

/**
 * Values for the preview table, exactly as Open Food Facts reports them, plus
 * a per-serving column scaled from per-100 g values when a gram serving is
 * recorded. This lets users compare with a per-serving package label. Values
 * are never corrected: if the record is inconsistent, the mismatch shows.
 */
export function previewValues(p: OffProduct): {
  columns: string[];
  rows: { id: string; label: string; unit: "KCAL" | "G"; values: (number | null)[] }[];
} {
  const scaled = p.basis === "per100g" && p.servingGrams;
  const columns = p.basis === "per100g"
    ? ["Per 100 g", ...(scaled ? [`Per serving (${p.servingGrams} g)`] : [])]
    : p.basis === "perServing"
      ? [p.servingGrams ? `Per serving (${p.servingGrams} g)` : "Per serving"]
      : [`As recorded (${p.basisLabel})`];
  const rows = OFF_NUTRIENT_MAP.map((m) => {
    const amount = p.nutrients[m.id].amount;
    const values = [amount];
    if (scaled) values.push(amount === null ? null : (amount * p.servingGrams!) / 100);
    return { id: m.id, label: m.label, unit: m.unit, values };
  });
  return { columns, rows };
}

/**
 * True when the product can join a calculation. A product with conflicting
 * package entries can join only after the user explicitly picks an
 * available entry; nothing is chosen automatically.
 */
export function isCalculable(p: OffProduct, resolution?: ConflictResolution) {
  if (p.consistency.status === "conflict")
    return !!resolution && !!p.resolutionOptions.find((o) => o.id === resolution && o.available);
  return p.basis === "per100g" || (p.basis === "perServing" && p.servingGrams !== null);
}

/**
 * Nutrients per 100 g for the shared calculator. Per-serving values are
 * expressed per 100 g of the stated serving weight, and are only offered by
 * the serving, so the result equals servings × the entered values.
 */
export function per100gNutrients(p: OffProduct, resolution?: ConflictResolution): Record<string, UsdaNutrientValue> {
  const option = p.consistency.status === "conflict" ? p.resolutionOptions.find((o) => o.id === resolution && o.available) : undefined;
  const out: Record<string, UsdaNutrientValue> = {};
  for (const m of OFF_NUTRIENT_MAP) {
    let amount: number | null = null;
    if (option) {
      const n = option.nutrients[m.id];
      amount = n.amount === null ? null : option.id === "per100g" ? n.amount : (n.amount * 100) / option.servingGrams;
    } else if (p.consistency.status !== "conflict") {
      const n = p.nutrients[m.id];
      amount = n.amount === null ? null
        : p.basis === "per100g" ? n.amount
        : p.basis === "perServing" && p.servingGrams ? (n.amount * 100) / p.servingGrams
        : null;
    }
    out[m.id] = { amount, unit: m.unit, sourceRowId: null };
  }
  return out;
}
