/**
 * Adapter for the Open Food Facts v3.5 `nutrition` schema, independent of the
 * lookup and the UI so it can be tested on its own.
 *
 * Schema (Product-Nutrition v3.5, reviewed 2026-10-16):
 * - `aggregated_set`: read-only, computed by OFF from the input sets in source
 *   priority (manufacturer, packaging, usda, estimate). It has `per`
 *   (100g / 100ml / serving), `preparation` (as_sold / prepared) and
 *   `nutrients`.
 * - `input_sets`: sets as entered, each with `source`, `preparation`, `per`,
 *   `per_quantity` and `per_unit` (e.g. 103 g for a serving), and `nutrients`.
 * - Each nutrient entry: `value_string` (as entered), `value`,
 *   `value_computed` (system-derived), `unit` (free string), optional
 *   `modifier` (< <= ~ >= >), and in the aggregated set `source`,
 *   `source_per`, `source_index`.
 *
 * Unknown nutrient keys are tolerated. Unexpected or missing set fields are
 * reported as schema issues, never silently skipped.
 */

export type OffPer = "100g" | "100ml" | "serving";
export type OffPreparation = "as_sold" | "prepared";

/** Explicit mapping from OFF v3.5 nutrient keys to the calculator's nutrients. */
export const OFF_NUTRIENT_MAP = [
  { id: "1008", label: "Calories", offKeys: ["energy-kcal", "energy-kj", "energy"], unit: "KCAL" },
  { id: "1003", label: "Protein", offKeys: ["proteins"], unit: "G" },
  { id: "1005", label: "Carbohydrates", offKeys: ["carbohydrates-total", "carbohydrates"], unit: "G" },
  { id: "1004", label: "Fat", offKeys: ["fat"], unit: "G" },
  { id: "1079", label: "Fiber", offKeys: ["fiber"], unit: "G" },
  { id: "2000", label: "Total sugars", offKeys: ["sugars"], unit: "G" },
] as const;
export type OffMapEntry = (typeof OFF_NUTRIENT_MAP)[number];

export const KJ_PER_KCAL = 4.184;

export interface OffNutrient {
  /** Amount in the calculator unit on the set's basis; null when unknown. */
  amount: number | null;
  unit: "KCAL" | "G";
  /** Why the amount is unknown, or how it was derived. */
  note?: string;
  /** Half of the last declared digit of the entered value, in the calculator unit. */
  precisionHalf?: number;
}

/** One nutrient entry as received (fields kept untyped until validated). */
export interface RawEntry {
  value?: unknown;
  value_string?: unknown;
  unit?: unknown;
  modifier?: unknown;
  source?: unknown;
  source_per?: unknown;
}

export interface AdaptedSet {
  index: number;
  source: string | null;
  preparation: OffPreparation | null;
  per: OffPer | null;
  perQuantity: number | null;
  perUnit: "g" | "ml" | null;
  nutrients: Record<string, RawEntry>;
  /** Problems with this set's own fields (unexpected or missing). */
  issues: string[];
}

export interface AdaptedNutrition {
  aggregated: AdaptedSet | null;
  inputSets: AdaptedSet[];
  /** Schema problems that prevent a full consistency check. */
  schemaIssues: string[];
}

const obj = <T>(v: unknown): T | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as T) : null);
const str = (v: unknown) => (typeof v === "string" ? v.trim() : null);
const posNum = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" && /^\s*\d+(\.\d+)?\s*$/.test(v) ? Number(v) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
};

function normPer(v: unknown): OffPer | null | "unknown" {
  const s = str(v)?.toLowerCase().replace(/\s+/g, "");
  if (s === undefined || s === null || s === "") return null;
  return s === "100g" || s === "100ml" || s === "serving" ? s : "unknown";
}
function normPreparation(v: unknown): OffPreparation | null | "unknown" {
  const s = str(v)?.toLowerCase();
  if (!s) return null;
  return s === "as_sold" || s === "prepared" ? s : "unknown";
}
function normUnit(v: unknown): "g" | "ml" | null | "unknown" {
  const s = str(v)?.toLowerCase();
  if (!s) return null;
  return s === "g" || s === "ml" ? s : "unknown";
}

