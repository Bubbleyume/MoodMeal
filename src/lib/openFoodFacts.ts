/**
 * Read-only Open Food Facts (OFF) barcode lookup for the Nutrition
 * Calculator. Product data is crowd-sourced, unreviewed and kept in memory
 * only: it is never approved, stored or added to MoodMeal's catalog, and
 * nothing is ever written to Open Food Facts.
 *
 * API: GET {base}/api/v3/product/{barcode}?fields=… (read requests need no
 * account). Limit: 15 product reads per minute per IP, so lookups only run
 * on an explicit button press and a client-side limiter stays well below
 * that. Browsers cannot set User-Agent, so the app identifies itself with
 * the X-User-Agent header that OFF's CORS policy allows.
 *
 * Data licence: Open Database License (database) and Database Contents
 * License (contents); attribution with a link to openfoodfacts.org is shown
 * wherever product data appears. Product images are not used.
 */
import type { UsdaNutrientValue } from "../types/nutrition";

export const OFF_BASE_URL = "https://world.openfoodfacts.org";
export const OFF_APP_ID = "MoodMeal/0.1.0 (web)";
export const OFF_TIMEOUT_MS = 10000;
export const OFF_ATTRIBUTION =
  "Product data from Open Food Facts (openfoodfacts.org), available under the Open Database License. Crowd-sourced and not reviewed by MoodMeal.";

