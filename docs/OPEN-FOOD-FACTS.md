# Open Food Facts barcode lookup (Nutrition Calculator)

Added 2026-10-15. Code: `src/lib/openFoodFacts.ts`, `src/components/ProductLookup.tsx`, and the calculator integration in `src/lib/nutritionCalculator.ts` and `src/pages/NutritionCalculatorPage.tsx`.

## What it does

- **Lookup:** one explicit, read-only request per barcode button press: `GET https://world.openfoodfacts.org/api/v3/product/{barcode}?fields=…`. There is no camera scanning, no account, and nothing is ever written to Open Food Facts.
- **Barcodes:** EAN-8, UPC-A (12), EAN-13 and GTIN-14, with the GS1 check digit verified. The code is kept as a string, so leading zeros are preserved. Spaces and hyphens are ignored.
- **Lookup states:**
  - loading, product found, not found (HTTP 404 or `result.id = product_not_found`);
  - timeout (10 s), network error;
  - rate limited (HTTP 429/503), other HTTP error, or unexpected response.

  A lookup is never retried automatically.
- **Preview:** shows name, brand, barcode, package size, nutrition basis, serving (when known), label values, ingredients, allergens and traces, a link to the product page, and attribution. A product joins the calculator only after the user presses **Add to calculator**.
- **Labelling:** product rows say "Open Food Facts product data". Results say "Estimate from mixed sources" when USDA foods and products are combined, or "Estimate from Open Food Facts product data" when only products are used. Each ingredient's provenance appears in the expandable calculation details.
- **Nothing is stored:** lookups, the session cache and calculator inputs live in memory only. No localStorage key is added, and products are never approved, published or added to the USDA list (still 17 foods) or to recipes.

## Nutrition rules

- **Grams:** allowed only when nutrition is recorded per 100 g **and** the product is sold by weight.
  - Open Food Facts' `_100g` fields can actually be per 100 ml for liquids. For example, a 1.5 L water on staging had `nutrition_data_per: "100g"` with `product_quantity_unit: "ml"`.
  - Volume units (ml, cl, dl, l, fl oz) on the product or the serving, or `nutrition_data_per: "100ml"`, mark the product per 100 ml. Those products are not calculable, and no density is assumed.
  - If the unit is unknown, the basis is "unclear" and the product is not calculable.
- **Product serving:** offered only with an explicit gram weight: `serving_quantity` with `serving_quantity_unit: "g"`, or a `serving_size` that states the same grams. Never from ml.
- **Per-serving products:** labels that give nutrition per serving can be added only by the serving, and only with a gram weight. The result equals servings × label values.
- **Explicit mapping:**

  | Calculator nutrient | Open Food Facts field |
  |---|---|
  | Calories | `energy-kcal`, in kcal |
  | Protein | `proteins`, in g |
  | Carbohydrates | `carbohydrates`, in g |
  | Fat | `fat`, in g |
  | Fiber | `fiber`, in g |
  | Total sugars | `sugars`, in g |

  The `_100g` / `_serving` values are in these standard units.
- **Energy:** if kcal is missing, `energy-kj` (or `energy`, which is kJ) is converted at 1 kcal = 4.184 kJ, and the conversion is noted.
- **Missing values:** missing keys stay null and the nutrient is labelled "Not recorded". Recorded zeros stay zero.
- **Inexact values:** values with a modifier (`<`, `~`, …) and non-numeric values become null, with the reason shown.
- **Estimates ignored:** `nutriments_estimated`, which OFF returns alongside the data, is never used.
- **Incomplete totals:** any null makes that nutrient's total Unknown, with "Incomplete: no recorded value for …".
- **Carbohydrates:** these follow each product's label, and some labels exclude fiber. A note says they may not match USDA "carbohydrate, by difference".
- **Allergens:**
  - Recorded allergens and traces are listed.
  - An empty or missing list reads "Not recorded. This does not mean the product is free of them."
  - `en:none` reads "None recorded … Always check the package."
- **Safe rendering:** API text is rendered as plain React text (never as HTML) and truncated. Product links are built from the barcode, never taken from API URLs.

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
