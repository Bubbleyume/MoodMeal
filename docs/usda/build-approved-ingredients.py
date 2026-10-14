"""Build src/data/usda/approved-ingredients.json from user-approved decisions.

Nutrients come from the retained FoodData Central CSV snapshot (the same
source as the pilot) and must match the saved pending-review API report
exactly; any disagreement stops the build. Missing values stay null.
Approving an ingredient does not publish recipe totals.
Run: python -I docs/usda/build-approved-ingredients.py
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
PILOT = json.loads((ROOT / 'src/data/usda/pilot-foods.json').read_text(encoding='utf-8'))
CSV = json.loads((HERE / 'batch-02-source-records.json').read_text(encoding='utf-8'))
OUT = ROOT / 'src/data/usda/approved-ingredients.json'

APPROVALS = [{
    'ingredient': 'Honey',
    'fdcId': '169640',
    'identity': 'Generic honey (USDA SR Legacy "Honey"); no brand, floral source or processing claims.',
    'preparation': 'Ready-to-use',
    'approvedBy': 'User (project owner) decisions H1-H3',
    'approvedDate': '2026-10-14',
    'apiReport': '20261014T081929Z-7f956233da664e6aaca7d65dd0475f96.json',
    'conversions': [
        {'quantity': 1, 'unit': 'tsp', 'grams': 7.0, 'basePortionId': '85265',
         'derivation': 'Derived: USDA 1 tbsp = 21 g (portion 85265) divided by 3 tsp per tbsp.'},
        {'quantity': 0.25, 'unit': 'cup', 'grams': 84.75, 'basePortionId': '85264',
         'derivation': 'Derived: USDA 1 cup = 339 g (portion 85264) divided by 4.'},
    ],
    'nutrientNotes': {
        '1235': 'USDA record has no added-sugars value. Kept null/Unknown, never zero or inferred from total sugars.',
    },
}]


def build(approval):
    fdc = approval['fdcId']
    source = CSV[fdc]
    report = json.loads((HERE / 'pending-review' / approval['apiReport']).read_text(encoding='utf-8'))
    api = report['record']
    if str(api['fdcId']) != fdc or report.get('approved') is not False:
        raise SystemExit(f'{fdc}: API report identity or status mismatch')
    nutrients = {}
    for d in PILOT['definitions']:
        row = source['nutrients'].get(d['id'])
        amount = row['amount'] if row else None
        unit = row['unit'] if row else d['unit']
        if unit != d['unit']:
            raise SystemExit(f'{fdc} {d["id"]}: unit {unit} != {d["unit"]}')
        a = api['nutrients'].get(d['id'])
        api_amount = a['amountPer100g'] if a else None
        if amount != api_amount:
            raise SystemExit(f'{fdc} {d["id"]}: CSV {amount} != API {api_amount}')
        nutrients[d['id']] = {'amount': amount, 'unit': d['unit'],
                              'sourceRowId': row['sourceRow']['id'] if row and row['sourceRow'] else None}
    portions = {p['id']: p for p in source['portions']}
    for c in approval['conversions']:
        base = float(portions[c['basePortionId']]['gram_weight'])
        expected = {'tsp': base / 3, 'cup': base * c['quantity']}[c['unit']]
        if abs(expected - c['grams']) > 1e-9:
            raise SystemExit(f'{fdc}: conversion {c} does not follow from portion {base} g')
    food = source['food']
    return {**approval, 'description': food['description'], 'dataType': food['data_type'],
            'publicationDate': food['publication_date'], 'snapshot': PILOT['snapshot'],
            'sourceURL': f'https://fdc.nal.usda.gov/food-details/{fdc}/nutrients',
            'portions': source['portions'], 'nutrients': nutrients,
            'status': 'ingredient-approved', 'recipeTotalsPublished': False}


OUT.write_text(json.dumps({'snapshot': PILOT['snapshot'],
                           'note': 'Approved ingredient records only. Recipe totals require every ingredient to be reviewed.',
                           'ingredients': [build(a) for a in APPROVALS]}, indent=2) + '\n', encoding='utf-8')
print('Wrote ' + str(OUT.relative_to(ROOT)))
