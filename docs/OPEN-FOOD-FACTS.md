# Open Food Facts barcode lookup (Nutrition Calculator)

Added 2026-10-15. Code: `src/lib/openFoodFacts.ts` (lookup and product mapping), `src/lib/offNutritionAdapter.ts` (v3.5 schema adapter and consistency check), `src/components/ProductLookup.tsx`, and the calculator integration in `src/lib/nutritionCalculator.ts` and `src/pages/NutritionCalculatorPage.tsx`.

## What it does

- **Lookup:** one explicit, read-only request per barcode button press: `GET https://world.openfoodfacts.org/api/v3.5/product/{barcode}?fields=…`. This uses API v3.5 since 2026-10-16; it was v3 before. There is no camera scanning, no account, and nothing is ever written to Open Food Facts.
- **Barcodes:** EAN-8, UPC-A (12), EAN-13 and GTIN-14, with the GS1 check digit verified. The code is kept as a string, so leading zeros are preserved. Spaces and hyphens are ignored. Open Food Facts may normalize a code (for example, adding a leading zero to a UPC-A); MoodMeal shows the server's code.
- **Lookup states:**
  - loading, product found, not found (HTTP 404 or `result.id = product_not_found`);
  - timeout (10 s), network error;
  - rate limited (HTTP 429/503), other HTTP error, or unexpected response.

  A lookup is never retried automatically.
- **Preview:** shows name, brand, barcode, package size, nutrition basis, serving (when known), and the Open Food Facts values. The values appear per 100 g, plus a scaled per-serving column when a gram serving is known. It also shows any conflict warning, ingredients, allergens and traces, a link to the product page, and attribution. A product joins the calculator only after the user presses **Add to calculator**.
- **Labelling:** product rows say "Open Food Facts product data". Results say "Estimate from mixed sources" when USDA foods and products are combined, or "Estimate from Open Food Facts product data" when only products are used. Each ingredient's provenance appears in the expandable calculation details.
- **Nothing is stored:** lookups, the session cache and calculator inputs live in memory only. No localStorage key is added, and products are never approved, published or added to the USDA list (still 17 foods) or to recipes.

## Nutrition rules (v3.5 `nutrition` schema)

- **Source of values:** values come from `nutrition.aggregated_set`. Each nutrient there has `value`, `unit`, `source`, `source_per` and an optional `modifier`, and the set's `per` (100g / 100ml / serving) is explicit.
  - The legacy v3 `nutriments` fields are not requested or read; v3.5 no longer returns them.
  - The v3.5 top-level `nutrition_data_per` can disagree with the aggregated set, so it isn't used.
- **Grams:** allowed only when the aggregated set is per 100 g **and** the product is sold by weight.
  - Volume units (ml, cl, dl, l, fl oz) on the product or the serving, or `per: "100ml"`, mark the product per 100 ml. Those products are not calculable, and no density is assumed. Older records can still carry per-100 g values for liquids: a 1.5 L water on staging had nutrition "per 100 g" with `product_quantity_unit: "ml"`.
  - If the product's unit is unknown, the basis is "unclear" and the product is not calculable.
- **Product serving:** offered only with an explicit gram weight: `serving_quantity` with `serving_quantity_unit: "g"`, or a `serving_size` that states the same grams. Never from ml.
- **Per-serving products:** labels that give nutrition per serving can be added only by the serving, and only with a gram weight. The result equals servings × label values.
- **Explicit mapping** (first usable key wins):

  | Calculator nutrient | Open Food Facts v3.5 key(s) |
  |---|---|
  | Calories | `energy-kcal`, then `energy-kj`, then `energy` |
  | Protein | `proteins` |
  | Carbohydrates | `carbohydrates-total` (includes fiber), then `carbohydrates` |
  | Fat | `fat` |
  | Fiber | `fiber` |
  | Total sugars | `sugars` |

