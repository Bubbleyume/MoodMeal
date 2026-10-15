"""Read-only extraction of exact USDA CSV rows for records not already in
batch-02-source-records.json. Same shape as that file: food row, native
portion rows, and every nutrient definition with its source row (null when
the CSV has no row). Writes docs/usda/approved-source-records.json only.
Run: python -I docs/usda/extract-source-records.py
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/usda/approved-source-records.json'
SOURCE = Path('C:/Users/Shakh/Downloads/FoodData_Central_csv_2026-04-30')
IDS = {'171320', '171706', '172688', '173904', '174156'}


def rows(name):
    with (SOURCE / name).open(encoding='utf-8-sig', newline='') as f:
        yield from csv.DictReader(f)


foods = {r['fdc_id']: r for r in rows('food.csv') if r['fdc_id'] in IDS}
units = {r['id']: r for r in rows('nutrient.csv')}
portions = {i: [] for i in IDS}
for r in rows('food_portion.csv'):
    if r['fdc_id'] in IDS:
        portions[r['fdc_id']].append(r)
nutrients = {i: {} for i in IDS}
duplicates = {i: [] for i in IDS}
for r in rows('food_nutrient.csv'):
    if r['fdc_id'] in IDS:
        if r['nutrient_id'] in nutrients[r['fdc_id']]:
            duplicates[r['fdc_id']].append(r['nutrient_id'])
        nutrients[r['fdc_id']][r['nutrient_id']] = {
            'amount': float(r['amount']) if r['amount'] else None, 'sourceRow': r}
if any(duplicates.values()):
    raise SystemExit(f'Duplicate CSV nutrient rows need manual review: {duplicates}')
if set(foods) != IDS:
    raise SystemExit(f'Missing food rows: {IDS - set(foods)}')
records = {}
for i in sorted(IDS):
    records[i] = {'food': foods[i], 'portions': portions[i], 'nutrients': {
        n: {'amount': nutrients[i].get(n, {}).get('amount'), 'unit': u['unit_name'],
            'name': u['name'], 'sourceRow': nutrients[i].get(n, {}).get('sourceRow')}
        for n, u in units.items()}}
OUT.write_text(json.dumps(records, indent=1) + '\n', encoding='utf-8')
print('Wrote', OUT.relative_to(ROOT), sorted(records))
