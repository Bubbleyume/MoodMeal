"""Read-only USDA verification; writes review artifacts, never runtime catalog."""
import csv, json
from pathlib import Path

root = Path(__file__).resolve().parents[2]
out = root / 'docs/usda'
source = Path('C:/Users/Shakh/Downloads/FoodData_Central_csv_2026-04-30')
audit = Path('C:/Users/Shakh/Documents/Codex/2026-10-05/referenced-chatgpt-conversation-this-is-an/outputs/usda-matching')
queue = json.loads((out/'remaining-ingredient-review.json').read_text(encoding='utf-8-sig'))
batch = queue[:12]
ids = {i for x in batch for i in x['review']['ids']}
def rows(name):
    with (source/name).open(encoding='utf-8-sig', newline='') as f:
        yield from csv.DictReader(f)
foods = {r['fdc_id']:r for r in rows('food.csv') if r['fdc_id'] in ids}
units = {r['id']:r for r in rows('nutrient.csv')}
portions = {i:[] for i in ids}
for r in rows('food_portion.csv'):
    if r['fdc_id'] in ids: portions[r['fdc_id']].append(r)
nutrients = {i:{} for i in ids}
for r in rows('food_nutrient.csv'):
    if r['fdc_id'] in ids:
        nutrients[r['fdc_id']][r['nutrient_id']] = {'amount':float(r['amount']) if r['amount'] else None,'sourceRow':r}
records = {}
for i in sorted(ids):
    records[i] = {'food':foods[i], 'portions':portions[i], 'nutrients':{
        n:{'amount':nutrients[i].get(n,{}).get('amount'), 'unit':u['unit_name'],
           'name':u['name'], 'sourceRow':nutrients[i].get(n,{}).get('sourceRow')}
        for n,u in units.items()}}
for x in batch:
    for c in x['review']['candidateRecords']:
        assert foods[c['fdcId']]['description'] == c['description']
        assert set(c['portionIds']) <= {p['id'] for p in portions[c['fdcId']]}
    x['group'] = ('verified candidate, approval pending' if x['ingredient']=='Honey' else
                  'unresolved measurement' if x['ingredient']=='Salt & pepper' else 'ambiguous match or preparation/portion')
    x['verification'] = 'Food description, source portions and nutrient rows re-read directly from supplied CSVs; units retained; missing amounts null'
(out/'batch-02-source-records.json').write_text(json.dumps(records,indent=2),encoding='utf-8')
(out/'batch-02-review.json').write_text(json.dumps(batch,indent=2),encoding='utf-8')
lines=['# USDA batch 02 — review only','', 'Twelve most-used remaining labels, selected by recipe frequency. Direct CSV recheck completed 2026-10-14. No runtime data changed. Source verification does not approve a recipe identity or household measure. Missing values remain null. Nutrients are per 100 g edible portion; source units and row IDs are retained in batch-02-source-records.json.', '', '| Ingredient (uses) | Proposed USDA descriptions / IDs | Group | Decision needed / proposed conversion |','|---|---|---|---|']
for x in batch:
    descriptions='; '.join(f"{i}: {foods[i]['description']}" for i in x['review']['ids'])
    lines.append(f"| {x['ingredient']} ({x['recipeUseCount']}) | {descriptions} | {x['group']} | {x['review']['note']} |")
lines += ['', '## Recipe eligibility', '', 'No additional recipe is ready for publication. Only Rainbow Fruit Skewers remains approved. Even approval of the clean honey candidate alone does not complete another recipe. The following shows remaining labels outside this batch and the already approved pilot fruits; it is a dependency list, not a claim that batch ingredients are approved. All non-pilot recipes still require per-use quantity, preparation and yield review.', '']
covered={x['ingredient'] for x in batch}|{'Strawberries','Blueberries','Wooden skewers'}
recipes=json.loads((audit/'recipe-inventory.json').read_text(encoding='utf-8'))
ranked=sorted(recipes,key=lambda r:sum(i['name'] not in covered for i in r['ingredients']))
for r in ranked[:8]:
    missing=[i['name'] for i in r['ingredients'] if i['name'] not in covered]
    lines.append(f"- **{r['name']}**: remaining labels outside batch: {', '.join(missing) or 'none'}. " + ('Approved pilot only.' if r['id']=='recipe-rainbow-fruit-skewers' else 'Batch identity/measurement decisions still pending.'))
lines += ['', '## Holds', '', 'Meat cuts, milk alternatives, kefir, chocolate types, crushed chili flakes and sea-salt composition remain on hold. Salt & pepper requires separate measurable quantities. No default is silently chosen. Honey teaspoon conversion assumes 3 teaspoons per tablespoon; native cup and tablespoon weights are independently preserved. Cooking losses, yield and unlisted oils must be resolved before complete cooked-recipe totals.', '', '## Evidence', '', 'All proposed IDs, exact descriptions, publication dates, data types, native portion amounts/weights/IDs, nutrient units and raw nutrient rows are retained in batch-02-source-records.json. Proposed mappings and preparation notes are in batch-02-review.json. Source: user-supplied FoodData_Central_csv_2026-04-30. No online or branded substitutions.']
(out/'BATCH-02-REVIEW.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(f'Verified {len(ids)} source records for {len(batch)} labels; review artifacts only.')
