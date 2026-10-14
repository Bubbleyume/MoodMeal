# Local USDA API review tool

## Classified comparisons

Comparisons retain every field difference and group it into material nutrient, portion, identity/preparation, missing/new value, metadata, or empty-category differences. Only the six explicitly recognized category IDs with matching names, null amounts and no nutrient-row evidence qualify as empty categories. Other null-valued nutrient records are never filtered out.

Summary counts are field differences, not food/nutrient counts. Material includes nutrient, missing-value, portion and identity/preparation differences; the corresponding detail counts are subsets and must not be added again. Informational includes metadata and empty categories. A clean nutritional comparison requires zero material differences. An exact compared-fields match requires zero differences of any kind; it is not a byte-for-byte comparison of all API and CSV metadata.

Saved live blueberry response rechecked offline on 2026-10-14: 13 total differences, 0 material, 13 informational (12 category fields plus publication date formatting: 4/1/2019 versus 2019-04-01). Missing-value, portion and preparation-state differences: all zero. Original response/report and retained approved records preserved. Twelve Python tests cover the expanded classification, including meaningful nulls and nonempty category IDs.

Run with Python 3 using the standard library only. No frontend or server changes are required. The tool reads FDC_API_KEY only from its process environment; it never reads the Windows registry itself. Do not pass a key as a command argument or paste it into a report.

## First authenticated comparison (run locally in PowerShell)

```powershell
Set-Location 'C:\Users\Shakh\Downloads\MoodMeal\moodmeal'
$env:FDC_API_KEY = [Environment]::GetEnvironmentVariable('FDC_API_KEY', 'User')
if ([string]::IsNullOrWhiteSpace($env:FDC_API_KEY)) { throw 'FDC_API_KEY is not configured for this Windows user.' }
python docs/usda/fdc_review.py fetch 171711 --expected-state raw --compare-pilot
```

This loads the existing Windows user variable into the local process without displaying it. It requests one exact record and compares descriptions, data type, preparation tokens, nutrient presence/amounts/normalized units, and portion presence/amounts/weights/labels/unit IDs with pilot-source-records.json. The comparison does not overwrite that file. Retrieval/publication metadata and the complete response are retained for review. API and CSV snapshots can legitimately differ; every difference needs interpretation.

The output gives a pending report path and difference count. Share that report for review, never your key. Reports live in docs/usda/pending-review/, outside public/ and dist/, and are Git-ignored. Each run writes a new file. No approval or publication command exists.

## Candidate search

```powershell
python docs/usda/fdc_review.py search 'blueberries raw'
```

Search returns up to 15 candidates, restricted to Foundation, SR Legacy and Survey (FNDDS). Use --include-branded only when explicitly needed. Fetch each chosen FDC ID separately. Search results are discovery data, never nutrition-calculation inputs.

## Boundaries and security

- Fixed HTTPS USDA host, redirects disabled, 20-second request timeout, 10 MB response cap. Rate-limit errors stop with a safe message; no automatic retry storm.
- Error bodies, URLs and underlying exception details are suppressed. Credential echoes are redacted before serialization. The raw response is retained after this redaction.
- Missing/invalid amounts and absent measurement weights remain null; real zero remains zero. Units are normalized without silently changing quantities. Unknown units remain visible for review.
- Preparation detection is a conservative description-token check, not verified culinary identity. Missing or inconsistent expected state requires manual review. A matching token never approves the food.
- Existing CSV scripts, verified nutrition data and calculations are untouched. No bulk import, publication, runtime integration or storage migration.
- Pending files contain food data only. Do not move them into frontend assets or treat raw remote fields as approval decisions.

## Tests

```powershell
python -m unittest discover -s docs/usda -p test_fdc_review.py -v
```

Twelve offline tests cover null/zero handling, units, preparation mismatch, publication restrictions, CSV comparison/differences, category classification, HTTP/rate-limit/timeout sanitization, redirect prevention, mocked CLI output redaction, missing credentials and generic search filtering. The user completed the live blueberry request; its retained response was rechecked offline as described above. No other live ingredient record has yet been verified by this workflow.
