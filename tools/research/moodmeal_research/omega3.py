"""Omega-3 evidence for food tags: omega-3 rule review, option B (owner decisions 2026-11-06).

Two paths at MoodMeal's 0.16 g criterion, calculated separately so ALA is never counted twice:
ALA alone, or the complete ALA + EPA + DPA + DHA sum. A component that is unreported or not
eligible leaves its path unknown (None), never zero; a reported zero stays zero.

Eligibility (K1): the derivation code comes first. A, AI and AR qualify; any other code does not,
whatever its data points. A row with no code qualifies only with data points > 0, and is flagged.

The criterion is applied to unrounded amounts. Rounding is for display only.
"""

RULE_GRAMS = 0.16
MEASURED_CODES = frozenset({'A', 'AI', 'AR'})
EPA, DPA, DHA = '1278', '1280', '1272'


def component(row, derivation_codes, nutrient_id):
    """Classify one CSV food_nutrient row (a dict keyed by the CSV header), or None when absent."""
    if row is None or row.get('amount', '') == '':
        return {'nutrientId': nutrient_id, 'amountPer100g': None, 'evidence': 'not reported'}
    code = derivation_codes.get(row['derivation_id']) if row.get('derivation_id') else None
    points = int(row['data_points']) if row.get('data_points') not in ('', None) else 0
    if code:
        evidence = 'measured' if code in MEASURED_CODES else 'not measured'
    else:
        evidence = 'no code, data points' if points > 0 else 'not measured'
    return {'nutrientId': nutrient_id, 'amountPer100g': float(row['amount']), 'evidence': evidence,
            'derivationCode': code, 'dataPoints': points, 'sourceRowId': row['id']}


def usable(c):
    return c['amountPer100g'] is not None and c['evidence'] in ('measured', 'no code, data points')


def components(rows, derivation_codes):
    """ALA (1404, or 1270 when 1404 is absent), EPA, DPA and DHA for one record's rows {nutrient_id: row}."""
    ala_id = '1404' if rows.get('1404') and rows['1404'].get('amount', '') != '' else '1270'
    return ala_id, {'ALA': component(rows.get(ala_id), derivation_codes, ala_id),
                    'EPA': component(rows.get(EPA), derivation_codes, EPA),
                    'DPA': component(rows.get(DPA), derivation_codes, DPA),
                    'DHA': component(rows.get(DHA), derivation_codes, DHA)}


def per_100g(parts):
    """Unrounded per-100 g amounts on each path; None when the path is unknown."""
    ala = parts['ALA']['amountPer100g'] if usable(parts['ALA']) else None
    combined = sum(c['amountPer100g'] for c in parts.values()) if all(usable(c) for c in parts.values()) else None
    return ala, combined


def meets(amount, bar=RULE_GRAMS):
    """The criterion on an unrounded amount; unknown never meets."""
    return amount is not None and amount >= bar


def tag_path(records, bar=RULE_GRAMS):
    """The path every record meets on, from unrounded per-reference-amount values; combined first.

    `records` is a list of {'ala': float | None, 'combined': float | None} per reference amount, unrounded.
    Returns 'combined', 'ala' or None.
    """
    if records and all(meets(r['combined'], bar) for r in records):
        return 'combined'
    if records and all(meets(r['ala'], bar) for r in records):
        return 'ala'
    return None


def display(amount):
    """Rounded for display (2 decimals); None stays None."""
    return None if amount is None else round(amount, 2)