- **Units** are converted explicitly from each entry's `unit`: g as is, mg ÷ 1000, µg ÷ 1,000,000, kcal as is, kJ ÷ 4.184 (the conversion is noted). Any other unit is refused (null, with the reason shown).
- **Missing values:** missing keys stay null and the nutrient is labelled "Not recorded". Recorded zeros stay zero.
- **Inexact values:** values with a modifier (`<`, `~`, …) and non-numeric values become null, with the reason shown.
- **Estimates ignored:** entries whose `source` is `estimate` (computed from ingredients, not from the package) are never used. A per-100 g value that Open Food Facts converted from a per-serving entry (`source_per: "serving"`) is accepted as given.
- **Incomplete totals:** any null makes that nutrient's total Unknown, with "Incomplete: no recorded value for …".
- **Carbohydrates:** `carbohydrates-total` is labelled "Total carbohydrate, including fiber", which matches USDA "carbohydrate, by difference". Plain `carbohydrates` follows the product label, and a note says some labels exclude fiber.
- **Allergens:**
  - Recorded allergens and traces are listed.
  - An empty or missing list reads "Not recorded. This does not mean the product is free of them."
  - `en:none` reads "None recorded … Always check the package."
- **Safe rendering:** API text is rendered as plain React text (never as HTML) and truncated. Product links are built from the barcode, never taken from API URLs.

## Nutrition-basis conflict detection (2026-10-16)

**Schema (official Product-Nutrition v3.5 docs):**
- `aggregated_set` is read-only. It is computed from the input sets in source priority: manufacturer, packaging, USDA, estimate.
- Each input set is defined by its source, its `preparation` (`as_sold` / `prepared`) and its `per` (`100g` / `100ml` / `serving`).
- Each nutrient entry has `value_string` (as entered), `value`, `value_computed` (system-derived), `unit` (a free string) and an optional `modifier` (`< <= ~ >= >`).
- The docs ask clients to tolerate unexpected nutrient keys.
- The rendered docs don't define `per_quantity` / `per_unit`. Their meaning here (for example 103 / "g" for a serving set) comes from real records.

**Adapter (`src/lib/offNutritionAdapter.ts`, testable on its own):**
- `adaptNutrition` normalizes `per`, `preparation`, `per_unit` and `per_quantity`, so variants like "100 g", "SERVING", "G" and "103" are handled. Unknown nutrient keys and extra fields are ignored.
- Missing or unexpected set fields become **schema issues** instead of being skipped. For example: an unexpected basis, a missing preparation, an invalid reference quantity, missing or non-list input sets.
- `readEntry` / `readMapped` convert units explicitly (g, mg, µg, kcal, kJ). They keep null distinct from zero, exclude modifiers and `source: "estimate"` entries, and record each value's **declared precision** from `value_string` ("12" means ±0.5; "11.7" means ±0.05).

**When sets are compared (`checkConsistency`):** a per-100 g set (g) is compared with a per-serving set only when:
- both sets have the **same source** and the **same preparation state** (as-sold with as-sold, prepared with prepared);
- the serving set states its **weight in grams** (`per_unit: "g"` with a `per_quantity`).

These are never compared:
- estimate sets;
- sets from different sources or preparation states;
- serving sets measured in ml or without a gram weight.

Only nutrients present as exact values in both sets are compared.

**Tolerance:**
- For each side, the allowance is the larger of half the US label rounding step (21 CFR 101.9) and the value's declared precision. The rounding steps:
  - calories: 5 kcal (2.5 at or below 50 kcal);
  - fat: 0.25 g below 5 g, otherwise 0.5 g;
  - other nutrients: 0.5 g.
- The per-100 g side's allowance is scaled to the serving weight.
- A nutrient is a **material conflict** only when the scaled per-100 g value and the per-serving value differ by more than both allowances combined. Identical rounded values are not treated as proof of an error. For example, 12 g per 100 g and 12 g per 103 g are consistent, because 12.36 g rounds to 12 g.

**Statuses:**

| Status | Meaning | What the user sees |
|---|---|---|
| `conflict` | At least one material conflict | The resolution panel (below) |
| `consistent` | A comparable pair agreed | A short green note |
| `not-comparable` | Nothing could be compared, with the reason (one entry only, no serving weight, ml serving, different source or preparation, no shared exact values) | A grey note |
| `unverifiable` | Schema issues prevented a full check, with the issues listed | An amber note asking the user to compare with the package |

