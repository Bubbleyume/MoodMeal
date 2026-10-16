import { useRef, useState } from "react";
import Button from "./Button";
import {
  OFF_ATTRIBUTION, createLookupLimiter, describeConflict, isCalculable, lookupProduct, previewValues, validateBarcode,
  type LookupOutcome, type OffProduct,
} from "../lib/openFoodFacts";

// Session-only: one limiter and a small cache shared while the app is open,
// so the same barcode is never requested twice and lookups stay well under
// Open Food Facts' rate limit. Nothing is stored in the browser.
const limiter = createLookupLimiter();
const cache = new Map<string, LookupOutcome>();

function amount(n: { amount: number | null; unit: string }) {
  if (n.amount === null) return "Not recorded";
  return n.unit === "KCAL" ? `${n.amount.toFixed(0)} kcal` : `${Number(n.amount.toFixed(2))} g`;
}

export function AllergenInfo({ product }: { product: OffProduct }) {
  const list = (v: string[] | "none" | null, label: string, noneText: string) => (
    <p className="mt-1">
      <strong>{label}:</strong>{" "}
      {v === null ? "Not recorded. This does not mean the product is free of them." : v === "none" ? noneText : v.join(", ")}
    </p>
  );
  return (
    <div className="mt-2 text-xs text-slate-600">
      {list(product.allergens, "Allergens recorded", "None recorded by Open Food Facts. Always check the package.")}
      {list(product.traces, "May contain (traces)", "None recorded by Open Food Facts. Always check the package.")}
      <p className="mt-1">
        <strong>Ingredients:</strong> {product.ingredientsText ?? "Not recorded."}
      </p>
    </div>
  );
}

/** Conflicting package entries in the source record: shown as recorded, never corrected. */
export function ConflictNotice({ product }: { product: OffProduct }) {
  if (!product.conflicts.length) return null;
  return (
    <div role="note" className="mt-2 rounded-xl bg-red-50 p-2 text-xs text-red-800 ring-1 ring-red-200" data-testid="off-conflicts">
      <p className="font-bold">This Open Food Facts record has conflicting values.</p>
      <ul className="mt-1 list-disc space-y-1 pl-4">
        {product.conflicts.map((c) => <li key={c.id}>{describeConflict(c)}</li>)}
      </ul>
      <p className="mt-1">
        Check your package. MoodMeal calculates from the per-100 g values as recorded and does not correct them.
      </p>
    </div>
  );
}

export function OffAttribution({ code }: { code?: string }) {
  return (
    <p className="text-xs text-slate-500">
      {OFF_ATTRIBUTION}{" "}
      <a className="text-brand-700 underline" href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer">openfoodfacts.org</a>
      {" · "}
      <a className="text-brand-700 underline" href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noreferrer">ODbL</a>
      {code ? <> · <a className="text-brand-700 underline" href={`https://world.openfoodfacts.org/product/${code}`} target="_blank" rel="noreferrer">Product page</a></> : null}
    </p>
  );
}

/**
 * Explicit, read-only barcode lookup. A product joins the calculator only
 * after the user reviews the preview and confirms it.
 */
