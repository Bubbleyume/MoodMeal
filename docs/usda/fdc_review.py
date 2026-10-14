"""Local, read-only FDC client. Never imports into the application."""
import argparse
import json
import math
import os
import re
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen, HTTPRedirectHandler, build_opener
from urllib.error import HTTPError
from urllib.parse import urlencode

BASE = 'https://api.nal.usda.gov/fdc/v1/'
HERE = Path(__file__).resolve().parent
PENDING = HERE / 'pending-review'
GENERIC = ['Foundation', 'SR Legacy', 'Survey (FNDDS)']
# Only these observed USDA category IDs/names qualify; null alone never qualifies.
EMPTY_CATEGORIES = {'2039':'Carbohydrates', '2042':'Amino acids', '2043':'Minerals',
                    '2044':'Lipids', '2045':'Proximates', '2046':'Vitamins and Other Components'}

class ReviewError(Exception):
    pass

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None

def number(value):
    if value is None or value == '' or isinstance(value, bool):
        return None
    try:
        n = float(value)
        return n if math.isfinite(n) and n >= 0 else None
    except (ValueError, TypeError):
        return None

def unit(value):
    return str(value).strip().upper().replace('µ', 'U').replace('Μ', 'U').replace('MCG', 'UG') if value else None

def states(description):
    return [s for s in ['raw', 'cooked', 'dried', 'roasted', 'boiled', 'baked', 'fried', 'canned', 'frozen']
            if re.search(r'\b' + s + r'\b', description.lower())]

def normalize(food, expected=None):
    description = food.get('description') or ''
    detected = states(description)
    nutrients = {}
    duplicate_rows = {}
    for row in food.get('foodNutrients', []):
        n = row.get('nutrient', {})
        if n.get('id') is None:
            continue
        key = str(n['id'])
        value = {'name': n.get('name'), 'unit': unit(n.get('unitName')),
                          'amountPer100g': number(row.get('amount')), 'sourceRowId': row.get('id'),
                          'derivation': row.get('foodNutrientDerivation')}
        if key in nutrients:
            if key not in duplicate_rows:
                duplicate_rows[key] = [nutrients[key].copy()]
            duplicate_rows[key].append(value)
            nutrients[key] = {'name':None, 'unit':None, 'amountPer100g':None,
                              'sourceRowId':None, 'derivation':None,
                              'resolution':'duplicate-id-manual-review-required'}
        else:
            nutrients[key] = value
    return {'fdcId': str(food.get('fdcId')), 'description': description,
            'dataType': food.get('dataType'), 'publicationDate': food.get('publicationDate'),
            'preparationStates': detected or None, 'expectedPreparation': expected,
            'preparationCheck': ('not-requested' if not expected else
                                 'description-consistent' if expected in detected else 'manual-review-required'),
            'nutrients': nutrients, 'duplicateNutrientRows':duplicate_rows,
            'verificationIssues':[{'type':'duplicate-nutrient-id', 'nutrientId':nid,
                                   'rowCount':len(rows)} for nid,rows in duplicate_rows.items()],
            'portions': [{'id':str(p.get('id')), 'amount':number(p.get('amount')),
                          'gramWeight':number(p.get('gramWeight')), 'modifier':p.get('modifier') or None,
                          'portionDescription':p.get('portionDescription') or None,
                          'measureUnit':p.get('measureUnit')} for p in food.get('foodPortions', [])],
            'reviewStatus':'pending-review', 'approved':False, 'publishable':False}