function adaptSet(raw: unknown, index: number, aggregated: boolean): AdaptedSet | null {
  const set = obj<Record<string, unknown>>(raw);
  if (!set) return null;
  const issues: string[] = [];
  const per = normPer(set.per);
  const preparation = normPreparation(set.preparation);
  const perUnit = normUnit(set.per_unit);
  if (per === "unknown") issues.push(`unexpected basis "${String(set.per)}"`);
  if (per === null) issues.push("missing basis");
  if (preparation === "unknown") issues.push(`unexpected preparation "${String(set.preparation)}"`);
  if (preparation === null && !aggregated) issues.push("missing preparation");
  if (perUnit === "unknown") issues.push(`unexpected reference unit "${String(set.per_unit)}"`);
  if (set.per_quantity !== undefined && set.per_quantity !== null && posNum(set.per_quantity) === null)
    issues.push(`invalid reference quantity "${String(set.per_quantity)}"`);
  const nutrients = obj<Record<string, RawEntry>>(set.nutrients);
  if (!nutrients) issues.push("missing nutrients");
  return {
    index,
    source: str(set.source)?.toLowerCase() || null,
    preparation: preparation === "unknown" ? null : preparation ?? (aggregated ? "as_sold" : null),
    per: per === "unknown" ? null : per,
    perQuantity: posNum(set.per_quantity),
    perUnit: perUnit === "unknown" ? null : perUnit,
    nutrients: nutrients ?? {},
    issues,
  };
}

/** Normalizes the `nutrition` object; never throws on unexpected shapes. */
export function adaptNutrition(raw: unknown): AdaptedNutrition {
  const nutrition = obj<Record<string, unknown>>(raw);
  const schemaIssues: string[] = [];
  if (!nutrition) return { aggregated: null, inputSets: [], schemaIssues: raw === undefined || raw === null ? [] : ["nutrition is not an object"] };
  const aggregated = nutrition.aggregated_set === undefined ? null : adaptSet(nutrition.aggregated_set, -1, true);
  if (nutrition.aggregated_set !== undefined && !aggregated) schemaIssues.push("aggregated set is not an object");
  let inputSets: AdaptedSet[] = [];
  if (nutrition.input_sets === undefined) schemaIssues.push("input sets are missing");
  else if (!Array.isArray(nutrition.input_sets)) schemaIssues.push("input sets are not a list");
  else {
    nutrition.input_sets.forEach((s, i) => {
      const adapted = adaptSet(s, i, false);
      if (!adapted) schemaIssues.push(`input set ${i + 1} is not an object`);
      else inputSets.push(adapted);
    });
  }
  // Problems in non-estimate sets could hide a conflict, so they are reported.
  for (const s of inputSets)
    if (s.source !== "estimate" && s.issues.length) schemaIssues.push(`input set ${s.index + 1} (${s.source ?? "unknown source"}): ${s.issues.join(", ")}`);
  return { aggregated, inputSets, schemaIssues };
}

// ---------------------------------------------------------------- values

/** Converts a value in an OFF unit to the calculator unit; null when not safely convertible. */
export function toStandard(value: number, unit: string, target: "KCAL" | "G"): { amount: number; factor: number; converted?: string } | null {
  const u = unit.trim();
  if (target === "KCAL") {
    if (/^kcal$/i.test(u)) return { amount: value, factor: 1 };
    if (/^kj$/i.test(u)) return { amount: value / KJ_PER_KCAL, factor: 1 / KJ_PER_KCAL, converted: `Converted from ${value} kJ (1 kcal = ${KJ_PER_KCAL} kJ).` };
    return null;
  }
  if (u === "g") return { amount: value, factor: 1 };
  if (u === "mg") return { amount: value / 1000, factor: 1 / 1000 };
  if (u === "µg" || u === "μg" || u === "mcg") return { amount: value / 1e6, factor: 1 / 1e6 };
  return null;
}