export default function ProductLookup({ onConfirm }: { onConfirm: (product: OffProduct) => void }) {
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [outcome, setOutcome] = useState<LookupOutcome | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const requestId = useRef(0);

  const lookUp = async () => {
    setNotice(null);
    const valid = validateBarcode(barcode);
    if ("error" in valid) { setError(valid.error); setOutcome(null); return; }
    setError(null);
    const cached = cache.get(valid.code);
    if (cached) { setOutcome(cached); return; }
    const now = Date.now();
    const allowed = limiter.check(now);
    if (!allowed.ok) {
      setOutcome(null);
      setNotice(`To respect Open Food Facts' limits, wait ${allowed.waitSeconds} s before the next lookup.`);
      return;
    }
    limiter.record(now);
    const id = (requestId.current ?? 0) + 1;
    requestId.current = id;
    setLoading(true);
    setOutcome(null);
    const result = await lookupProduct(valid.code);
    if (id !== requestId.current) return;
    if (result.status === "rate-limited") limiter.block(Date.now(), result.retryAfterSeconds);
    if (result.status === "found" || result.status === "not-found") cache.set(valid.code, result);
    setOutcome(result);
    setLoading(false);
  };

  const cancel = () => { requestId.current = (requestId.current ?? 0) + 1; setOutcome(null); setLoading(false); };
  const product = outcome?.status === "found" ? outcome.product : null;

  return (
    <section className="card" aria-labelledby="off-heading">
      <h2 id="off-heading" className="section-title">Look up a packaged product</h2>
      <p className="mt-1 text-xs text-slate-600">
        Uses Open Food Facts, a crowd-sourced product database. Product data is not reviewed by MoodMeal.
      </p>
      <form
        className="mt-3"
        onSubmit={(e) => { e.preventDefault(); if (!loading) void lookUp(); }}
      >
        <label htmlFor="off-barcode" className="block text-sm font-semibold text-slate-700">Barcode (EAN or UPC)</label>
        <div className="mt-1 flex gap-2">
          <input
            id="off-barcode"
            className="well-input mt-0 min-w-0 flex-1"
            inputMode="numeric"
            autoComplete="off"
            value={barcode}
            onChange={(e) => { setBarcode(e.target.value); setError(null); }}
            placeholder="e.g. 0123456789012"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "off-barcode-error" : "off-barcode-help"}
          />
          <Button type="submit" disabled={loading} className="shrink-0">
            {loading ? "Looking up…" : "Look Up"}
          </Button>
        </div>
        <p id="off-barcode-help" className="mt-1 text-xs text-slate-500">8, 12, 13 or 14 digits. Leading zeros are kept.</p>
        {error && <p id="off-barcode-error" className="mt-1 text-xs font-semibold text-red-700">{error}</p>}
      </form>

      <div role="status" aria-live="polite" className="mt-2 text-sm text-slate-700">
        {loading && <p>Looking up the product on Open Food Facts…</p>}
        {notice && <p>{notice}</p>}
        {outcome?.status === "not-found" && <p>No product with barcode {outcome.code} was found on Open Food Facts.</p>}
        {outcome?.status === "timeout" && <p>Open Food Facts didn't respond in time. Try again in a moment.</p>}
        {outcome?.status === "network-error" && <p>Couldn't reach Open Food Facts. Check your connection and try again.</p>}
        {outcome?.status === "rate-limited" && (
          <p>Open Food Facts is limiting requests right now. Wait about {outcome.retryAfterSeconds} s before trying again.</p>
        )}
        {outcome?.status === "error" && <p>Lookup failed: {outcome.message}</p>}
      </div>

      {product && (
        <div className="mt-3 rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-200" data-testid="off-preview">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Open Food Facts product data</p>
          <p className="mt-1 text-base font-bold text-slate-800">{product.name ?? "Unnamed product"}</p>
          <p className="text-sm text-slate-700">{product.brand ?? "Brand not recorded"}</p>
          <dl className="mt-2 grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-xs text-slate-700">
            <dt className="font-semibold">Barcode</dt><dd>{product.code}</dd>
            <dt className="font-semibold">Package</dt><dd>{product.quantity ?? "Not recorded"}</dd>
            <dt className="font-semibold">Nutrition basis</dt><dd>{product.basisLabel}</dd>
            {product.servingLabel && (<><dt className="font-semibold">Serving</dt><dd>{product.servingLabel}</dd></>)}
          </dl>
          {product.basis !== "none" && (() => {
            const table = previewValues(product);
            return (
              <>
                <table className="mt-2 w-full text-xs" data-testid="off-values">
                  <caption className="text-left font-semibold text-slate-700">Open Food Facts values</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="py-0.5 text-left font-normal text-slate-500">Nutrient</th>
                      {table.columns.map((c) => (
                        <th key={c} scope="col" className="py-0.5 pl-2 text-right font-semibold">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((r) => (
                      <tr key={r.id}>
                        <th scope="row" className="py-0.5 text-left font-normal">{r.label}</th>
                        {r.values.map((v, i) => (
                          <td key={i} className="whitespace-nowrap py-0.5 pl-2 text-right">{amount({ amount: v, unit: r.unit })}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-1 text-xs text-slate-600">
                  Compare these with your package. Open Food Facts records are crowd-sourced and can contain entry
                  errors; MoodMeal shows them as recorded and does not correct them.
                </p>
              </>
            );
          })()}
          <ConflictNotice product={product} />
          <p className={`mt-2 text-xs font-semibold ${isCalculable(product) ? "text-moodGreen-700" : "text-red-700"}`}>{product.calculation}</p>
          <AllergenInfo product={product} />
          <div className="mt-2"><OffAttribution code={product.code} /></div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              disabled={!isCalculable(product)}
              onClick={() => { onConfirm(product); setOutcome(null); setBarcode(""); }}
            >
              Add to calculator
            </Button>
            <Button variant="ghost" onClick={cancel}>Cancel</Button>
          </div>
        </div>
      )}
    </section>
  );
}