def compare(record, csv_record):
    differences = []
    def check(field, a, b):
        if a != b:
            differences.append({'field':field, 'api':a, 'csv':b})
    check('fdcId', record['fdcId'], csv_record['fdc_id'])
    check('description', record['description'], csv_record['description'])
    types = {'sr_legacy_food':'SR Legacy', 'foundation_food':'Foundation', 'survey_fndds_food':'Survey (FNDDS)'}
    check('dataType', record['dataType'], types.get(csv_record['data_type'], csv_record['data_type']))
    check('preparationStates', record['preparationStates'], states(csv_record['description']) or None)
    old = csv_record['nutrients']
    for nid in sorted(set(old) | set(record['nutrients'])):
        a = record['nutrients'].get(nid)
        b = old.get(nid)
        check(f'nutrient.{nid}.present', a is not None, b is not None)
        check(f'nutrient.{nid}.amount', a['amountPer100g'] if a else None, number(b.get('amountPer100g')) if b else None)
        check(f'nutrient.{nid}.unit', a['unit'] if a else None, unit(b['definition'].get('unit_name')) if b else None)
    oldp = {str(p['id']):p for p in csv_record['portions']}
    newp = {p['id']:p for p in record['portions']}
    for pid in sorted(set(oldp) | set(newp)):
        a, b = newp.get(pid), oldp.get(pid)
        check(f'portion.{pid}.present', a is not None, b is not None)
        for api, csv in [('amount','amount'), ('gramWeight','gram_weight'), ('modifier','modifier'), ('portionDescription','portion_description')]:
            av, bv = a.get(api) if a else None, b.get(csv) if b else None
            check(f'portion.{pid}.{api}', number(av) if api in ('amount','gramWeight') else av or None,
                  number(bv) if api in ('amount','gramWeight') else bv or None)
        check(f'portion.{pid}.measureUnit', str((a.get('measureUnit') or {}).get('id')) if a else None,
              str(b.get('measure_unit_id')) if b else None)
    check('publicationDate', record.get('publicationDate'), csv_record.get('publication_date'))
    for nid in set(old) & set(record['nutrients']):
        check(f'nutrient.{nid}.name', record['nutrients'][nid].get('name'), old[nid]['definition'].get('name'))
    groups = {name:[] for name in ['material-nutrient', 'portion-weight', 'identity-preparation',
                                  'missing-value', 'metadata', 'empty-category']}
    for difference in differences:
        field = difference['field']
        if field.startswith('nutrient.'):
            _, nid, attribute = field.split('.')
            a, b = record['nutrients'].get(nid), old.get(nid)
            # An absent counterpart is OK, but any amount, row evidence or unexpected
            # name keeps this a meaningful nutrient record needing review.
            empty = nid in EMPTY_CATEGORIES and all([
                a is None or (a.get('name') == EMPTY_CATEGORIES[nid] and a['amountPer100g'] is None and a.get('sourceRowId') is None),
                b is None or (b['definition'].get('name') == EMPTY_CATEGORIES[nid] and number(b.get('amountPer100g')) is None and not b.get('sourceRow', {}).get('id'))])
            if empty:
                group = 'empty-category'
            elif attribute == 'name':
                group = 'metadata'
            elif attribute == 'present' or (attribute == 'amount' and None in (difference['api'], difference['csv'])):
                group = 'missing-value'
            elif attribute == 'unit' and (a is None or b is None):
                group = 'missing-value'
            else:
                group = 'material-nutrient'
        elif field.startswith('portion.'):
            group = 'portion-weight'  # Labels/units also affect interpreting a portion.
        elif field in ('fdcId','description','dataType','preparationStates'):
            group = 'identity-preparation'
        else:
            group = 'metadata'
        difference['category'] = group
        groups[group].append(difference)
    for nid, rows in record.get('duplicateNutrientRows', {}).items():
        issue = {'field':f'nutrient.{nid}.duplicateRows', 'api':rows,
                 'csv':old.get(nid), 'category':'material-nutrient'}
        differences.append(issue)
        groups['material-nutrient'].append(issue)
    informational = len(groups['metadata']) + len(groups['empty-category'])
    material = len(differences) - informational
    summary = {'totalDifferences':len(differences), 'materialDifferences':material,
               'informationalDifferences':informational, 'missingValueDifferences':len(groups['missing-value']),
               'portionDifferences':len(groups['portion-weight']),
               'preparationStateDifferences':sum(d['field']=='preparationStates' for d in differences),
               'identityPreparationDifferences':len(groups['identity-preparation']),
               'emptyCategoryDifferences':len(groups['empty-category']),
               'cleanNutritionalComparison':material == 0,
               'exactComparedFieldsMatch':not differences,
               'metadataScope':'Compared identity, publication date, nutrient names/units/amounts and portions; not byte-for-byte API/CSV equality.'}
    return {'status':'comparison-only-not-approval', 'differences':differences, 'groups':groups, 'summary':summary}

def request(endpoint, key, payload=None):
    # Fixed HTTPS host; redirects disabled so credentials cannot follow another host.
    req = Request(BASE + endpoint + '?' + urlencode({'api_key':key}),
                  data=json.dumps(payload).encode() if payload is not None else None,
                  headers={'Content-Type':'application/json', 'Accept':'application/json'})
    try:
        with build_opener(NoRedirect()).open(req, timeout=20) as response:
            data = response.read(10_000_001)
            if len(data) > 10_000_000:
                raise ReviewError('Response exceeds review size limit.')
            return json.loads(data)
    except HTTPError as exc:
        if exc.code == 429:
            raise ReviewError('USDA rate limit reached. Wait before trying again; no automatic retry.') from None
        raise ReviewError(f'USDA request failed (HTTP {exc.code}). Response details suppressed.') from None
    except ReviewError:
        raise
    except Exception:
        raise ReviewError('USDA request failed or timed out; details suppressed to protect credentials.') from None

