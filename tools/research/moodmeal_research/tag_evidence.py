"""Stage C: measure each qualitative food tag against USDA amounts (report only).

A food tag "meets" the threshold when every candidate record for that food has at
least `threshold` of the FDA Daily Value per reference amount customarily consumed
(RACC). Nothing here approves a record, edits a tag or reaches the app; results are
inputs for the owner's stage D review. Unknown stays unknown: a missing or
duplicate nutrient row is never treated as zero.
"""
import json
import re
from pathlib import Path

from .config import REPO

FOOD_MAP = REPO / 'tools/research/stage-c-food-map.json'
KNOWLEDGE = REPO / 'research-output/knowledge.json'

# 21 CFR 101.9(c)(8)(iv) and (c)(9), adults and children 4+; retrieved 2026-11-04.
DAILY_VALUES = {
    'protein': {'fdcNutrientId': '1003', 'dv': 50.0, 'unit': 'G'},
    # Foundation records report fiber by AOAC 2011.25 (2033) instead of 1079; used only when 1079 is absent.
    'fiber': {'fdcNutrientId': '1079', 'dv': 28.0, 'unit': 'G', 'fallbackNutrientId': '2033'},
    'calcium': {'fdcNutrientId': '1087', 'dv': 1300.0, 'unit': 'MG'},
    'iron': {'fdcNutrientId': '1089', 'dv': 18.0, 'unit': 'MG'},
    'magnesium': {'fdcNutrientId': '1090', 'dv': 420.0, 'unit': 'MG'},
    'vitamin-c': {'fdcNutrientId': '1162', 'dv': 90.0, 'unit': 'MG'},
    'b6': {'fdcNutrientId': '1175', 'dv': 1.7, 'unit': 'MG'},
    'b12': {'fdcNutrientId': '1178', 'dv': 2.4, 'unit': 'UG'},
}
NO_DAILY_VALUE = {'water', 'omega-3'}
DV_CITATION = '21 CFR 101.9(c)(8)(iv) and (c)(9); "good source" threshold from 21 CFR 101.54(c)(1)'
US_CUP_ML = 236.5882365
# Amounts exactly at the threshold must not fail on floating-point error (e.g. 2.8 g / 28 g).
TOLERANCE = 1e-9
BORDERLINE = 0.005  # within half a percentage point of the threshold
PROTEIN_CAVEAT = ('Protein is not corrected for quality (PDCAAS). FDA requires a corrected %DV '
                  'for a protein claim (21 CFR 101.9(c)(7)), so this is an upper bound.')


