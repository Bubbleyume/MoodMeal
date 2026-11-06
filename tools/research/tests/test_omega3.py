"""Omega-3 food-tag evidence (rule review, option B): unrounded thresholds, unknown vs zero, K1 eligibility."""
import unittest

from moodmeal_research import omega3 as o3

DERIVATION = {'1': 'A', '3': 'AR', '57': 'RA', '68': 'Z'}


def row(amount, derivation_id='1', data_points='5', row_id='r'):
    return {'id': row_id, 'amount': amount, 'derivation_id': derivation_id, 'data_points': data_points}


def record(ala, epa=None, dpa=None, dha=None, ala_id='1404'):
    rows = {ala_id: ala}
    for nid, r in (('1278', epa), ('1280', dpa), ('1272', dha)):
        if r is not None:
            rows[nid] = r
    return rows


class UnroundedThreshold(unittest.TestCase):
    def per_racc(self, rows, grams=30):
        _, parts = o3.components(rows, DERIVATION)
        ala, combined = o3.per_100g(parts)
        return {'ala': None if ala is None else ala * grams / 100,
                'combined': None if combined is None else combined * grams / 100}

    def test_just_below_the_criterion_fails_although_it_rounds_to_it(self):
        r = self.per_racc(record(row('0.53')))  # 0.53 g/100 g x 30 g = 0.159 g
        self.assertAlmostEqual(r['ala'], 0.159)
        self.assertEqual(o3.display(r['ala']), 0.16)
        self.assertFalse(o3.meets(r['ala']))
        self.assertIsNone(o3.tag_path([r]))

    def test_just_below_on_the_combined_path_fails(self):
        r = self.per_racc(record(row('0.23'), row('0.1'), row('0.1'), row('0.1')))  # 0.53 g/100 g -> 0.159 g
        self.assertAlmostEqual(r['combined'], 0.159)
        self.assertIsNone(o3.tag_path([r]))

    def test_at_the_criterion_meets(self):
        r = self.per_racc(record(row('0.534')))  # 0.1602 g
        self.assertEqual(o3.tag_path([r]), 'ala')

    def test_every_record_must_meet_and_combined_comes_first(self):
        a = {'ala': 0.32, 'combined': 2.22}
        b = {'ala': 0.05, 'combined': 0.93}
        self.assertEqual(o3.tag_path([a, b]), 'combined')
        self.assertIsNone(o3.tag_path([{'ala': 0.05, 'combined': None}]))
        self.assertEqual(o3.tag_path([{'ala': 5.35, 'combined': None}]), 'ala')
        self.assertIsNone(o3.tag_path([]))


class UnknownVersusZero(unittest.TestCase):
    def test_a_missing_component_leaves_the_combined_total_unknown(self):
        _, parts = o3.components(record(row('17.83')), DERIVATION)
        ala, combined = o3.per_100g(parts)
        self.assertEqual(ala, 17.83)
        self.assertIsNone(combined)
        self.assertIsNone(o3.display(combined))
        self.assertFalse(o3.meets(None))

    def test_a_reported_zero_stays_zero(self):
        _, parts = o3.components(record(row('9.08'), row('0'), row('0'), row('0'), ala_id='1270'), DERIVATION)
        ala, combined = o3.per_100g(parts)
        self.assertEqual(ala, 9.08)
        self.assertEqual(combined, ala)
        self.assertTrue(all(o3.usable(c) for c in parts.values()))

    def test_an_empty_amount_is_unknown(self):
        c = o3.component(row(''), DERIVATION, '1278')
        self.assertIsNone(c['amountPer100g'])
        self.assertFalse(o3.usable(c))


class EvidenceRule(unittest.TestCase):
    def test_derivation_code_takes_precedence_over_data_points(self):
        self.assertEqual(o3.component(row('1', '57', '9'), DERIVATION, '1404')['evidence'], 'not measured')
        self.assertEqual(o3.component(row('0', '68', '3'), DERIVATION, '1278')['evidence'], 'not measured')
        self.assertEqual(o3.component(row('1', '3', '0'), DERIVATION, '1404')['evidence'], 'measured')

    def test_no_code_counts_only_with_data_points(self):
        self.assertEqual(o3.component(row('1', '', '2'), DERIVATION, '1404')['evidence'], 'no code, data points')
        self.assertEqual(o3.component(row('1', '', '0'), DERIVATION, '1404')['evidence'], 'not measured')
        self.assertEqual(o3.component(row('1', '', ''), DERIVATION, '1404')['evidence'], 'not measured')

    def test_a_recipe_calculated_record_is_not_eligible(self):
        rows = record(row('0.058', '57', '0'), row('0.299', '57', '0'), row('0.093', '57', '0'), row('0.56', '57', '0'), ala_id='1270')
        _, parts = o3.components(rows, DERIVATION)
        self.assertEqual(o3.per_100g(parts), (None, None))

    def test_ala_prefers_1404_and_falls_back_to_1270(self):
        self.assertEqual(o3.components({'1404': row('0.047'), '1270': row('0.048')}, DERIVATION)[0], '1404')
        self.assertEqual(o3.components({'1270': row('0.295')}, DERIVATION)[0], '1270')


if __name__ == '__main__':
    unittest.main()
