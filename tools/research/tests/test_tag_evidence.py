"""Stage C tag-evidence tests with synthetic records: thresholds, unknowns, forms and roll-up."""
import unittest

from moodmeal_research import tag_evidence as te


def record(fdc, nutrients, portions=()):
    return {'fdcId': fdc, 'description': f'Food {fdc}', 'portions': list(portions),
            'nutrients': {nid: {'name': name, 'unit': unit, 'amountPer100g': amt, 'sourceRowId': f'r{nid}'}
                          for nid, (name, unit, amt) in nutrients.items()}}


FIBER = '1079'
FOOD_MAP = {'foods': [
    {'foodId': 'berry', 'racc': {'as-sold': [140, 'g']},
     'records': [{'fdcId': '1', 'form': 'as-sold', 'basis': 'ledger-candidate'}]},
    {'foodId': 'mix', 'racc': {'as-sold': [140, 'g']},
     'records': [{'fdcId': '1', 'form': 'as-sold', 'basis': 'ledger-candidate'},
                 {'fdcId': '2', 'form': 'as-sold', 'basis': 'ledger-candidate'}]},
    {'foodId': 'fish', 'racc': {'cooked': [85, 'g'], 'raw': [110, 'g']},
     'records': [{'fdcId': '3', 'form': 'raw', 'basis': 'ledger-candidate'}]},
    {'foodId': 'kefir', 'racc': {'as-sold': [240, 'mL']},
     'records': [{'fdcId': '4', 'form': 'as-sold', 'basis': 'ledger-candidate'}]},
    {'foodId': 'oats', 'racc': {'dry': [40, 'g']},
     'records': [{'fdcId': '5', 'form': 'dry', 'basis': 'proposed-stage-c'}]},
]}
RECORDS = {
    '1': record('1', {FIBER: ('Fiber', 'G', 2.0)}),          # 2.8 g per 140 g = exactly 10% DV
    '2': record('2', {FIBER: ('Fiber', 'G', 1.0)}),          # 5% DV
    '3': record('3', {'1003': ('Protein', 'G', 20.0), FIBER: ('Fiber', 'G', None)}),
    '4': record('4', {'1087': ('Calcium', 'MG', 130.0)},
                [{'id': 'p1', 'amount': None, 'gramWeight': 244.0, 'modifier': '10205', 'portionDescription': '1 cup'}]),
    '5': record('5', {'2033': ('Total dietary fiber (AOAC 2011.25)', 'G', 10.0)}),
}


def run(tags, threshold=0.10, records=RECORDS):
    return te.evaluate_foods(FOOD_MAP, records, tags, threshold)


