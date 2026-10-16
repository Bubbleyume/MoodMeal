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

/** Most entries MoodMeal will present as one choice; more than this is blocked. */
export const MAX_RESOLUTION_ENTRIES = 5;

/** One complete, identifiable input set, as the user would choose it. */
export interface EntryRef {
  setIndex: number;
  /** "Entry 2: packaging, as sold, per serving of 103 g" */
  label: string;
  per: "100g" | "serving";
  /** Grams the entry's values refer to (100 for per 100 g; the serving weight otherwise). */
  referenceGrams: number;
}

/** A nutrient on which two entries of the same source and preparation disagree beyond rounding and precision. */
export interface OffConflict {
  id: string;
  label: string;
  unit: "KCAL" | "G";
  a: EntryRef & { value: number };
  b: EntryRef & { value: number };
  /** Entry a's value scaled to entry b's reference weight. */
  expectedB: number;
  tolerance: number;
}

export interface ConflictGroup {
  source: string;
  preparation: OffPreparation;
  /** Every mass-referenced entry in this group; each is a complete choice. */
  entries: EntryRef[];
}

export type ConsistencyStatus = "consistent" | "conflict" | "not-comparable" | "unverifiable";

export interface ConsistencyCheck {
  status: ConsistencyStatus;
  reason: string;
  /** Every material conflict found across all comparable pairs. */
  conflicts: OffConflict[];
  /** The group of entries the user chooses from when status is "conflict" and resolvable. */
  group: ConflictGroup | null;
  /** False when conflicts can't be presented as one clear choice; the product is then blocked. */
  resolvable: boolean;
  blockReason?: string;
  /** Nutrient labels compared in at least one pair. */
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

/** Gram reference of a set (per 100 g, or a serving stated in grams); null when it isn't mass-based. */
export function referenceGrams(s: AdaptedSet): number | null {
  if (s.per === "100g" && (s.perUnit ?? "g") === "g") return 100;
  if (s.per === "serving" && s.perUnit === "g" && s.perQuantity) return s.perQuantity;
  return null;
}

export function entryRef(s: AdaptedSet): EntryRef | null {
  const grams = referenceGrams(s);
  if (grams === null || !s.source || !s.preparation) return null;
  const per = s.per === "100g" ? "100g" : "serving";
  const prep = s.preparation === "as_sold" ? "as sold" : "prepared";
  return {
    setIndex: s.index, per, referenceGrams: grams,
    label: `Entry ${s.index + 1}: ${s.source}, ${prep}, ${per === "100g" ? "per 100 g" : `per serving of ${grams} g`}`,
  };
}

function compareSets(x: AdaptedSet, y: AdaptedSet): { conflicts: OffConflict[]; compared: string[] } {
  const ex = entryRef(x)!, ey = entryRef(y)!;
  const a = mapSet(x), b = mapSet(y);
  const conflicts: OffConflict[] = [];
  const compared: string[] = [];
  for (const m of OFF_NUTRIENT_MAP) {
    const va = a[m.id], vb = b[m.id];
    if (va.amount === null || vb.amount === null) continue; // missing or inexact: nothing to compare
    compared.push(m.label);
    const scale = ey.referenceGrams / ex.referenceGrams;
    const expected = va.amount * scale;
    const tolerance = sideTolerance(vb, m.id) + sideTolerance(va, m.id) * scale;
    if (Math.abs(expected - vb.amount) > tolerance + 1e-9)
      conflicts.push({ id: m.id, label: m.label, unit: m.unit, a: { ...ex, value: va.amount }, b: { ...ey, value: vb.amount }, expectedB: expected, tolerance });
  }
  return { conflicts, compared };
}

/**
 * Compares every pair of mass-referenced input sets (per 100 g, or per
 * serving with a gram weight) that share the same source and preparation.
 * Sets from different sources or preparation states, estimate sets and
 * volume-based sets are never compared.
 */
export function checkConsistency(n: AdaptedNutrition): ConsistencyCheck {
  const usable = n.inputSets.filter((s) => s.source !== "estimate" && s.source && s.preparation && s.per);
  const groups = new Map<string, AdaptedSet[]>();
  const notMass: string[] = [];
  for (const s of usable) {
    if (referenceGrams(s) === null) {
      notMass.push(s.per === "serving" ? (s.perUnit === "ml" ? "a per-serving entry is measured in ml" : "a per-serving entry has no gram weight") : "an entry is per 100 ml");
      continue;
    }
    const key = `${s.source}|${s.preparation}`;
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }
  const conflicts: OffConflict[] = [];
  const conflictGroups: string[] = [];
  const compared = new Set<string>();
  let pairs = 0;
  for (const [key, sets] of groups) {
    let groupConflict = false;
    for (let i = 0; i < sets.length; i++)
      for (let j = i + 1; j < sets.length; j++) {
        pairs++;
        const r = compareSets(sets[i], sets[j]);
        r.compared.forEach((c) => compared.add(c));
        if (r.conflicts.length) { conflicts.push(...r.conflicts); groupConflict = true; }
      }
    if (groupConflict) conflictGroups.push(key);
  }
  const comparedList = [...compared];

  if (conflicts.length) {
    const [key] = conflictGroups;
    const entries = groups.get(key)!.map((s) => entryRef(s)!);
    const [source, preparation] = key.split("|") as [string, OffPreparation];
    let blockReason: string | undefined;
    if (conflictGroups.length > 1)
      blockReason = "Conflicting values appear in more than one source or preparation state, so MoodMeal can't offer one clear choice.";
    else if (n.schemaIssues.length)
      blockReason = `Some entries couldn't be read (${n.schemaIssues.join("; ")}), so not every conflict can be checked.`;
    else if (entries.length > MAX_RESOLUTION_ENTRIES)
      blockReason = `There are ${entries.length} competing entries, more than MoodMeal can present as a clear choice.`;
    return {
      status: "conflict",
      reason: `${conflicts.length} material conflict${conflicts.length === 1 ? "" : "s"} between package entries, beyond label rounding.`,
      conflicts, compared: comparedList,
      group: { source, preparation, entries },
      resolvable: !blockReason,
      ...(blockReason ? { blockReason } : {}),
    };
  }
  if (n.schemaIssues.length)
    return { status: "unverifiable", reason: `Couldn't fully check this record for conflicting values: ${n.schemaIssues.join("; ")}.`, conflicts: [], group: null, resolvable: true, compared: comparedList };
  if (pairs && compared.size)
    return { status: "consistent", reason: "Package entries agree within label rounding.", conflicts: [], group: null, resolvable: true, compared: comparedList };
  const groupSizes = [...groups.values()].map((g) => g.length);
  const why = pairs ? "the entries share no exact nutrient values to compare"
    : groups.size > 1 && groupSizes.every((s) => s === 1) ? "entries come from different sources or preparation states"
    : notMass[0] ?? "there is only one package entry";
  return { status: "not-comparable", reason: `No consistency comparison was possible: ${why}.`, conflicts: [], group: null, resolvable: true, compared: [] };
}

/** Plain-language summary of one conflict between two entries. */
export function describeConflict(c: OffConflict): string {
  const f = (v: number) => (c.unit === "KCAL" ? `${Number(v.toFixed(0))} kcal` : `${Number(v.toFixed(2))} g`);
  const basis = (e: EntryRef) => (e.per === "100g" ? "per 100 g" : `per ${e.referenceGrams} g serving`);
  return `${c.label}: entry ${c.a.setIndex + 1} (${f(c.a.value)} ${basis(c.a)}) would be ${f(c.expectedB)} ${basis(c.b)}, but entry ${c.b.setIndex + 1} says ${f(c.b.value)}.`;
}
