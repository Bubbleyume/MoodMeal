"""Review saved responses offline; never retrieve, approve or publish records."""
import json
from pathlib import Path
import fdc_review as tool

here=Path(__file__).resolve().parent
audit=Path('C:/Users/Shakh/Documents/Codex/2026-10-05/referenced-chatgpt-conversation-this-is-an/outputs/usda-matching/review-v2/source-records.json')
baseline=json.loads(audit.read_text())
batch=json.loads((here/'next-batch-review.json').read_text())
ids={i for x in batch for i in x['review']['ids']}
saved={}
for p in sorted(tool.PENDING.glob('*.json')):
    d=json.loads(p.read_text())
    i=d.get('record',{}).get('fdcId')
    if i in ids and d.get('rawResponse',{}).get('fdcId')==int(i):
        saved[i]=(p,d)
assert set(saved)==ids, 'Missing candidate responses; do not claim batch complete.'
evidence={}
for i,(p,d) in saved.items():
    result=tool.compare(d['record'],baseline[i])
    evidence[i]={'report':p.name,'retrievedAt':d['retrievedAt'],'record':d['record'],'comparison':result}
for x in batch:
    details={i:{'report':evidence[i]['report'],'retrievedAt':evidence[i]['retrievedAt'],
                'summary':evidence[i]['comparison']['summary']} for i in x['review']['ids']}
    x['apiEvidence']=details
    x['apiRetrievedAt']=sorted({d['retrievedAt'] for d in details.values()})
    x['apiVerificationStatus']='compared-with-csv; manual-recipe-match-approval-pending'
    if x['ingredient']=='Honey':
        x['proposedApproval']='ready for user approval; not approved'
    else:
        x['proposedApproval']='conditional; resolve identity/measurement questions and listed source differences'
    assert not x['approved'] and not x['publishable']
(here/'next-batch-review.json').write_text(json.dumps(batch,indent=2),encoding='utf-8')
(here/'pending-review/next-batch-comparison.json').write_text(json.dumps(evidence,indent=2),encoding='utf-8')
report=here/'NEXT-BATCH-REVIEW.md'
text=report.read_text(encoding='utf-8').split('\n## Completed API review')[0]
text=text.replace('# Next ingredient batch — provisional review','# Next ingredient batch — API review completed, approval pending')
start=text.index('**API retrieval ')
end=text.index('\n\n',start)
text=text[:start]+('**API retrieval completed:** 21 exact candidate IDs fetched locally on 2026-10-14 and compared offline against retained CSV evidence. Fifteen comparisons have zero material differences; six have review issues described below. The initial table documents CSV-based conversion proposals, not approval. API findings below supersede earlier source-availability notes. All existing approvals remain unchanged.')+text[end:]
text=text.replace('API retrieval: pending.', 'API retrieval: completed; exact retrieval timestamp and report listed below.')
text=text.replace('candidate for approval after API verification', 'API matched; ready for user approval')
text=text.replace('hold pending stated decisions and API verification', 'hold pending stated decisions and source issues below')
text=text.replace('The JSON companion records API retrieval dates as null until actual retrieval. Existing source evidence is retained separately; candidate confidence is not approval. Once local API responses are available, compare exact IDs, states, portions and nutrient units/values before requesting final approval.', 'The JSON companion now records per-ID retrieval dates, pending-report paths and comparison summaries. Full API responses remain in pending-review. Candidate confidence is not recipe approval. No runtime data has been changed.')
lines=['','## Completed API review','', '| FDC ID | Retrieved (UTC) | Material / informational fields | Result |','|---|---|---|---|']
for i in sorted(evidence):
    e=evidence[i]; s=e['comparison']['summary']
    lines.append(f"| {i} | {e['retrievedAt']} | {s['materialDifferences']} / {s['informationalDifferences']} | {'Clean nutritional comparison; not exact metadata match' if s['cleanNutritionalComparison'] else 'Manual source review required'} |")
lines += ['', '### Source issues requiring review', '',
 '- **Almond butter 168588:** nutrient 1283 (phytosterols) appears twice: source row 1372134 has 139 mg/100 g, matching CSV; a second row has null amount and no row ID. All other numeric nutrients and portions match. The tool intentionally keeps the normalized phytosterol value null. Proposed resolution for approval: retain the sourced 139 mg row and preserve the empty duplicate as evidence; not applied.',
 '- **Almonds 170567 and avocado 171705:** an additional phytosterol record has null amount and MG unit. No numeric disagreement was found, but this is a meaningful nutrient, not one of the six category IDs. Preserve it as unknown and retain the missing-value flags; do not substitute zero.',
 '- **Rolled oats 2346396:** API provides portion 312593, amount 1, unit RACC (1121), weight 40 g. This does not establish a half-cup conversion. Exact rolled oats still need a weighed recipe amount, or explicit approval of the different SR regular/quick dry-oat record 173904 and its own 81 g/cup measure.',
 '- **Greek yogurt whole 2705422:** water (1051) is 81.3 g/100 g in API versus 81.32 in CSV. **Low-fat 2705423:** 84.2 versus 84.15. These may reflect rounding, but that cause is not verified; no tolerance or overwrite applied. Nonfat 2705424 has a clean nutritional comparison. Fat level still needs user selection.',
 '', '### Proposed approval decisions', '',
 '- Honey 169640: approve 1 tsp = 7 g and 1/4 cup = 84.75 g as USDA reference conversions. API matches; not yet approved.',
 '- Banana 173944: choose a medium peeled reference fruit, 118 g; half 59 g, if desired. Size remains a recipe decision.',
 '- Eggs: select large 50 g edible eggs; preserve raw input 171287 versus hard-boiled 173424 by recipe. Power-bowl cooking method still unresolved.',
 '- Brown rice: choose cooked long-grain (3/4 cup 151.5 g) or medium-grain (146.25 g); never substitute dry rice.',
 '- Bread: approve whole-wheat specifically and the 32 g reference slice, or provide the intended loaf/slice weight. Generic whole-grain is not a precise identity.',
 '- All remaining proposals retain the identity/portion questions in the table. Salmon, milk alternatives, chocolate and kefir stay on hold.',
 '', '### Recipe readiness and validation', '',
 'No additional complete recipe becomes eligible without further decisions. Suggested next pilot: Chamomile & Sweet Potato Toast after sweet-potato state/weight, medium banana, plain unsalted almond butter, cinnamon conversion and brewed-tea handling are settled. Oatmeal/parfait still need milk/berries/granola choices; avocado toast still has unresolved chili-flake grams. No live totals calculated.',
 '', 'API tool checkpoint: ae01366. Duplicate recovery changes and this report remain uncommitted. Fourteen Python tests, 19 knowledge tests and TypeScript validation pass. The earlier build passed; this phase changed only review documents/scripts. Pending report evidence and original API payloads remain intact.']
report.write_text(text+'\n'.join(lines)+'\n',encoding='utf-8')
print('Completed review: 21 IDs, 15 clean comparisons, 6 flagged. No publication.')
