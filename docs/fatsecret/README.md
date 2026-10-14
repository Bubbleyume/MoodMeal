# FatSecret temporary development research

## Temporary comparison interface

The food overview keeps both source IDs, descriptions and preparation-state clues visible; identity still requires manual confirmation. Nutrients and Serving sizes tabs separate per-100-g comparisons from household portion conflicts. The nutrient table has readable classifications and a summary for the selected serving basis (not an aggregate that counts each nutrient repeatedly). A direct 100-g serving is preferred when available; all other serving bases remain selectable.

Technical details are collapsed initially and retain original values, intervals and methods in memory. Source attribution and a live 15-minute countdown remain visible. Both missing amounts, or either missing amount, report missing nutrient data before testing units. Unknown units are distinguished from genuinely incompatible known units. The existing idempotent close handler cancels the countdown and expiry callbacks.

Regression checks use synthetic records in real Tk windows, including resizing, table content, serving discrepancies, detail expansion, basis changes and expiry. No live API response is used as a fixture.

## Precision-aware nutrient comparison

Original numeric strings (including trailing decimal zeros) are retained in memory. Numeric JSON tokens are parsed as strings too. Each nonnegative reported nutrient amount is modeled as nearest rounding to its last reported digit: value ± half that digit's unit, with a lower bound of zero. For a serving, both interval ends are scaled by 100 / declared grams. USDA per-100-g intervals use the retained source's reported precision. The declared serving weight is held fixed, not treated as a fuzzy weight interval. This is a transparent rounding model, not proof of laboratory accuracy or of the source's rounding policy; serialized trailing zeros may not represent measurement precision.

Overlapping intervals yield equivalent-within-precision; nonoverlap yields meaningful-discrepancy. Intervals merely touching at a boundary are conservatively non-equivalent. Missing amounts, invalid/zero weights, volume-only servings and unit mismatches yield missing-or-incomparable. Decimal arithmetic avoids floating-point noise. exactMatch is separately true/false for comparable values and null when incomparable. No universal percentage tolerance is used. Source values, intervals and derivation flags are shown; no value is replaced.

Portion weights are independently compared without nutrient rounding allowances. Food identity/preparation remains unconfirmed until manual review. Tests use synthetic data only; no live response or report is saved. Twenty-two FatSecret tests cover rounding, genuine differences, nulls, units, weights, credential handling and Tk lifecycle.

Window lifecycle fix: one Tk root is kept from initialization through display. Manual closure, timeout and final cleanup use an idempotent handler which cancels after callbacks, processes pending idle/theme work while widgets still exist, and destroys once. The 15-minute expiration is unchanged. Regression tests include real Tk/ttk subprocess checks for manual and timed closure without stderr theme errors (requires a graphical Windows session).

Python standard library plus Tk (included with normal Windows Python installers). No frontend imports, data exports, response files, token cache or recipe publishing. USDA remains primary. Search returns one page of up to ten records; fetch retrieves one exact ID. The client makes at most three HTTP requests per process and never automatically retries denied/rate-limited requests.

## Local Windows test

```powershell
Set-Location 'C:\Users\Shakh\Downloads\MoodMeal\moodmeal'
$env:FATSECRET_CLIENT_ID = [Environment]::GetEnvironmentVariable('FATSECRET_CLIENT_ID', 'User')
$env:FATSECRET_CLIENT_SECRET = [Environment]::GetEnvironmentVariable('FATSECRET_CLIENT_SECRET', 'User')
python docs/fatsecret/fatsecret_review.py fetch 35761 --usda-id 171711
```

The Python client reads only its process environment. The PowerShell assignments load existing user variables without displaying them. Do not paste credentials, run with a network-debug logger, or record/screenshot the data display. Live authentication must run on the user's registered/allowed development IP; it has not been tested here.

Search command: `python docs/fatsecret/fatsecret_review.py search blueberries`. Default OAuth scope is basic. If the account specifically grants premier and requires it, use `python docs/fatsecret/fatsecret_review.py --scope premier search blueberries`. Permission failures stop; the client never escalates scope automatically. Official search documentation has premier-scoped options; actual account permissions must be confirmed.

Results open in a temporary native window with clickable attribution. The window has no export and disables copy shortcuts; it closes after fifteen minutes. Tokens are discarded before display. Closing ends the process. The client does not write nutritional content to disk/stdout. Python/OS memory paging, crash dumps or user recording cannot be guaranteed absent; do not treat this as secure memory erasure. No persistent cache is implemented, even though the terms discuss a limited refresh period.

Nutrients remain associated with each original serving; per-100-g conversion requires a positive gram weight. Milliliters are not grams. Missing fields stay null. All serving variants are shown so rounding or inconsistent servings are not hidden. Cup comparisons require matching household measure and count. Food identity/preparation must still be manually confirmed; separate source IDs are never treated as proof of equivalence. Comparison supports only retained reviewed USDA pilot records. No winner is selected.

## Licensing boundaries

Development/testing only, no dietary advice. Do not use this client to populate the app's permanent library or produce published recommendations. Account-specific written permission is still needed to clarify intended recommendation use, storage and publication. Free-tier attribution, IP configuration, API scopes and limits still apply. No automated bulk extraction. Persistent content or derived comparisons remain disabled.

Official references checked 2026-10-14:
- https://platform.fatsecret.com/terms
- https://platform.fatsecret.com/docs/guides/storable-data
- https://platform.fatsecret.com/attribution
- https://platform.fatsecret.com/docs/guides/authentication/oauth2
- https://platform.fatsecret.com/docs/v1/foods.search
- https://platform.fatsecret.com/docs/v5/food.get

Tests use invented data only: `python -m unittest discover -s docs/fatsecret -p test_fatsecret_review.py -v`.


## Validated development checkpoint

On 2026-10-14 the user confirmed successful local live comparison, readable attribution and source-specific portion conflict handling. This note records workflow validation only; no live response, nutrient amounts, serving weights or derived comparison report is retained here. Synthetic tests cover the matching behavior independently.

Checkpoint scope: this directory only. Storage, importing, publication and recommendation use remain disabled pending written licensing clarification. The shared AI_HANDOFF.md has unrelated pending work and is intentionally excluded from this checkpoint.

Validation: 22 FatSecret tests, 14 USDA tests, 19 knowledge tests, avatar tests, TypeScript and build passed. Build emitted an outdated Browserslist database warning. No live API call was made during checkpoint review.
