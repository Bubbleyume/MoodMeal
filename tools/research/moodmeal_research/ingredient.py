"""Ingredient research command (Phase 1 backlog item 4): candidate-only review records.

One recipe line in, one fingerprinted review record out:
- the requirements the line meets and misses (requirements.py);
- USDA candidates from the local CSV snapshot, found by whole-word search plus any
  IDs the ledger or the caller names;
- for each candidate: how its description relates to the stated state and form,
  every weight the USDA portions support for the line's unit (never one chosen),
  core nutrients per 100 g (unknown stays null, a measured zero stays zero) and
  the line's contribution for each weight option;
- an evidence status that is only ever 'candidate' or 'missing', and a blank decision.

Item 3 (approval rules) is undecided, so this module approves nothing, never sets
Verified, Conditional, Conflicting or Rejected, and never writes app or ledger data.
Search order is a reading aid, not evidence.
"""
import csv
import hashlib
import json
import re
from pathlib import Path

from . import requirements as req
from .adapters.usda_csv import UsdaCsvAdapter
from .provenance import checksum

RECORD_KIND = 'moodmeal-ingredient-review'
RECORD_VERSION = 1
# Candidate data types, in display order. Branded and sample records are never searched.
DATA_TYPES = ('foundation_food', 'sr_legacy_food', 'survey_fndds_food')
CORE_NUTRIENTS = {
    '1008': 'Energy', '1003': 'Protein', '1004': 'Total fat', '1005': 'Carbohydrate',
    '1079': 'Fiber', '2000': 'Total sugars', '1235': 'Added sugars', '1093': 'Sodium',
}
STOP_WORDS = {'and', 'or', 'with', 'of', 'the', 'a', 'an', 'for', 'to', 'in', 'on'}
COUNT_SIZE_WORDS = {'small', 'medium', 'large', 'extra', 'whole', 'fruit', 'each', 'piece', 'nlea'}
SOURCE_FILES = ('ingredient.py', 'requirements.py', 'normalize.py', 'adapters/usda_csv.py')


def stem(word):
    """Crude plural fold so 'seeds' finds 'seed' and 'berries' finds 'berry'."""
    if len(word) > 4 and word.endswith('ies'):
        return word[:-3] + 'y'
    if len(word) > 3 and word.endswith('s') and not word.endswith('ss'):
        return word[:-1]
    return word


def query_terms(text):
    return [stem(w) for w in req.words(text) if w not in STOP_WORDS]


def matches(terms, description):
    """Every query term must equal a whole word of the description (plurals folded)."""
    desc = {stem(w) for w in req.words(description)}
    return bool(terms) and all(t in desc for t in terms)


def search_order(terms, row):
    """Records whose description starts with the first term ('Honey', 'Garlic, raw') come first."""
    desc = [stem(w) for w in req.words(row['description'])]
    head = 0 if desc and desc[0] == terms[0] else 1
    return head, DATA_TYPES.index(row['data_type']), len(desc), int(row['fdc_id'])


def search(folder, terms, max_candidates):
    """Stream food.csv once. Returns (shown rows, total matches)."""
    found = []
    with (Path(folder) / 'food.csv').open(encoding='utf-8-sig', newline='') as f:
        for row in csv.DictReader(f):
            if row['data_type'] in DATA_TYPES and matches(terms, row['description']):
                found.append(row)
    found.sort(key=lambda r: search_order(terms, r))
    return found[:max_candidates], len(found)


def measure_units(folder):
    path = Path(folder) / 'measure_unit.csv'
    if not path.is_file():
        return {}
    with path.open(encoding='utf-8-sig', newline='') as f:
        return {r['id']: r['name'] for r in csv.DictReader(f)}