A conflict found in a comparable pair is still reported even when other sets have schema issues.

**When there's a conflict:**
- The preview shows **"Conflicting source nutrition values."** It explains the two bases (source, preparation, per 100 g vs per N g serving) and shows both entries side by side, with the per-100 g entry scaled to the serving weight. Conflicting nutrients are marked.
- The usual values table is hidden.
- **The product can't be added until the user explicitly chooses** which entry matches their package. Choosing the **per-serving entry** offers servings only, using the values as entered. Choosing the **per-100 g entry** offers grams and the serving, and needs weight evidence for the product.
- For volume products, neither entry can be chosen, because no density is assumed.
- Nothing is selected, averaged or corrected automatically. Without a choice, `productFood` returns null and `per100gNutrients` returns only nulls.
- The chosen entry is labelled on the ingredient row ("you chose the Per-serving entry (103 g, packaging)"), on each conflicting nutrient in the results, and in the calculation details ("The other entry was not used").

**Not changed:** consistent and single-entry records behave as before: grams for per-100 g products sold by weight, servings only with a gram weight, liquids and unclear bases blocked. The 17 USDA foods, catalog approvals, published nutrition and FatSecret are untouched, and everything stays in memory only.

## Licensing and API terms (reviewed 2026-10-15)

- **Database:** Open Database License (ODbL). **Individual contents:** Database Contents License (DbCL). **Images:** CC BY-SA. MoodMeal doesn't use OFF images.
- **Attribution:** OFF requires attribution with a link to openfoodfacts.org (or the product page). It appears in every preview and in the results' Sources section: "Product data from Open Food Facts (openfoodfacts.org), available under the Open Database License", with links to openfoodfacts.org, the ODbL text and the product page.
- **Accuracy:** OFF data comes with no guarantee of accuracy and "must not be used for medical purposes". MoodMeal labels it as crowd-sourced, unreviewed and not medical advice.
- **Rate limit:** 15 product reads per minute per IP (HTTP 503 if the global limit is hit). The app looks up only on a button press, never retries, caches found and not-found results for the session, and limits itself to 10 lookups per minute with at least 3 s between them. After a 429/503 it waits for `Retry-After`. Because OFF doesn't expose that header to browsers via CORS, the app waits 60 s.
- **Identification:** OFF asks for a custom User-Agent like `AppName/Version (ContactEmail)`. Browsers can't set User-Agent, so the app sends `X-User-Agent: MoodMeal/0.1.0 (web)`, which OFF's CORS policy allows. A live browser lookup confirmed it.
- **Environments:** OFF recommends its staging server (`world.openfoodfacts.net`) for testing. Automated tests are fully mocked. Live verification used 3 staging requests and 3 production reads.

## Unresolved before a public deployment

1. **Contact identification:** add a project contact (email or URL) to the app identifier, as OFF requests. None has been chosen, so none is included.
2. **OFF API usage form:** OFF asks API users to fill it out. It hasn't been submitted.
3. **ODbL share-alike:** displaying looked-up data with attribution is fine. Storing products, caching them across sessions, or publishing them to MoodMeal's catalog would create a derived database that must be shared under ODbL. That needs a legal and product decision before any persistence.
4. **Medical use:** keep OFF data away from the health-condition tools and treat it as informational only.
5. **Proxy or caching server:** a server-side proxy would allow a real User-Agent, shared caching and better rate-limit handling. Not needed for the current static app.
6. **Real-device testing:** check the lookup UI with iOS Safari and Android Chrome.

## Investigation: mixed-basis source record (barcode 0810111890373, 2026-10-16)

The product is Momofuku Sesame Miso Noodles, entered as 810111890373. Open Food Facts normalizes the code to 0810111890373 and returns a `different_normalized_product_code` warning; MoodMeal keeps the server's code. The package lists nutrition **per 1 pack (103 g)**: 360 kcal, 12 g protein, 60 g carbohydrates, 8 g fat, 1 g fiber, 7 g total sugars, 5 g added sugars, 1120 mg sodium.

**Cause: the Open Food Facts record is internally inconsistent. MoodMeal's mapping is not the cause.**

