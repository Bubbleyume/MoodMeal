"""Regenerate src/data/foodTagReviews.ts (stage D batches 1-4, owner decisions 2026-11-04).

Run: python -I -B tools/research/generate_food_tag_reviews.py C:/path/to/FoodData_Central_csv_2026-04-30

This owner-run script is the one exception to the research package's rule of never writing under src/:
it writes only src/data/foodTagReviews.ts, from decisions the owner approved. Review the diff before committing.
"""
import copy
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / 'tools/research'))
from moodmeal_research import tag_evidence as te  # noqa: E402
from moodmeal_research.adapters.usda_csv import UsdaCsvAdapter  # noqa: E402

WITHDRAW = [('walnuts', 'protein'), ('walnuts', 'fiber'), ('sweet-potato', 'fiber'), ('spinach', 'fiber'),
            ('brown-rice', 'fiber'), ('watermelon', 'fiber'), ('cucumber', 'fiber'), ('pumpkin-seeds', 'fiber'),
            ('rainbow-carrots', 'fiber'), ('pineapple', 'fiber'), ('swiss-chard', 'fiber'), ('chia-pudding', 'protein')]
KEEP = [('spinach', 'iron'), ('strawberries', 'fiber'), ('mixed-berries', 'fiber')]
ADD = [('pineapple', 'vitamin-c'), ('swiss-chard', 'vitamin-c'), ('swiss-chard', 'magnesium'),
       ('watermelon', 'vitamin-c'), ('spinach', 'vitamin-c'), ('sweet-potato', 'b6'), ('brown-rice', 'b6'),
       ('walnuts', 'magnesium')]
NOTES = {
    ('spinach', 'iron'): 'Owner decision 2: evidence is generic raw spinach (168462); baby spinach (1999632, 6.0%) is a different product.',
    ('strawberries', 'fiber'): 'Owner decision 3: exactly at the 10% bar; kept.',
    ('mixed-berries', 'fiber'): 'Owner decision 3: lowest candidate record is exactly at the 10% bar; kept.',
}
RECORD_FILTER = {('spinach', 'iron'): {'168462'}}

# Batch 2 (docs/research/STAGE-D-BATCH-2.md): new tags, and supported-looking pairs held back.
ADD_2 = [('wild-salmon', 'b6'), ('mixed-berries', 'vitamin-c'), ('banana', 'vitamin-c'), ('kale', 'calcium'),
         ('kale', 'vitamin-c'), ('lean-beef', 'b6'), ('quinoa', 'iron'), ('quinoa', 'magnesium'), ('quinoa', 'b6'),
         ('blueberries', 'vitamin-c'), ('kefir', 'b12'), ('pumpkin-seeds', 'iron'), ('chia-pudding', 'calcium'),
         ('chia-pudding', 'iron'), ('chia-pudding', 'magnesium')]
HOLD_2 = {
    ('steel-cut-oats', 'protein'): ('meets', 'Batch 2, decision 2: exactly 10.0% before protein-quality (PDCAAS) '
                                    'correction, which would put oats below the bar; rolled oats and oat flour also '
                                    'map to this steel-cut record. Not added.'),
    ('dark-chocolate', 'fiber'): ('meets', 'Batch 2, decision 3: only the 70-85% cacao record is mapped and the '
                                  "recipes' cacao percentage is unresolved. Not added until it is chosen."),
    ('popcorn', 'magnesium'): ('record-dependent', 'Batch 2, decision 4: the two air-popped records disagree '
                               '(10.3% and 9.4%) and the recipe does not say salted or unsalted. Not added.'),
}

# Batch 3 (docs/research/STAGE-D-BATCH-3.md): owner confirmation of AI-reviewed tags that meet the bar.
CONFIRM_3 = [('wild-salmon', 'b12'), ('steel-cut-oats', 'fiber'), ('steel-cut-oats', 'magnesium'),
             ('dark-chocolate', 'iron'), ('dark-chocolate', 'magnesium'), ('greek-yogurt', 'calcium'),
             ('greek-yogurt', 'b12'), ('citrus-orange', 'vitamin-c'), ('citrus-orange', 'fiber'), ('banana', 'fiber'),
             ('banana', 'b6'), ('spinach', 'magnesium'), ('kale', 'fiber'), ('lean-beef', 'iron'), ('lean-beef', 'b12'),
             ('quinoa', 'fiber'), ('eggs', 'b12'), ('blueberries', 'fiber'), ('kefir', 'calcium'),
             ('brown-rice', 'magnesium'), ('avocado', 'fiber'), ('turkey', 'b12'), ('turkey', 'b6'),
             ('almonds', 'magnesium'), ('almonds', 'fiber'), ('apple', 'fiber'), ('pumpkin-seeds', 'magnesium'),
             ('popcorn', 'fiber'), ('strawberries', 'vitamin-c'), ('chia-pudding', 'fiber')]