def sha256_file(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for block in iter(lambda: f.read(1 << 20), b''):
            h.update(block)
    return h.hexdigest()


def tool_version():
    here = Path(__file__).resolve().parent
    return {name: sha256_file(here / name) for name in SOURCE_FILES}


def weight_options(record, line, units):
    """Every gram weight the record's portions support for the line's unit. None is chosen."""
    quantity, unit, cls = line['quantity'], line['unit'], line['unitClass']
    if not quantity or not unit:
        return [], 'missing', 'The line has no numeric amount.'
    if cls == 'mass':
        grams = quantity * req.GRAMS_PER_MASS_UNIT[unit]
        return ([{'method': 'exact-mass', 'portionId': None, 'portion': None, 'qualifier': None,
                  'gramsPerUnit': req.GRAMS_PER_MASS_UNIT[unit], 'grams': grams,
                  'derivation': f'Exact mass: 1 {unit} = {req.GRAMS_PER_MASS_UNIT[unit]} g.',
                  'formMentioned': None}],
                'exact-mass', 'Exact mass conversion. Which state the weight refers to is still a decision.')
    options = []
    for p in record['portions']:
        m = req.portion_measure(p, units)
        label, qualifier, amount = m['label'], m['qualifier'], m['amount']
        derived = req.grams_per_unit(p, amount, m['unit'], unit) if m['unit'] else None
        if derived is None and cls == 'count' and p.get('gramWeight') is not None and amount:
            q_words = set(req.words(qualifier)) | set(req.words(units.get(p.get('measureUnitId'), '')))
            if unit in q_words or (unit == 'each' and q_words & COUNT_SIZE_WORDS):
                derived = (p['gramWeight'] / amount, 'count-portion',
                           f'USDA portion {p["id"]}: {amount:g} {label} = {p["gramWeight"]:g} g. '
                           'The size or count must be confirmed.')
        if derived is None:
            continue
        per, method, derivation = derived
        q_words = set(req.words(qualifier))
        options.append({'method': method, 'portionId': p['id'], 'portion': label, 'qualifier': qualifier,
                        'gramsPerUnit': per, 'grams': per * quantity, 'derivation': derivation,
                        'formMentioned': sorted(q_words & set(line['forms'])) or None})
    if not options:
        return [], 'no-portion', f'No USDA portion of this record supports "{unit}".'
    # Equal within a millionth of a gram, so 216/16 and 13.5 count as one weight.
    distinct = {round(o['grams'], 6) for o in options}
    if len(distinct) > 1:
        return options, 'several-options', (
            f'{len(options)} portion-based weights, {len(distinct)} of them different; choosing one is a decision.')
    if all(o['method'] == 'count-portion' for o in options):
        return options, 'count-portion', 'One USDA portion for this count; the size or count must be confirmed.'
    if any(o['method'] == 'direct' for o in options):
        others = len(options) - 1
        return options, 'direct-portion', 'One USDA portion in this unit' + (
            f'; {others} other portion(s) give the same weight.' if others else '.')
    return options, 'derived', 'Derived from a portion in another unit; no portion in this unit.'


def nutrient_summary(record):
    out = {}
    for nid, name in CORE_NUTRIENTS.items():
        n = record['nutrients'].get(nid)
        out[nid] = {'name': name, 'unit': n['unit'] if n else None,
                    'amountPer100g': n['amountPer100g'] if n else None,
                    'sourceRowId': n['sourceRowId'] if n else None,
                    'issue': n.get('resolution') if n else 'absent-in-record'}
    return out


def contribution(summary, grams):
    return {nid: (None if v['amountPer100g'] is None else v['amountPer100g'] * grams / 100)
            for nid, v in summary.items()}


def candidate(entry, sources, line, units):
    record = entry['record']
    options, weight_status, weight_note = weight_options(record, line, units)
    summary = nutrient_summary(record)
    for o in options:
        o['contribution'] = contribution(summary, o['grams'])
    desc_words = set(req.words(record['description']))
    return {
        'fdcId': record['fdcId'], 'description': record['description'], 'dataType': record['dataType'],
        'publicationDate': record['publicationDate'], 'foundBy': sorted(sources),
        'state': req.describe_state(record['description'], line['state']),
        'formInDescription': sorted(desc_words & set(line['forms'])) or None,
        'weight': {'status': weight_status, 'note': weight_note, 'options': options},
        'nutrientsPer100g': summary, 'nutrientRowCount': len(record['nutrients']),
        'verificationIssues': record['verificationIssues'],
        'sourceRows': {'nutrients': {nid: v['sourceRowId'] for nid, v in record['nutrients'].items()},
                       'portions': [p['id'] for p in record['portions']]},
        'provenance': entry['provenance'],
    }


def ledger_context(label, ledger, runtime):
    entry = next((e for e in ledger or [] if e['ingredient'].lower() == label.lower()), None)
    approved = [r for r in (runtime or {}).get('ingredients', []) if r['ingredient'].lower() == label.lower()]
    ids = []
    if entry:
        ids = list(dict.fromkeys([*entry['review'].get('ids', []),
                                  *(c['fdcId'] for c in entry['review'].get('candidateRecords') or [])]))
    return {
        'ledger': None if not entry else {
            'status': entry['review'].get('status'), 'reviewStatus': entry['review'].get('reviewStatus'),
            'note': entry['review'].get('note'), 'candidateIds': ids,
            'uses': entry['review'].get('uses'), 'approvedUses': entry['review'].get('approvedUses')},
        'approvedRecords': [{'fdcId': r['fdcId'], 'identity': r['identity'], 'preparation': r['preparation'],
                             'approvedBy': r['approvedBy'], 'approvedDate': r['approvedDate'],
                             'conversions': [{k: c.get(k) for k in ('quantity', 'unit', 'notes', 'recipeIds', 'grams')}
                                             for c in r['conversions']]} for r in approved],
        'reuseNote': ('An approved record exists for this label. Reusing it for this line is your decision: '
                      'item 3 rule AR-3 is not approved.') if approved else None,
    }


def evidence_status(line, candidates):
    reasons = [i['id'] for i in line['items'] if i['status'] == 'missing']
    if not candidates:
        reasons.append('no-candidates')
    return ('missing' if reasons else 'candidate'), reasons


def build_record(request, folder, ledger=None, runtime=None, inputs=None, max_candidates=8):
    """The review record for one line. `request` has label, quantity, unit, notes, state,
    forms, search, fdcIds and optional recipeId / lineIndex."""
    line = req.check(request)
    terms = query_terms(request.get('search') or request['label'])
    shown, total = search(folder, terms, max_candidates)
    context = ledger_context(request['label'], ledger, runtime)
    sources = {}
    for row in shown:
        sources.setdefault(row['fdc_id'], set()).add('search')
    for fdc in (context['ledger'] or {}).get('candidateIds', []):
        sources.setdefault(str(fdc), set()).add('ledger')
    for fdc in request.get('fdcIds') or []:
        sources.setdefault(str(fdc), set()).add('requested')
    adapter = UsdaCsvAdapter(folder)
    loaded = adapter.load(sources) if sources else {}
    units = measure_units(folder)
    missing_ids = sorted(set(sources) - set(loaded), key=int)
    searched = [r['fdc_id'] for r in shown]
    extra = sorted((i for i in loaded if i not in searched),
                   key=lambda i: (DATA_TYPES.index(loaded[i]['record']['dataType'])
                                  if loaded[i]['record']['dataType'] in DATA_TYPES else 99, int(i)))
    candidates = [candidate(loaded[i], sources[i], line, units) for i in searched + extra if i in loaded]
    status, reasons = evidence_status(line, candidates)
    record = {
        'kind': RECORD_KIND, 'version': RECORD_VERSION,
        'request': {k: request.get(k) for k in ('recipeId', 'lineIndex', 'label', 'quantity', 'unit', 'notes',
                                                 'state', 'forms', 'search', 'fdcIds')},
        'requirements': line['items'],
        'search': {'terms': terms, 'dataTypes': list(DATA_TYPES), 'totalMatches': total, 'shown': len(shown),
                   'order': ('Descriptions that start with the first term, then data type, then shorter '
                             'description, then FDC ID. Order is not evidence.')},
        'context': context,
        'candidates': candidates,
        'idsNotInSnapshot': missing_ids,
        'evidenceStatus': status, 'statusReasons': reasons,
        'statusNote': ('Only candidate or missing is assigned. Verified, Conditional, Conflicting and Rejected '
                       'need the owner, or rules the owner has approved (item 3, all blank).'),
        'decision': {'evidenceStatus': None, 'fdcId': None, 'portionId': None, 'grams': None,
                     'decidedBy': None, 'date': None, 'notes': None},
        'approved': False, 'publishable': False,
        'inputs': {'snapshot': adapter.snapshot, **(inputs or {})},
        'toolVersion': tool_version(),
    }
    record['fingerprint'] = 'sha256:' + checksum(record)
    return record


def slug(request):
    if request.get('recipeId') is not None and request.get('lineIndex') is not None:
        return f'{request["recipeId"]}-line-{request["lineIndex"]}'
    text = '-'.join(req.words(' '.join(str(request.get(k) or '') for k in ('label', 'quantity', 'unit'))))
    return re.sub(r'-+', '-', text).strip('-') or 'ingredient'


def fmt(value, digits=4):
    if value is None:
        return 'Unknown'
    return f'{value:.{digits}f}'.rstrip('0').rstrip('.') if isinstance(value, float) else str(value)


def render_markdown(record):
    r = record['request']
    where = f'{r["recipeId"]}, line {r["lineIndex"]}' if r.get('recipeId') else 'request'
    lines = [f'# Ingredient review record: {r["label"]}', '',
             f'**Candidate-only.** Evidence status: **{record["evidenceStatus"]}**'
             + (f' (missing: {", ".join(record["statusReasons"])})' if record['statusReasons'] else '') + '.',
             f'Every decision is blank. Fingerprint `{record["fingerprint"]}`.', '',
             f'- Line ({where}): {r["label"]}, {r["quantity"]} {r["unit"] or ""}'.rstrip()
             + (f', notes "{r["notes"]}"' if r.get('notes') else ''),
             f'- Snapshot: {record["inputs"]["snapshot"]}. Search terms: {", ".join(record["search"]["terms"])}; '
             f'{record["search"]["totalMatches"]} matches, {record["search"]["shown"]} shown. {record["search"]["order"]}',
             '', '## Requirements', '', '| Requirement | Status | Value | Detail |', '| --- | --- | --- | --- |']
    for i in record['requirements']:
        value = i['value'] if not isinstance(i['value'], (dict, list)) else json.dumps(i['value'])
        lines.append(f'| {i["id"]} | {i["status"]} | {value} | {i["detail"]} |')
    ctx = record['context']
    if ctx['ledger'] or ctx['approvedRecords']:
        lines += ['', '## Ledger and approvals', '']
        if ctx['ledger']:
            lines.append(f'- Ledger: {ctx["ledger"]["status"]} ({ctx["ledger"]["reviewStatus"]}). {ctx["ledger"]["note"]}')
        for a in ctx['approvedRecords']:
            lines.append(f'- Approved record FDC {a["fdcId"]} ({a["approvedDate"]}): {a["identity"]}')
        if ctx['reuseNote']:
            lines.append(f'- {ctx["reuseNote"]}')
    lines += ['', '## Candidates', '']
    if not record['candidates']:
        lines.append('None found.')
    for c in record['candidates']:
        lines += [f'### FDC {c["fdcId"]}: {c["description"]}', '',
                  f'{c["dataType"]}, published {c["publicationDate"]}; found by {", ".join(c["foundBy"])}. '
                  f'State: {c["state"]["result"]}. Weight: {c["weight"]["status"]}. {c["weight"]["note"]}', '']
        if c['verificationIssues']:
            lines.append(f'Verification issues: {json.dumps(c["verificationIssues"])}')
            lines.append('')
        if c['weight']['options']:
            lines += ['| Portion | Method | g per unit | g for the line | Energy (kcal) | Sodium (mg) | Derivation |',
                      '| --- | --- | --- | --- | --- | --- | --- |']
            for o in c['weight']['options']:
                lines.append(f'| {o["portionId"] or "-"} {o["portion"] or ""} | {o["method"]} | {fmt(o["gramsPerUnit"])} | '
                             f'{fmt(o["grams"])} | {fmt(o["contribution"]["1008"], 1)} | '
                             f'{fmt(o["contribution"]["1093"], 1)} | {o["derivation"]} |')
            lines.append('')
        lines += ['| Nutrient per 100 g | Amount | Unit |', '| --- | --- | --- |']
        for v in c['nutrientsPer100g'].values():
            lines.append(f'| {v["name"]} | {fmt(v["amountPer100g"])} | {v["unit"] or ""} |')
        lines.append('')
    if record['idsNotInSnapshot']:
        lines += [f'IDs not in the snapshot: {", ".join(record["idsNotInSnapshot"])}.', '']
    lines += ['## Decision (blank)', '', '| Field | Value |', '| --- | --- |']
    lines += [f'| {k} | |' for k in record['decision']]
    return '\n'.join(lines) + '\n'