class TagEvidenceTests(unittest.TestCase):
    def test_exact_threshold_meets_and_is_borderline(self):
        result = run({'berry': ['fiber']})['berry']['fiber']
        self.assertEqual(result['status'], 'meets')
        self.assertTrue(result['records'][0]['borderline'])
        self.assertEqual(result['records'][0]['percentDV'], 10.0)

    def test_records_that_disagree_are_record_dependent(self):
        self.assertEqual(run({'mix': ['fiber']})['mix']['fiber']['status'], 'record-dependent')

    def test_stricter_threshold_turns_meets_into_below(self):
        self.assertEqual(run({'berry': ['fiber']}, threshold=0.20)['berry']['fiber']['status'], 'below')

    def test_missing_value_is_unknown_not_zero(self):
        result = run({'fish': ['fiber']})['fish']['fiber']
        self.assertEqual(result['status'], 'unknown')
        self.assertNotIn('percentDV', result['records'][0])

    def test_duplicate_rows_stay_unknown(self):
        records = dict(RECORDS)
        records['1'] = record('1', {})
        records['1']['nutrients'][FIBER] = {'name': 'Fiber', 'unit': 'G', 'amountPer100g': None,
                                            'sourceRowId': None, 'resolution': 'duplicate-id-manual-review-required'}
        result = run({'berry': ['fiber']}, records=records)['berry']['fiber']
        self.assertEqual(result['records'][0]['reason'], 'duplicate nutrient rows')

    def test_raw_record_uses_the_raw_reference_amount(self):
        out = run({'fish': ['protein']})['fish']['protein']
        self.assertEqual(out['records'][0]['raccGrams'], 110.0)
        self.assertEqual(out['records'][0]['percentDV'], 44.0)
        self.assertIn('PDCAAS', out['caveat'])

    def test_volume_reference_converts_through_the_cup_portion(self):
        rec = run({'kefir': ['calcium']})['kefir']['calcium']['records'][0]
        self.assertAlmostEqual(rec['raccGrams'], 244 * 240 / te.US_CUP_ML, places=2)
        self.assertEqual(rec['outcome'], 'meets')

    def test_volume_reference_without_a_single_cup_portion_is_unknown(self):
        records = dict(RECORDS)
        records['4'] = record('4', {'1087': ('Calcium', 'MG', 130.0)})
        self.assertEqual(run({'kefir': ['calcium']}, records=records)['kefir']['calcium']['status'], 'unknown')

    def test_fiber_fallback_is_named(self):
        rec = run({'oats': ['fiber']})['oats']['fiber']['records'][0]
        self.assertEqual(rec['percentDV'], 14.3)
        self.assertIn('2033', rec['nutrientRow'])

    def test_wrong_unit_is_unknown(self):
        records = dict(RECORDS)
        records['1'] = record('1', {FIBER: ('Fiber', 'MG', 2000.0)})
        self.assertEqual(run({'berry': ['fiber']}, records=records)['berry']['fiber']['status'], 'unknown')

    def test_nutrients_without_a_daily_value_are_not_assessed(self):
        out = run({'berry': ['water', 'omega-3']})['berry']
        self.assertEqual({out['water']['status'], out['omega-3']['status']}, {'not-assessable'})

    def test_unmapped_food_is_unknown(self):
        self.assertEqual(run({'nothing': ['fiber']})['nothing']['fiber']['status'], 'unknown')

    def test_meal_roll_up(self):
        foods = run({'berry': ['fiber'], 'mix': ['fiber'], 'fish': ['fiber']})
        self.assertEqual(te.roll_up_meal(foods, 'fiber', ['berry'])['status'], 'all-contributors-meet')
        self.assertEqual(te.roll_up_meal(foods, 'fiber', ['berry', 'mix'])['status'], 'some-contributors-meet')
        self.assertEqual(te.roll_up_meal(foods, 'fiber', ['mix'])['status'], 'contributors-record-dependent')
        self.assertEqual(te.roll_up_meal(foods, 'fiber', ['fish'])['status'], 'unknown')
        self.assertEqual(te.roll_up_meal(foods, 'fiber', [])['status'], 'unknown')

    def test_report_covers_every_food_and_meal_tag(self):
        knowledge = {'sourceCommit': 'abc', 'dirtyTree': False, 'claims': [
            {'id': 'food-nutrient:berry:fiber', 'claimType': 'food-nutrient', 'subject': 'Berry'},
            {'id': 'meal-nutrient:bowl:fiber', 'claimType': 'meal-nutrient-derived', 'subject': 'Bowl',
             'foodIds': ['berry']},
            {'id': 'recipe:r1', 'claimType': 'recipe', 'subject': 'R'}]}
        report = te.build_report(knowledge, FOOD_MAP, RECORDS, 0.10, 'snap')
        self.assertEqual(report['summary'], {'foodTags': 1, 'foodStatus': {'meets': 1},
                                             'mealTags': 1, 'mealStatus': {'all-contributors-meet': 1}})
        self.assertIn('Berry', te.render_markdown(report))


class RealFoodMapTests(unittest.TestCase):
    def test_every_record_is_a_labelled_candidate_with_a_reference_amount(self):
        food_map = te.load(te.FOOD_MAP)
        bases = set(food_map['recordBasis'])
        for food in food_map['foods']:
            for r in food['records']:
                self.assertIn(r['basis'], bases, food['foodId'])
                self.assertIn(r['form'], food['racc'], food['foodId'])
                self.assertIn(food['racc']['citation'], food_map['raccCitations'], food['foodId'])


if __name__ == '__main__':
    unittest.main()