def save(document, key):
    # Redact even if a remote response unexpectedly echoes credentials.
    encoded = json.dumps(document, indent=2, ensure_ascii=True)
    for secret in {key, urlencode({'x':key})[2:], json.dumps(key)[1:-1]}:
        if secret:
            encoded = encoded.replace(secret, '[REDACTED]')
    if PENDING.is_symlink() or PENDING.resolve() != HERE.resolve() / 'pending-review':
        raise ReviewError('Pending directory must be a regular local directory.')
    PENDING.mkdir(exist_ok=True)
    path = PENDING / (datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + uuid.uuid4().hex + '.json')
    with path.open('x', encoding='utf-8') as f:
        f.write(encoded)
    return path

def already_saved(fdc_id):
    for path in PENDING.glob('*.json'):
        try:
            data = json.loads(path.read_text(encoding='utf-8'))
            if (str(data.get('rawResponse', {}).get('fdcId')) == str(fdc_id)
                    and str(data.get('record', {}).get('fdcId')) == str(fdc_id)
                    and data.get('reviewStatus') == 'pending-review'
                    and data.get('approved') is False and data.get('publishable') is False):
                return True
        except (ValueError, OSError, AttributeError):
            continue
    return False

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='action', required=True)
    search = sub.add_parser('search')
    search.add_argument('query')
    search.add_argument('--include-branded', action='store_true')
    fetch = sub.add_parser('fetch')
    fetch.add_argument('fdc_id', type=int)
    fetch.add_argument('--expected-state', choices=['raw','cooked','dried','roasted','boiled','baked','fried','canned','frozen'])
    fetch.add_argument('--compare-pilot', action='store_true')
    fetch.add_argument('--skip-existing', action='store_true', help='Skip IDs already saved as pending reports; not an approval check.')
    args = parser.parse_args()
    key = os.environ.get('FDC_API_KEY', '').strip()
    try:
        if args.action == 'fetch' and args.skip_existing and already_saved(args.fdc_id):
            print('Existing pending report found; skipped fetch. Review is still required.')
            return 0
        if not key:
            raise ReviewError('FDC_API_KEY is missing from this process environment. Start a local terminal with the variable available.')
        if args.action == 'search':
            raw = request('foods/search', key, {'query':args.query, 'pageSize':15, 'dataType':GENERIC + (['Branded'] if args.include_branded else [])})
            document = {'searchResults':raw, 'note':'Discovery only; fetch exact IDs before verification.'}
        else:
            if args.fdc_id <= 0:
                raise ReviewError('FDC ID must be positive.')
            baseline = None
            if args.compare_pilot:
                baseline = json.loads((HERE/'pilot-source-records.json').read_text(encoding='utf-8'))
                if str(args.fdc_id) not in baseline:
                    raise ReviewError('This FDC ID is not in the retained pilot records.')
            raw = request(f'food/{args.fdc_id}', key)
            if str(raw.get('fdcId')) != str(args.fdc_id):
                raise ReviewError('Returned FDC ID does not match the requested ID.')
            record = normalize(raw, args.expected_state)
            document = {'record':record, 'rawResponse':raw}
            if baseline is not None:
                document['comparison'] = compare(record, baseline[str(args.fdc_id)])
        document.update({'retrievedAt':datetime.now(timezone.utc).isoformat(), 'source':'USDA FoodData Central API',
                         'reviewStatus':'pending-review', 'approved':False, 'publishable':False})
        path = save(document, key)
        print('Saved pending-review report: ' + str(path))
        if document.get('record', {}).get('verificationIssues'):
            print('Saved with duplicate nutrient rows requiring manual review; no value was selected.')
        if 'comparison' in document:
            print(json.dumps(document['comparison']['summary'], indent=2))
    except ReviewError as exc:
        # Messages are ours, never server bodies, URLs or exception representations.
        print(str(exc).replace(key, '[REDACTED]') if key else str(exc), file=sys.stderr)
        return 1
    except Exception:
        print('Review failed; diagnostic details suppressed to protect credentials.', file=sys.stderr)
        return 1
    return 0

if __name__ == '__main__':
    sys.exit(main())