def load(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def cup_grams(record):
    """Grams in one cup from the record's own portions; None unless exactly one 1-cup portion exists."""
    cups = [p for p in record.get('portions', [])
            if p.get('gramWeight') and (p.get('amount') in (1, 1.0, None))
            and any(re.fullmatch(r'(1\s+)?cups?', (p.get(k) or '').strip(), re.I)
                    for k in ('modifier', 'portionDescription'))]
    return (cups[0]['gramWeight'], cups[0]['id']) if len(cups) == 1 else (None, None)


def racc_grams(food, record_entry, record):
    """Reference amount in grams for this record's form, with how it was derived; (None, reason) if unavailable."""
    racc = food.get('racc') or {}
    amount = racc.get(record_entry['form'])
    if not amount:
        return None, f'no RACC for form "{record_entry["form"]}"'
    value, unit = amount
    if unit == 'g':
        return float(value), f'{value} g ({record_entry["form"]})'
    if unit == 'mL':
        grams, portion = cup_grams(record)
        if grams is None:
            return None, f'{value} mL needs exactly one 1 cup portion to convert; none or several found'
        return grams * value / US_CUP_ML, f'{value} mL via portion {portion} (1 cup = {grams} g)'
    return None, f'unsupported RACC unit {unit}'


def outcome_for(nutrient_id, food, record_entry, record, threshold):
    """One record's result for one tag."""
    base = {'fdcId': record_entry['fdcId'], 'basis': record_entry['basis'], 'form': record_entry['form']}
    if record is None:
        return {**base, 'outcome': 'unknown', 'reason': 'record not in CSV snapshot'}
    base['description'] = record['description']
    dv = DAILY_VALUES[nutrient_id]
    row, nutrient_used = record['nutrients'].get(dv['fdcNutrientId']), dv['fdcNutrientId']
    fallback = dv.get('fallbackNutrientId')
    if row is None and fallback and record['nutrients'].get(fallback):
        row, nutrient_used = record['nutrients'][fallback], fallback
    if row is None or row.get('amountPer100g') is None:
        reason = 'duplicate nutrient rows' if row and row.get('resolution') else 'no value in record'
        return {**base, 'outcome': 'unknown', 'reason': reason}
    if (row.get('unit') or '').upper() != dv['unit']:
        return {**base, 'outcome': 'unknown', 'reason': f'unit {row.get("unit")} is not {dv["unit"]}'}
    grams, how = racc_grams(food, record_entry, record)
    if grams is None:
        return {**base, 'outcome': 'unknown', 'reason': how}
    per_racc = row['amountPer100g'] * grams / 100
    pct = per_racc / dv['dv']
    if abs(pct - threshold) < BORDERLINE:
        base['borderline'] = True
    if nutrient_used != dv['fdcNutrientId']:
        base['nutrientRow'] = f'{nutrient_used} {row.get("name")} (no {dv["fdcNutrientId"]} row)'
    return {**base, 'outcome': 'meets' if pct >= threshold - TOLERANCE else 'below', 'raccGrams': round(grams, 2),
            'racc': how, 'amountPer100g': row['amountPer100g'], 'unit': dv['unit'],
            'amountPerRacc': round(per_racc, 4), 'percentDV': round(pct * 100, 1),
            'sourceRowId': row.get('sourceRowId')}


def combine(outcomes):
    kinds = {o['outcome'] for o in outcomes}
    if not outcomes or kinds == {'unknown'}:
        return 'unknown'
    if kinds == {'meets'}:
        return 'meets'
    if kinds == {'below'}:
        return 'below'
    return 'record-dependent'


def evaluate_foods(food_map, records, food_tags, threshold):
    """{foodId: {nutrientId: result}} for every tagged food."""
    foods = {f['foodId']: f for f in food_map['foods']}
    results = {}
    for food_id, tags in food_tags.items():
        food = foods.get(food_id)
        results[food_id] = {}
        for nutrient_id in tags:
            if nutrient_id in NO_DAILY_VALUE:
                results[food_id][nutrient_id] = {'status': 'not-assessable',
                                                 'reason': f'{nutrient_id} has no FDA Daily Value', 'records': []}
                continue
            if nutrient_id not in DAILY_VALUES:
                results[food_id][nutrient_id] = {'status': 'not-assessable', 'reason': 'unmapped nutrient',
                                                 'records': []}
                continue
            if food is None or not food.get('records'):
                results[food_id][nutrient_id] = {'status': 'unknown', 'reason': 'no candidate record mapped',
                                                 'records': []}
                continue
            outcomes = [outcome_for(nutrient_id, food, r, records.get(r['fdcId']), threshold)
                        for r in food['records']]
            result = {'status': combine(outcomes), 'records': outcomes}
            if nutrient_id == 'protein':
                result['caveat'] = PROTEIN_CAVEAT
            results[food_id][nutrient_id] = result
    return results


def roll_up_meal(food_results, nutrient_id, food_ids):
    """A meal tag is inherited from its contributing foods; meal amounts are not assessed."""
    statuses = [food_results.get(f, {}).get(nutrient_id, {}).get('status', 'unknown') for f in food_ids]
    if nutrient_id in NO_DAILY_VALUE:
        status = 'not-assessable'
    elif not statuses or all(s == 'unknown' for s in statuses):
        status = 'unknown'
    elif all(s == 'meets' for s in statuses):
        status = 'all-contributors-meet'
    elif 'meets' in statuses:
        status = 'some-contributors-meet'
    elif 'record-dependent' in statuses:
        status = 'contributors-record-dependent'
    elif all(s == 'below' for s in statuses):
        status = 'no-contributor-meets'
    else:
        status = 'unknown'
    return {'status': status, 'contributors': dict(zip(food_ids, statuses))}


def build_report(knowledge, food_map, records, threshold, snapshot):
    food_claims = [c for c in knowledge['claims'] if c['claimType'] == 'food-nutrient']
    meal_claims = [c for c in knowledge['claims'] if c['claimType'] == 'meal-nutrient-derived']
    food_tags = {}
    for c in food_claims:
        _, food_id, nutrient_id = c['id'].split(':')
        food_tags.setdefault(food_id, []).append(nutrient_id)
    food_results = evaluate_foods(food_map, records, food_tags, threshold)
    foods = [{'claimId': c['id'], 'foodId': c['id'].split(':')[1], 'subject': c['subject'],
              'nutrientId': c['id'].split(':')[2], **food_results[c['id'].split(':')[1]][c['id'].split(':')[2]]}
             for c in food_claims]
    meals = []
    for c in meal_claims:
        _, meal_id, nutrient_id = c['id'].split(':')
        meals.append({'claimId': c['id'], 'mealId': meal_id, 'subject': c['subject'], 'nutrientId': nutrient_id,
                      **roll_up_meal(food_results, nutrient_id, c.get('foodIds') or []),
                      'note': 'Meal quantities are not compared with a reference amount; 21 CFR 101.54(c)(1) '
                              'excludes meal and main-dish products from the per-RACC definition.'})

    def count(items):
        out = {}
        for i in items:
            out[i['status']] = out.get(i['status'], 0) + 1
        return dict(sorted(out.items()))

    return {
        'kind': 'moodmeal-stage-c-tag-evidence',
        'stage': 'C (report only; no app or tag changes)',
        'threshold': {'fractionOfDV': threshold, 'perReference': 'RACC', 'citation': DV_CITATION},
        'dailyValues': DAILY_VALUES,
        'csvSnapshot': snapshot,
        'knowledgeSourceCommit': knowledge.get('sourceCommit'), 'knowledgeDirtyTree': knowledge.get('dirtyTree'),
        'summary': {'foodTags': len(foods), 'foodStatus': count(foods),
                    'mealTags': len(meals), 'mealStatus': count(meals)},
        'foodTags': foods, 'mealTags': meals,
    }


def required_fdc_ids(food_map):
    return sorted({r['fdcId'] for f in food_map['foods'] for r in f.get('records', [])})


def render_markdown(report):
    s = report['summary']
    pct = report['threshold']['fractionOfDV'] * 100
    lines = [
        '# Stage C: food tag evidence (report only)', '',
        f'Threshold: at least {pct:g}% of the FDA Daily Value per reference amount customarily consumed '
        f'(RACC). Source: {report["threshold"]["citation"]}. CSV snapshot: {report["csvSnapshot"]}. '
        f'Knowledge export from {report["knowledgeSourceCommit"]}.', '',
        'No tag, record or app text was changed. Records are candidates, not approvals. '
        'Unknown values stay unknown.', '',
        f'**Food tags ({s["foodTags"]}):** ' + ', '.join(f'{k} {v}' for k, v in s['foodStatus'].items()), '',
        f'**Meal tags ({s["mealTags"]}):** ' + ', '.join(f'{k} {v}' for k, v in s['mealStatus'].items()), '',
        '## Food tags', '',
        '| Food | Tag | Status | %DV per RACC by record |', '| --- | --- | --- | --- |',
    ]
    for f in report['foodTags']:
        detail = '; '.join(
            f'{r["fdcId"]} {r["percentDV"]}%' + (' (borderline)' if r.get('borderline') else '')
            + (f' [{r["nutrientRow"]}]' if 'nutrientRow' in r else '')
            if 'percentDV' in r else f'{r["fdcId"]} unknown ({r["reason"]})'
            for r in f['records']) or f.get('reason', '')
        lines.append(f'| {f["subject"]} | {f["nutrientId"]} | {f["status"]} | {detail} |')
    lines += ['', 'Protein percentages are not PDCAAS-corrected and are an upper bound. '
              '"Borderline" means within half a percentage point of the threshold.', '',
              '## Meal tags', '', '| Meal | Tag | Status | Contributing foods |', '| --- | --- | --- | --- |']
    for m in report['mealTags']:
        contributors = ', '.join(f'{k} ({v})' for k, v in m['contributors'].items())
        lines.append(f'| {m["subject"]} | {m["nutrientId"]} | {m["status"]} | {contributors} |')
    lines += ['', 'Meal statuses are inherited from foods only; ingredient quantities in each meal are not assessed.', '']
    return '\n'.join(lines)