Evidence, from 4 read-only requests, with responses kept only in the local scratchpad:
- The record declares `nutrition_data_per: "100g"` and a serving of `1 pack (103 g)`, with `serving_quantity` 103 g. Its last editor was `macrofactor`, an app import.
- The v3.5 `nutrition.input_sets` show two "packaging" sets with the **same** protein, carbs, fat, fiber, sugars and sodium: 12 / 60 / 8 / 1 / 7 g / 1.12 g. One set is per 100 g; the other is per 103 g serving.
  - Only energy (349.51 vs 360 kcal) and added sugars (4.85 vs 5 g) were rescaled between the two.
  - So the per-100 g set copies the per-pack label values for most nutrients. Both can't be true: 60 g per 103 g is 58.3 g per 100 g.
- The aggregated per-100 g set, and therefore the legacy `_100g` fields MoodMeal reads, comes from that per-100 g set. The legacy `_serving` fields are then derived by × 1.03 (12.4, 61.8, 8.24 …), so they don't match the entered per-serving values either.
- Open Food Facts also flags `serving-quantity-over-product-quantity`: the 103 g serving is more than the 3.62 oz (102.6 g) package.

**MoodMeal's handling:**
- The mapper reproduces the aggregated values exactly.
- "350 kcal" is display rounding of 349.51.
- The calculator scales correctly: one 103 g pack gives 360 kcal (matching the label), but 12.36 / 61.8 / 8.24 / 1.03 / 7.21 g for the other nutrients (3% above the label).
- MoodMeal does not correct the record and has no product-specific handling.

| Nutrient | Package label, per pack (103 g) | OFF `_100g` (used by MoodMeal) | OFF `_serving` (derived) | OFF input set per 100 g | OFF input set per serving (103 g) | MoodMeal 100 g | MoodMeal 1 pack (103 g) | MoodMeal ½ pack (51.5 g) | Label ÷ 1.03 (implied per 100 g, from rounded label) |
|---|---|---|---|---|---|---|---|---|---|
| Calories | 360 kcal | 349.51 (shown 350) | 360 | 349.51 | 360 | 349.5 | 360 | 180 | 349.5 |
| Protein | 12 g | 12 | 12.4 | 12 | 12 | 12 | 12.36 | 6.18 | 11.65 |
| Carbohydrates | 60 g | 60 | 61.8 | 60 | 60 | 60 | 61.8 | 30.9 | 58.25 |
| Fat | 8 g | 8 | 8.24 | 8 | 8 | 8 | 8.24 | 4.12 | 7.77 |
| Fiber | 1 g | 1 | 1.03 | 1 | 1 | 1 | 1.03 | 0.515 | 0.97 |
| Total sugars | 7 g | 7 | 7.21 | 7 | 7 | 7 | 7.21 | 3.605 | 6.80 |
| Added sugars | 5 g | 4.85 | 5 | 4.85 | 5 | not mapped | — | — | 4.85 |
| Sodium | 1120 mg | 1.12 g | 1.15 g | 1.12 g | 1.12 g | not mapped | — | — | 1.09 g |

**Change made (general, not product-specific):**
- The preview's table is now titled "Open Food Facts values" instead of "Label values", which wrongly implied they came from the package.
- When a gram serving is recorded, the table adds a **Per serving (N g)** column scaled from the per-100 g values, so users can compare directly with a per-serving package label. For this record it shows 360 kcal, 12.36 g protein and 61.8 g carbs per pack, which makes the mismatch visible.
- A note asks users to compare with their package and states that records are shown as recorded and not corrected.

**Follow-up done (2026-10-16):** the mapper now uses API v3.5 (`nutrition.aggregated_set`) and the adapter checks the input sets for conflicts. The product now requires the user to choose an entry before it can be added. This record flags **carbohydrates**: 60 g per 100 g would be 61.8 g per 103 g, but the per-serving entry says 60 g. Protein, fat, fiber, sugars and calories match their per-serving entries within label rounding, so they aren't flagged, although they were also copied. Calculated values are unchanged and are not corrected. The source record was not edited: MoodMeal never writes to Open Food Facts, and a contributor can correct it on openfoodfacts.org.