/** Half of the last declared digit of `value_string` ("12" → 0.5, "11.7" → 0.05); null if not declared. */
export function declaredPrecisionHalf(valueString: unknown): number | null {
  const s = str(valueString);
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
  const decimals = s.includes(".") ? s.split(".")[1].length : 0;
  return 0.5 * 10 ** -decimals;
}

/** Reads one entry exactly; estimates, modifiers and unknown units are not used. */
export function readEntry(entry: RawEntry | undefined, target: "KCAL" | "G"): OffNutrient | null {
  if (!entry || typeof entry !== "object") return null;
  const rawValue = entry.value ?? entry.value_string;
  if (rawValue === undefined || rawValue === null || rawValue === "") return null;
  if (str(entry.source)?.toLowerCase() === "estimate")
    return { amount: null, unit: target, note: "Only an Open Food Facts estimate is available (not from the package); not used." };
  const value = typeof rawValue === "number" ? rawValue : typeof rawValue === "string" && /^\s*\d+(\.\d+)?\s*$/.test(rawValue) ? Number(rawValue) : NaN;
  if (!Number.isFinite(value) || value < 0) return { amount: null, unit: target, note: "Recorded value isn't a valid number." };
  const modifier = str(entry.modifier);
  if (modifier) return { amount: null, unit: target, note: `Recorded as "${modifier} ${value}", not an exact amount.` };
  const unit = str(entry.unit);
  const std = unit ? toStandard(value, unit, target) : null;
  if (!std) return { amount: null, unit: target, note: `Unit "${unit ?? "missing"}" can't be converted safely.` };
  const half = declaredPrecisionHalf(entry.value_string);
  return {
    amount: std.amount, unit: target,
    ...(std.converted ? { note: std.converted } : {}),
    ...(half !== null ? { precisionHalf: half * std.factor } : {}),
  };
}

/** First usable key for a mapped nutrient, in the map's order of preference. */
export function readMapped(nutrients: Record<string, RawEntry>, m: OffMapEntry): OffNutrient {
  let firstProblem: OffNutrient | null = null;
  for (const key of m.offKeys) {
    const n = readEntry(nutrients[key], m.unit);
    if (n && n.amount !== null) {
      if (m.id === "1005" && key === "carbohydrates-total") return { ...n, note: "Total carbohydrate, including fiber." };
      return n;
    }
    firstProblem ??= n;
  }
  return firstProblem ?? { amount: null, unit: m.unit, note: "Not recorded by Open Food Facts." };
}

export function mapSet(set: AdaptedSet): Record<string, OffNutrient> {
  return Object.fromEntries(OFF_NUTRIENT_MAP.map((m) => [m.id, readMapped(set.nutrients, m)]));
}

// ---------------------------------------------------------------- consistency

/** A nutrient whose per-100 g and per-serving entries disagree beyond rounding and declared precision. */
export interface OffConflict {
  id: string;
  label: string;
  unit: "KCAL" | "G";
  per100g: number;
  perServing: number;
  servingGrams: number;
  /** The per-100 g entry scaled to the serving weight. */
  expectedPerServing: number;
  tolerance: number;
}

export interface ComparedPair {
  source: string;
  preparation: OffPreparation;
  servingGrams: number;
  per100: AdaptedSet;
  serving: AdaptedSet;
}

export type ConsistencyStatus = "consistent" | "conflict" | "not-comparable" | "unverifiable";

export interface ConsistencyCheck {
  status: ConsistencyStatus;
  reason: string;
  conflicts: OffConflict[];
  /** The first pair with conflicts (or the first compared pair). */
  pair: ComparedPair | null;
  /** Nutrient labels that could be compared in at least one pair. */
  compared: string[];
}

/**
 * Half of the US label rounding step (21 CFR 101.9): calories to 5 or 10
 * kcal; fat to 0.5 g below 5 g, otherwise 1 g; other grams to 1 g.
 */
export function halfRoundingStep(unit: "KCAL" | "G", id: string, value: number): number {
  if (unit === "KCAL") return value > 50 ? 5 : 2.5;
  if (id === "1004" && value < 5) return 0.25;
  return 0.5;
}