CONFIRM_3_PROTEIN = [('wild-salmon', 'protein'), ('greek-yogurt', 'protein'), ('lean-beef', 'protein'),
                     ('eggs', 'protein'), ('kefir', 'protein'), ('turkey', 'protein')]
HOLD_3 = [('quinoa', 'protein'), ('almonds', 'protein'), ('pumpkin-seeds', 'protein')]
# Records checked for the batch 3 packet beyond the stage C map (batch 3 only; batches 1-2 are unchanged).
EXTRA_3 = {'dark-chocolate': [('170271', 'as-sold'), ('170272', 'as-sold')], 'steel-cut-oats': [('173904', 'dry')],
           'avocado': [('171706', 'as-sold')]}

# Batch 4 (docs/research/STAGE-D-BATCH-4.md): the app's own rules for nutrients with no FDA Daily Value.
WATER_RULE_PERCENT = 90.0  # FDC 1051, g water per 100 g of the record
WATER_4 = {'chamomile-tea': ['174156'], 'green-tea': ['171917'], 'cucumber': ['168409'],
           'coconut-water': ['174831'], 'watermelon': ['167765']}
OMEGA3_RULE_GRAMS = 0.16  # 10% of the 1.6 g/day ALA Adequate Intake (National Academies, men)
OMEGA3_4 = ['wild-salmon', 'walnuts', 'chia-pudding']  # records from the stage C map
EPA, DPA, DHA = '1278', '1280', '1272'

fm = te.load(te.FOOD_MAP)
foods = {f['foodId']: f for f in fm['foods']}
csv = Path(sys.argv[1])  # FoodData Central CSV folder
fm3 = copy.deepcopy(fm)
for f in fm3['foods']:
    f['records'] = f['records'] + [{'fdcId': i, 'form': form, 'basis': 'batch-3-check'}
                                   for i, form in EXTRA_3.get(f['foodId'], [])]
records = {k: v['record'] for k, v in UsdaCsvAdapter(csv).load(
    sorted(set(te.required_fdc_ids(fm3)) | {i for ids in WATER_4.values() for i in ids})).items()}
tags = {}
for f, n in WITHDRAW + KEEP + ADD + ADD_2 + list(HOLD_2):
    tags.setdefault(f, []).append(n)
results = te.evaluate_foods(fm, records, tags, 0.10)

entries = []


def entry(batch, f, n, decision, action, note, recs):
    entries.append({
        'foodId': f, 'nutrientId': n, 'batch': batch, 'decision': decision, 'action': action, 'note': note,
        'evidence': [x if 'rule' in x else
                     {'fdcId': x['fdcId'], 'description': x['description'], 'raccGrams': x['raccGrams'],
                      'raccCategory': foods[f]['racc']['category'], 'percentDV': x['percentDV']}
                     for x in recs]})


for group, decision, expected in ((WITHDRAW, 'needs-review', 'below'), (KEEP, 'published', None),
                                  (ADD, 'published', 'meets')):
    for f, n in group:
        r = results[f][n]
        if expected:
            assert r['status'] == expected, (f, n, r['status'])
        recs = [x for x in r['records'] if x['fdcId'] in RECORD_FILTER.get((f, n), {x['fdcId']})]
        if decision == 'published':
            assert all(x['outcome'] == 'meets' for x in recs), (f, n)
        note = NOTES.get((f, n)) or ('Owner decision 1: below the 10% bar; withdrawn, kept on record.'
                                     if decision == 'needs-review' else
                                     'Owner decision 4: new tag supported by the same evidence and bar.')
        action = 'withdrawn' if decision == 'needs-review' else ('added' if (f, n) in ADD else 'kept')
        entry(1, f, n, decision, action, note, recs)

for f, n in ADD_2:
    r = results[f][n]
    assert r['status'] == 'meets' and all(x['outcome'] == 'meets' for x in r['records']), (f, n)
    entry(2, f, n, 'published', 'added', 'Batch 2, decision 1: meets the 10% bar on every mapped record.',
          r['records'])
for (f, n), (expected, note) in HOLD_2.items():
    r = results[f][n]
    assert r['status'] == expected, (f, n, r['status'])
    entry(2, f, n, 'needs-review', 'held', note, [x for x in r['records'] if x['percentDV'] is not None])

tags3 = {}
for f, n in CONFIRM_3 + CONFIRM_3_PROTEIN + HOLD_3:
    tags3.setdefault(f, []).append(n)
results3 = te.evaluate_foods(fm3, records, tags3, 0.10)
for group, note in ((CONFIRM_3, 'Batch 3, decision 1: meets the 10% bar on every record checked; confirmed by the owner.'),
                    (CONFIRM_3_PROTEIN, 'Batch 3, decision 2: animal protein; meets the 10% bar on every record. '
                                        'The %DV is not corrected for protein quality (PDCAAS).')):
    for f, n in group:
        r = results3[f][n]
        assert r['status'] == 'meets' and all(x['outcome'] == 'meets' for x in r['records']), (f, n)
        entry(3, f, n, 'published', 'confirmed', note, r['records'])
