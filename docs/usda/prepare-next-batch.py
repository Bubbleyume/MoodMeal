"""Prepare a review-only batch and local fetch command; makes no API calls."""
import json
import re
from pathlib import Path

HERE=Path(__file__).resolve().parent
AUDIT=Path('C:/Users/Shakh/Documents/Codex/2026-10-05/referenced-chatgpt-conversation-this-is-an/outputs/usda-matching')
names=['Honey','Banana','Egg','Eggs','Almonds','Brown rice','Pumpkin seeds','Sweet potato','Swiss chard','Pineapple','Almond butter','Avocado','Greek yogurt','Rolled oats','Whole-grain bread']
queue=json.loads((HERE/'remaining-ingredient-review.json').read_text(encoding='utf-8-sig'))
records=json.loads((AUDIT/'review-v2/source-records.json').read_text(encoding='utf-8'))
recipes=json.loads((AUDIT/'recipe-inventory.json').read_text(encoding='utf-8'))
recipe_names={r['id']:r['name'] for r in recipes}
batch=sorted([x for x in queue if x['ingredient'] in names],key=lambda x:(-x['recipeUseCount'],x['ingredient']))
assert len(batch)==15
ids=sorted({i for x in batch for i in x['review']['ids']})
lines=['# Next ingredient batch — provisional review', '',
       'Checkpoint: ae01366. Fifteen ingredient labels (14 food types: Egg/Eggs share candidate records). Selected by frequency, with rolled oats, Greek yogurt and whole-grain bread explicitly included. All 61 remaining labels retain their earlier review status. No new nutrition approved or published.', '',
       '**API retrieval pending:** this table uses previously verified local CSV evidence. No new API retrieval dates are asserted. Run fetch-next-batch.ps1 locally, then review the saved responses before approving matches. The retained CSV snapshot is FoodData_Central_csv_2026-04-30. Proposed gram weights below are conditional reference conversions, not measured kitchen weights.', '',
       '| Ingredient / uses | Recipe usage and quantities | Candidate ID and exact description | Preparation | Conversion / unresolved questions | Confidence and proposed status |',
       '|---|---|---|---|---|---|']
for x in batch:
    r=x['review']
    # Refresh quantities from the current app, not the pre-pilot audit snapshot.
    current=(HERE.parents[1]/'src/data/recipes.ts').read_text(encoding='utf-8')
    for use in r['uses']:
        block=current.split('id: "'+use['recipeId']+'",',1)[1].split('\n    id:',1)[0]
        match=re.search(r'\{ name: "'+re.escape(x['ingredient'])+r'", quantity: "([^"]+)"',block)
        if match: use['quantity']=match.group(1)
    x['apiVerificationStatus']='pending-local-fetch'
    x['apiRetrievedAt']=None
    x['approved']=False
    x['publishable']=False
    x['confidence']='high source identity; recipe quantities directly convertible' if x['ingredient']=='Honey' else 'source records verified; recipe identity/portion conditional'
    x['proposedApproval']='candidate for approval after API verification' if x['ingredient']=='Honey' else 'hold pending stated decisions and API verification'
    use='; '.join(recipe_names[u['recipeId']]+' — '+u['quantity'] for u in r['uses'])
    desc='; '.join(i+': '+records[i]['description'] for i in r['ids'])
    lines.append('| '+' | '.join([f"{x['ingredient']} ({x['recipeUseCount']})",use,desc,r['state'],r['note'],x['confidence']+'; '+x['proposedApproval']])+' |')
lines += ['', '## Source portions and applicable nutrient evidence', '',
          'Source records include nutrient IDs, units, derivations and amounts per 100 g. Missing rows/amounts are unknown, never zero. Energy alternatives must not be added together. Native portion IDs below support review; a portion of a different preparation or food must not be borrowed. FNDDS household amounts can be recorded in portion_description rather than numeric amount.', '']