/** Allowed difference for one side: label rounding or declared precision, whichever is larger. */
function sideTolerance(n: OffNutrient, id: string): number {
  return Math.max(halfRoundingStep(n.unit, id, n.amount!), n.precisionHalf ?? 0);
}

function comparePair(pair: ComparedPair): { conflicts: OffConflict[]; compared: string[] } {
  const a = mapSet(pair.per100);
  const b = mapSet(pair.serving);
  const conflicts: OffConflict[] = [];
  const compared: string[] = [];
  for (const m of OFF_NUTRIENT_MAP) {
    const x = a[m.id], y = b[m.id];
    if (x.amount === null || y.amount === null) continue; // missing or inexact: nothing to compare
    compared.push(m.label);
    const scale = pair.servingGrams / 100;
    const expected = x.amount * scale;
    const tolerance = sideTolerance(y, m.id) + sideTolerance(x, m.id) * scale;
    if (Math.abs(expected - y.amount) > tolerance + 1e-9)
      conflicts.push({ id: m.id, label: m.label, unit: m.unit, per100g: x.amount, perServing: y.amount, servingGrams: pair.servingGrams, expectedPerServing: expected, tolerance });
  }
  return { conflicts, compared };
}

/**
 * Compares per-100 g and per-serving input sets only when they share the
 * same source and preparation and the serving set states its weight in
 * grams. Estimate sets are never compared.
 */
export function checkConsistency(n: AdaptedNutrition): ConsistencyCheck {
  const usable = n.inputSets.filter((s) => s.source !== "estimate" && s.source && s.preparation && s.per);
  const pairs: ComparedPair[] = [];
  const skipped: string[] = [];
  for (const a of usable.filter((s) => s.per === "100g" && (s.perUnit ?? "g") === "g")) {
    for (const b of usable.filter((s) => s.per === "serving")) {
      if (a.source !== b.source || a.preparation !== b.preparation) { skipped.push("entries come from different sources or preparation states"); continue; }
      if (b.perUnit !== "g" || !b.perQuantity) { skipped.push(b.perUnit === "ml" ? "the per-serving entry is measured in ml" : "the per-serving entry has no gram weight"); continue; }
      pairs.push({ source: a.source!, preparation: a.preparation!, servingGrams: b.perQuantity, per100: a, serving: b });
    }
  }
  let firstConflict: { pair: ComparedPair; conflicts: OffConflict[] } | null = null;
  const compared = new Set<string>();
  for (const pair of pairs) {
    const r = comparePair(pair);
    r.compared.forEach((c) => compared.add(c));
    if (r.conflicts.length && !firstConflict) firstConflict = { pair, conflicts: r.conflicts };
  }
  if (firstConflict)
    return { status: "conflict", reason: "Per-100 g and per-serving package entries disagree beyond label rounding.", conflicts: firstConflict.conflicts, pair: firstConflict.pair, compared: [...compared] };
  if (n.schemaIssues.length)
    return { status: "unverifiable", reason: `Couldn't fully check this record for conflicting values: ${n.schemaIssues.join("; ")}.`, conflicts: [], pair: pairs[0] ?? null, compared: [...compared] };
  if (pairs.length && compared.size)
    return { status: "consistent", reason: "Per-100 g and per-serving package entries agree within label rounding.", conflicts: [], pair: pairs[0], compared: [...compared] };
  const why = pairs.length ? "the entries share no exact nutrient values to compare"
    : skipped[0] ?? (usable.length <= 1 ? "there is only one package entry" : "no per-100 g and per-serving pair was found");
  return { status: "not-comparable", reason: `No consistency comparison was possible: ${why}.`, conflicts: [], pair: null, compared: [] };
}

/** Plain-language summary of one conflict. */
export function describeConflict(c: OffConflict): string {
  const f = (v: number) => (c.unit === "KCAL" ? `${Number(v.toFixed(0))} kcal` : `${Number(v.toFixed(2))} g`);
  return `${c.label}: ${f(c.per100g)} per 100 g would be ${f(c.expectedPerServing)} per ${c.servingGrams} g serving, but the per-serving entry says ${f(c.perServing)}.`;
}