for f, n in HOLD_3:
    r = results3[f][n]
    assert r['status'] == 'meets', (f, n, r['status'])
    entry(3, f, n, 'needs-review', 'held', 'Batch 3, decision 3: plant protein at 10% or more only before '
          'protein-quality (PDCAAS) correction; held until reviewed PDCAAS values are recorded.', r['records'])


def amount(record, nutrient_id):
    row = record['nutrients'].get(nutrient_id)
    return None if row is None else row['amountPer100g']


for f, ids in WATER_4.items():
    ev = []
    for i in ids:
        w = amount(records[i], '1051')
        assert w is not None and w >= WATER_RULE_PERCENT, (f, i, w)
        ev.append({'fdcId': i, 'description': records[i]['description'], 'raccGrams': None, 'raccCategory': None,
                   'percentDV': None, 'rule': 'water-percent', 'waterPercent': w})
    entry(4, f, 'water', 'published', 'confirmed', 'Batch 4, decision 1: at least 90% water by weight '
          '(MoodMeal rule; water has no FDA Daily Value).', ev)
for f in OMEGA3_4:
    ev = []
    for rec_entry in foods[f]['records']:
        i = rec_entry['fdcId']
        rec = records[i]
        grams, _ = te.racc_grams(foods[f], rec_entry, rec)
        assert grams, (f, i)
        ala_id = '1404' if amount(rec, '1404') is not None else '1270'
        parts = [amount(rec, ala_id)] + [amount(rec, n) for n in (EPA, DPA, DHA)]
        assert parts[0] is not None, (f, i)
        total = round(sum(x or 0 for x in parts) * grams / 100, 2)
        epa_dha = None if amount(rec, EPA) is None or amount(rec, DHA) is None else             round((amount(rec, EPA) + amount(rec, DHA)) * grams / 100, 2)
        assert total >= OMEGA3_RULE_GRAMS, (f, i, total)
        ev.append({'fdcId': i, 'description': rec['description'], 'raccGrams': grams,
                   'raccCategory': foods[f]['racc']['category'], 'percentDV': None, 'rule': 'omega-3-grams',
                   'omega3Grams': total, 'epaDhaGrams': epa_dha, 'alaNutrientId': ala_id})
    entry(4, f, 'omega-3', 'published', 'confirmed', 'Batch 4, decision 2: at least 0.16 g of ALA, EPA, DPA and DHA '
          'per reference amount (MoodMeal rule: 10% of the 1.6 g ALA Adequate Intake; no FDA Daily Value).', ev)

body = json.dumps(entries, indent=2, ensure_ascii=False)
ts = f'''import type {{ ReviewStatus }} from "../types/library";

/**
 * Owner-reviewed food nutrient tags (stage D batches 1-4, 2026-11-04).
 * Bar: at least 10% of the FDA Daily Value per reference amount customarily consumed
 * (21 CFR 101.9, 101.12(b), 101.54(c)(1)); amounts from the USDA FoodData Central
 * CSV snapshot of 2026-04-30. Water (at least 90% by weight) and omega-3 (at least 0.16 g per reference
 * amount) use MoodMeal's own batch 4 rules, because FDA sets no Daily Value for them. Generated by tools/research/generate_food_tag_reviews.py; do not edit by hand.
 * Withdrawn and held tags stay here as needs-review and are absent from FOOD_FACTS. "held" means the
 * evidence looked supportive but the owner chose not to publish the tag; the note says why.
 */
export interface FoodTagEvidence {{
  fdcId: string;
  description: string;
  /** Null for water, which uses percent by weight instead of a reference amount. */
  raccGrams: number | null;
  raccCategory: string | null;
  /** Null for water and omega-3, which have no FDA Daily Value (batch 4 rules). */
  percentDV: number | null;
  rule?: "water-percent" | "omega-3-grams";
  waterPercent?: number;
  /** ALA + EPA + DPA + DHA per reference amount; ALA from FDC 1404, or 1270 where 1404 is absent. */
  omega3Grams?: number;
  epaDhaGrams?: number | null;
  alaNutrientId?: "1404" | "1270";
}}
export interface FoodTagReview {{
  foodId: string;
  nutrientId: string;
  batch: 1 | 2 | 3 | 4;
  decision: Extract<ReviewStatus, "published" | "needs-review">;
  action: "kept" | "added" | "confirmed" | "withdrawn" | "held";
  note: string;
  evidence: FoodTagEvidence[];
}}
export const FOOD_TAG_REVIEW_DATE = "2026-11-04";
export const FOOD_TAG_SNAPSHOT = "FoodData_Central_csv_2026-04-30";
export const FOOD_TAG_REVIEWS: FoodTagReview[] = {body};
'''
(REPO / 'src/data/foodTagReviews.ts').write_text(ts, encoding='utf-8')
print(len(entries), 'entries written')