const FIELDS = [
  "code", "product_name", "brands", "quantity", "product_quantity", "product_quantity_unit",
  "serving_size", "serving_quantity", "serving_quantity_unit", "nutrition_data_per",
  "no_nutrition_data", "nutriments", "ingredients_text", "allergens_tags", "traces_tags",
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
  const url = `${options.baseUrl ?? OFF_BASE_URL}/api/v3/product/${encodeURIComponent(code)}?fields=${FIELDS.join(",")}`;
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

export type NutritionBasis = "per100g" | "perServing" | "per100ml" | "unclear" | "none";

/** Explicit mapping from OFF nutriment keys to the calculator's nutrients. */
export const OFF_NUTRIENT_MAP = [
  { id: "1008", label: "Calories", offKey: "energy-kcal", unit: "KCAL" },
  { id: "1003", label: "Protein", offKey: "proteins", unit: "G" },
  { id: "1005", label: "Carbohydrates", offKey: "carbohydrates", unit: "G" },
  { id: "1004", label: "Fat", offKey: "fat", unit: "G" },
  { id: "1079", label: "Fiber", offKey: "fiber", unit: "G" },
  { id: "2000", label: "Total sugars", offKey: "sugars", unit: "G" },
] as const;

export const KJ_PER_KCAL = 4.184;

export interface OffNutrient {
  /** Amount on the product's basis (per 100 g or per serving); null when unknown. */
  amount: number | null;
  unit: "KCAL" | "G";
  /** Why the amount is unknown, or how it was derived. */
  note?: string;
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
  servingGrams: number | null;
  servingLabel: string | null;
  nutrients: Record<string, OffNutrient>;
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

function determineBasis(p: Record<string, unknown>): { basis: NutritionBasis; reason: string } {
  const productUnit = text(p.product_quantity_unit, 20) ?? "";
  const servingUnit = text(p.serving_quantity_unit, 20) ?? "";
  const quantity = text(p.quantity) ?? "";
  const isVolume = VOLUME.test(productUnit) || VOLUME.test(servingUnit)
    || /\d\s*(ml|cl|dl|l|fl\.? ?oz)\b/i.test(quantity);
  const isMass = !isVolume && (MASS.test(productUnit) || /\d\s*(g|kg)\b/i.test(quantity));
  const per = text(p.nutrition_data_per, 20);
  if (p.no_nutrition_data === "on")
    return { basis: "none", reason: "Open Food Facts records that this product's label has no nutrition facts." };
  if (per === "100ml" || (isVolume && (per === "100g" || per === "serving")))
    return { basis: "per100ml", reason: "Nutrition is recorded per 100 ml (a liquid). MoodMeal does not convert milliliters to grams, because that needs the product's density." };
  if (per === "100g" && isMass) return { basis: "per100g", reason: "Nutrition is recorded per 100 g and the product is sold by weight." };
  if (per === "serving") return { basis: "perServing", reason: "Nutrition is recorded per serving." };
  if (per === "100g")
    return { basis: "unclear", reason: "Open Food Facts lists nutrition per 100 g or 100 ml, and this product's unit (weight or volume) isn't recorded, so the basis can't be confirmed." };
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

export function mapProduct(p: Record<string, unknown>, requestedCode: string, retrievedAt: Date): OffProduct {
  const code = text(p.code, 20) && /^\d+$/.test(String(p.code)) ? String(p.code) : requestedCode;
  const { basis, reason } = determineBasis(p);
  const grams = servingGrams(p);
  const nutriments = (p.nutriments && typeof p.nutriments === "object" ? p.nutriments : {}) as Record<string, unknown>;
  const suffix = basis === "perServing" ? "_serving" : "_100g";
  const notes: string[] = [];
  const read = (key: string): OffNutrient | null => {
    const modifier = text(nutriments[`${key}_modifier`], 4);
    const raw = nutriments[`${key}${suffix}`];
    if (raw === undefined || raw === null || raw === "") return null;
    const value = num(raw);
    if (value === null) return { amount: null, unit: "G", note: "Recorded value isn't a valid number." };
    if (modifier) return { amount: null, unit: "G", note: `Recorded as "${modifier} ${value}", not an exact amount.` };
    return { amount: value, unit: "G" };
  };
  const nutrients: Record<string, OffNutrient> = {};
  for (const m of OFF_NUTRIENT_MAP) {
    if (m.id === "1008") {
      const kcal = read("energy-kcal");
      if (kcal) { nutrients[m.id] = { ...kcal, unit: "KCAL" }; continue; }
      // _100g / _serving energy values are in kJ for "energy-kj" and "energy".
      const kj = read("energy-kj") ?? read("energy");
      nutrients[m.id] = kj && kj.amount !== null
        ? { amount: kj.amount / KJ_PER_KCAL, unit: "KCAL", note: `Converted from ${kj.amount} kJ (1 kcal = ${KJ_PER_KCAL} kJ).` }
        : { amount: null, unit: "KCAL", note: kj?.note ?? "Not recorded by Open Food Facts." };
      continue;
    }
    nutrients[m.id] = read(m.offKey) ?? { amount: null, unit: "G", note: "Not recorded by Open Food Facts." };
  }
  if (nutrients["1008"].note?.startsWith("Converted")) notes.push("Calories were converted from kilojoules.");
  notes.push("Carbohydrates follow the product label. Some labels exclude fiber, so they may not match USDA \"carbohydrate, by difference\".");

  let calculation: string;
  if (basis === "per100g") calculation = grams ? "Can be calculated by grams or by product serving." : "Can be calculated by grams. Product servings aren't offered because no serving weight in grams is recorded.";
  else if (basis === "perServing") calculation = grams ? "Can be calculated by product serving only." : "Can't be calculated yet: nutrition is per serving, but no serving weight in grams is recorded.";
  else calculation = `Can't be calculated yet. ${reason}`;

  return {
    code,
    name: text(p.product_name, 120),
    brand: text(p.brands, 120),
    quantity: text(p.quantity, 60),
    basis,
    basisLabel: { per100g: "per 100 g", perServing: "per serving", per100ml: "per 100 ml (liquid)", unclear: "unclear basis", none: "no nutrition facts" }[basis],
    calculation: basis === "per100g" || (basis === "perServing" && grams) ? `${reason} ${calculation}` : calculation,
    servingGrams: grams,
    servingLabel: grams ? servingText(text(p.serving_size, 60), grams) : null,
    nutrients,
    notes,
    ingredientsText: text(p.ingredients_text, 800),
    allergens: tags(p.allergens_tags),
    traces: tags(p.traces_tags),
    url: productUrl(code),
    retrievedAt: retrievedAt.toISOString(),
  };
}

/** "30 g", or "1 bowl (30 g)" when the label wording doesn't already state the grams. */
function servingText(size: string | null, grams: number) {
  if (!size) return `${grams} g`;
  const stated = size.match(/(\d+(?:\.\d+)?)\s*g\b/i);
  return stated && Number(stated[1]) === grams ? size : `${size} (${grams} g)`;
}

/** True when the product can join a calculation (grams and/or serving). */
export function isCalculable(p: OffProduct) {
  return p.basis === "per100g" || (p.basis === "perServing" && p.servingGrams !== null);
}

/**
 * Nutrients per 100 g for the shared calculator. Per-serving products are
 * expressed per 100 g of the stated serving weight, and are only offered by
 * the serving, so the result equals servings × the label values.
 */
export function per100gNutrients(p: OffProduct): Record<string, UsdaNutrientValue> {
  const out: Record<string, UsdaNutrientValue> = {};
  for (const m of OFF_NUTRIENT_MAP) {
    const n = p.nutrients[m.id];
    const amount = n.amount === null ? null
      : p.basis === "per100g" ? n.amount
      : p.basis === "perServing" && p.servingGrams ? (n.amount * 100) / p.servingGrams
      : null;
    out[m.id] = { amount, unit: m.unit, sourceRowId: null };
  }
  return out;
}