for i in ids:
    r=records[i]
    lines.append(f"### FDC {i}: {r['description']}")
    lines.append(f"Data type: {r['data_type']}; published: {r['publication_date']}; API retrieval: pending. [USDA record](https://fdc.nal.usda.gov/food-details/{i}/nutrients).")
    for p in r['portions']:
        lines.append(f"- Portion {p['id']}: amount={p['amount'] or 'null'}; modifier={p['modifier'] or 'none'}; description={p['portion_description'] or 'none'}; grams={p['gram_weight'] or 'null'}; measure-unit ID={p['measure_unit_id']}.")
    if not r['portions']: lines.append('- No native portion weights: conversion remains unresolved.')
    values=[]
    for nid in ['1008','2047','2048','1003','1004','1005','1079','1235']:
        n=r['nutrients'].get(nid)
        values.append(nid+': '+(str(n.get('amountPer100g') or 'null')+' '+n['definition']['unit_name'] if n else 'null'))
    lines.append('Selected nutrient IDs/amounts per 100 g: '+ '; '.join(values)+'.')
    lines.append('')
lines += ['## Complex ingredients remain on hold', '',
          '- Salmon: species, cut, raw/cooked weight and preparation must be fixed before selecting an ID.',
          '- Milk alternatives: specify the product/type, sweetening and fortification; they are not interchangeable with milk.',
          '- Dark chocolate: cocoa percentage and chip/bar form matter; semisweet chips are not an automatic match.',
          '- Kefir: plain versus flavored and fat content must be specified. Existing FNDDS candidate is a mixed model and is not a plain-kefir default.',
          '- Seasonings: crushed chili-flake grams remain null; sea salt composition remains unresolved. Salt & pepper needs separate measured amounts.', '',
          '## Candidate recipes — conditional, not yet eligible', '',
          '- **Chamomile & Sweet Potato Toast:** banana, almond butter and sweet potato decisions would resolve much of the recipe; brewed chamomile portion and previously standardized cinnamon still need source/conversion review. Fix raw versus roasted sweet-potato weight.',
          '- **Warm Oatmeal with Berries:** oats and honey are covered here, but milk choice, berry blend, chopped-walnut weight and cinnamon conversion remain. No complete total yet.',
          '- **Berry Yogurt Parfait:** honey and Greek yogurt become usable after approval; granola identity and mixed-berry proportions still prevent a complete calculation.',
          '- **Avocado Toast:** egg, bread and avocado decisions advance it, but crushed chili-flake grams still block a complete total. Fine table salt quantity was approved; composition/conversion still requires review for this recipe.',
          '- **Brown Rice Veggie Bowl:** choose cooked rice type and resolve chard raw-versus-sauteed measurement; olive oil, tahini and lemon juice mappings also need approval.', '',
          '**No new recipe is fully eligible solely from approving this batch.** Rainbow Fruit Skewers remains the only approved calculation. No live recipe totals were computed.', '',
          '## Review boundary', '',
          'The JSON companion records API retrieval dates as null until actual retrieval. Existing source evidence is retained separately; candidate confidence is not approval. Once local API responses are available, compare exact IDs, states, portions and nutrient units/values before requesting final approval.']
(HERE/'NEXT-BATCH-REVIEW.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
(HERE/'next-batch-review.json').write_text(json.dumps(batch,indent=2),encoding='utf-8')
ps="""# Run locally. Reads the existing Windows user variable without displaying it.
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '../..')
$env:FDC_API_KEY = [Environment]::GetEnvironmentVariable('FDC_API_KEY', 'User')
if ([string]::IsNullOrWhiteSpace($env:FDC_API_KEY)) { throw 'FDC_API_KEY is not configured for this Windows user.' }
"""
ps += '$candidateIds = @('+','.join(ids)+')\n'
ps += """foreach ($fdcId in $candidateIds) {
    python docs/usda/fdc_review.py fetch $fdcId --skip-existing
    if ($LASTEXITCODE -ne 0) { throw 'Fetch stopped. Resolve the reported error before continuing.' }
    Start-Sleep -Milliseconds 500
}
Write-Output 'Candidate reports saved for review only. No records were imported or approved.'
"""
(HERE/'fetch-next-batch.ps1').write_text(ps,encoding='utf-8')
print(f'Prepared {len(batch)} labels, {len(ids)} candidate IDs; API retrieval pending.')
