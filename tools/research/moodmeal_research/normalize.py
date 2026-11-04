"""Common nutrient record shape. Unknown stays None; a measured 0 stays 0."""
import math

REVIEW_FLAGS = {'reviewStatus': 'unreviewed-candidate', 'approved': False, 'publishable': False}


def amount(raw):
    """CSV/API amount to float. Empty, missing, non-numeric, negative or non-finite -> None."""
    if raw is None or isinstance(raw, bool):
        return None
    text = str(raw).strip()
    if text == '':
        return None
    try:
        value = float(text)
    except ValueError:
        return None
    return value if math.isfinite(value) and value >= 0 else None


def from_csv(food, definitions, nutrient_rows, portion_rows, snapshot):
    """Build a normalized record from raw CSV rows (dicts keyed by CSV header)."""
    nutrients, duplicates = {}, {}
    for row in nutrient_rows:
        nid = row['nutrient_id']
        definition = definitions.get(nid, {})
        value = {'name': definition.get('name'), 'unit': definition.get('unit_name'),
                 'amountPer100g': amount(row['amount']), 'sourceRowId': row['id']}
        if nid in nutrients or nid in duplicates:
            duplicates.setdefault(nid, [nutrients[nid]] if nid in nutrients else []).append(value)
            # Never pick one of several rows: the value becomes unknown pending review.
            nutrients[nid] = {'name': definition.get('name'), 'unit': definition.get('unit_name'),
                              'amountPer100g': None, 'sourceRowId': None,
                              'resolution': 'duplicate-id-manual-review-required'}
        else:
            nutrients[nid] = value
    return {
        'source': 'usda-csv', 'snapshot': snapshot,
        'fdcId': food['fdc_id'], 'description': food['description'], 'dataType': food['data_type'],
        'publicationDate': food['publication_date'],
        'nutrients': dict(sorted(nutrients.items(), key=lambda kv: int(kv[0]) if kv[0].isdigit() else kv[0])),
        'duplicateNutrientRows': duplicates,
        'verificationIssues': [{'type': 'duplicate-nutrient-id', 'nutrientId': nid, 'rowCount': len(rows)}
                               for nid, rows in duplicates.items()],
        'portions': [{'id': p['id'], 'amount': amount(p['amount']), 'gramWeight': amount(p['gram_weight']),
                      'modifier': p['modifier'] or None, 'portionDescription': p['portion_description'] or None,
                      'measureUnitId': p['measure_unit_id']} for p in portion_rows],
        **REVIEW_FLAGS,
    }


def compare_shape(food, definitions, nutrient_rows, portion_rows):
    """The CSV-side record shape that docs/usda/fdc_review.compare() expects."""
    nutrients = {}
    for row in nutrient_rows:
        nid = row['nutrient_id']
        definition = definitions.get(nid, {})
        nutrients[nid] = {'amountPer100g': row['amount'], 'sourceRow': row,
                          'definition': {'unit_name': definition.get('unit_name'), 'name': definition.get('name')}}
    return {'fdc_id': food['fdc_id'], 'description': food['description'], 'data_type': food['data_type'],
            'publication_date': food['publication_date'], 'nutrients': nutrients, 'portions': portion_rows}
