"""Ingredient research command (item 4). Synthetic fixtures only; no live calls."""
import contextlib
import io
import json
import unittest
from pathlib import Path

from moodmeal_research import config, ingredient
from moodmeal_research import requirements as req
from moodmeal_research.provenance import checksum

FIXTURES = Path(__file__).resolve().parent / 'fixtures' / 'fdc_csv_ingredient'


def line(label, quantity, unit, notes='', state=None, **extra):
    return {'label': label, 'quantity': quantity, 'unit': unit, 'notes': notes, 'state': state, **extra}


def build(request, ledger=None, runtime=None):
    return ingredient.build_record(request, FIXTURES, ledger or [], runtime or {'ingredients': []})


def cand(record, fdc_id):
    return next(c for c in record['candidates'] if c['fdcId'] == fdc_id)


class Requirements(unittest.TestCase):
    def test_quantities(self):
        self.assertEqual(req.parse_quantity('1 1/2'), 1.5)
        self.assertEqual(req.parse_quantity('1/2'), 0.5)
        self.assertEqual(req.parse_quantity('0.75'), 0.75)
        self.assertEqual(req.parse_quantity(2), 2.0)
        for raw in (None, 'to taste', 'a few', '0', 0, '', '1/0', True):
            self.assertIsNone(req.parse_quantity(raw), raw)

    def test_unmeasured_line_misses_its_amount(self):
        items = {i['id']: i for i in req.check(line('Salt & pepper', None, 'each', 'to taste'))['items']}
        self.assertEqual(items['amount']['status'], 'missing')
        self.assertIn('UL-2', items['amount']['detail'])
        self.assertEqual(items['state']['status'], 'missing')
        self.assertEqual(items['identity']['status'], 'needs-owner-decision')

    def test_state_and_form_come_from_notes_unless_stated(self):
        self.assertEqual(req.check(line('Brown rice', 0.75, 'cup', 'cooked'))['state'], 'cooked')
        self.assertEqual(req.check(line('Swiss chard', 1, 'cup', 'sautéed'))['state'], 'cooked')
        self.assertEqual(req.check(line('Rice', 1, 'cup', 'cooked', state='dry'))['state'], 'dry')
        self.assertIsNone(req.check(line('Walnuts', 1, 'tbsp', 'chopped'))['state'])
        self.assertEqual(req.check(line('Walnuts', 1, 'tbsp', 'chopped'))['forms'], ['chopped'])

    def test_state_words_compare_whole_words(self):
        self.assertEqual(req.describe_state('Nuts, walnuts, black, dried', 'raw')['result'], 'conflicts')
        self.assertEqual(req.describe_state('Garlic, raw', 'raw')['result'], 'matches')
        self.assertEqual(req.describe_state('Oil, olive, salad or cooking', 'cooked')['result'],
                         'not stated in description')
        self.assertEqual(req.describe_state('Peppers, raw and cooked', 'raw')['result'], 'mixed')

    def test_negated_state_words_are_ignored(self):
        self.assertEqual(req.describe_state('Walnuts, excluding honey roasted', 'raw')['result'],
                         'not stated in description')
        self.assertEqual(req.describe_state('Peppers, cooked, boiled, drained, without salt', 'cooked')['result'],
                         'matches')
        self.assertEqual(req.describe_state('Walnuts, honey roasted', 'raw')['result'], 'conflicts')


class Search(unittest.TestCase):
    def test_whole_words_only_and_no_branded_records(self):
        shown, total = ingredient.search(FIXTURES, ingredient.query_terms('Honey'), 10)
        self.assertEqual([r['fdc_id'] for r in shown], ['910011'])  # not honeydew
        shown, total = ingredient.search(FIXTURES, ingredient.query_terms('Olive oil'), 10)
        ids = [r['fdc_id'] for r in shown]
        self.assertNotIn('910004', ids)  # branded
        self.assertEqual(ids[0], '910003')  # description starts with the first term
        self.assertEqual(set(ids), {'910001', '910002', '910003', '910005'})
        self.assertEqual(total, 4)

    def test_plurals_fold(self):
        shown, _ = ingredient.search(FIXTURES, ingredient.query_terms('Banana'), 10)
        self.assertEqual([r['fdc_id'] for r in shown], ['910009'])
        shown, _ = ingredient.search(FIXTURES, ingredient.query_terms('Walnuts'), 10)
        self.assertEqual({r['fdc_id'] for r in shown}, {'910006', '910007'})


class Weights(unittest.TestCase):
    def test_direct_portion_and_agreeing_derivations(self):
        r = build(line('Olive oil', 1, 'tbsp', state='ready-to-use'))
        sr = cand(r, '910002')['weight']
        self.assertEqual(sr['status'], 'direct-portion')
        self.assertEqual({o['grams'] for o in sr['options']}, {13.5})
        self.assertEqual({o['method'] for o in sr['options']}, {'direct', 'derived-us-customary'})

    def test_fndds_portion_read_from_its_description(self):
        r = build(line('Olive oil', 1, 'tsp', state='ready-to-use'))
        w = cand(r, '910003')['weight']
        self.assertEqual(w['status'], 'derived')
        self.assertAlmostEqual(w['options'][0]['grams'], 14 / 3)
        self.assertEqual(w['options'][0]['portion'], '1 tablespoon')  # numeric FNDDS code left out

    def test_metric_portion_uses_the_exact_definition_and_says_so(self):
        r = build(line('Olive oil', 1, 'tbsp', state='ready-to-use'))
        o = cand(r, '910001')['weight']['options'][0]
        self.assertEqual(o['method'], 'derived-metric')
        self.assertAlmostEqual(o['grams'], 90.7 / (100 / 4.92892159375) * 3)
        self.assertIn('Not one of the US customary ratios', o['derivation'])

    def test_several_weights_are_listed_and_none_is_chosen(self):
        r = build(line('Walnuts', 1, 'tbsp', 'chopped', state='raw'))
        w = cand(r, '910006')['weight']
        self.assertEqual(w['status'], 'several-options')
        by_portion = {o['portionId']: o for o in w['options']}
        self.assertAlmostEqual(by_portion['607']['grams'], 117 / 16)
        self.assertEqual(by_portion['607']['formMentioned'], ['chopped'])
        self.assertIsNone(by_portion['608']['formMentioned'])
        self.assertTrue(all(v is None for v in r['decision'].values()))

    def test_count_units(self):
        garlic = cand(build(line('Garlic', 2, 'clove', 'minced', state='raw')), '910008')['weight']
        self.assertEqual(garlic['status'], 'count-portion')
        self.assertEqual([o['grams'] for o in garlic['options']], [6.0])
        banana = cand(build(line('Banana', '1/2', 'each', state='raw')), '910009')['weight']
        self.assertEqual(banana['status'], 'several-options')
        self.assertEqual(sorted(o['grams'] for o in banana['options']), [59.0, 68.0])  # no cup portion

    def test_mass_is_exact_and_needs_no_portion(self):
        w = cand(build(line('Walnuts', 4, 'oz', state='raw')), '910007')['weight']
        self.assertEqual(w['status'], 'exact-mass')
        self.assertAlmostEqual(w['options'][0]['grams'], 4 * 28.349523125)

    def test_no_portion_for_the_unit(self):
        w = cand(build(line('Walnuts', 1, 'tbsp', state='raw')), '910007')['weight']
        self.assertEqual((w['status'], w['options']), ('no-portion', []))


class Values(unittest.TestCase):
    def test_unknown_stays_null_and_zero_stays_zero(self):
        c = cand(build(line('Olive oil', 1, 'tbsp', state='ready-to-use')), '910002')
        n = c['nutrientsPer100g']
        self.assertEqual(n['1003']['amountPer100g'], 0)
        self.assertIsNone(n['1235']['amountPer100g'])
        self.assertIsNone(n['1079']['amountPer100g'])
        self.assertEqual(n['1079']['issue'], 'absent-in-record')
        contribution = next(o for o in c['weight']['options'] if o['method'] == 'direct')['contribution']
        self.assertEqual(contribution['1003'], 0)
        self.assertIsNone(contribution['1235'])
        self.assertAlmostEqual(contribution['1008'], 884 * 13.5 / 100)

    def test_duplicate_nutrient_rows_stay_unknown(self):
        c = cand(build(line('Honey', 1, 'tsp', state='ready-to-use')), '910011')
        self.assertIsNone(c['nutrientsPer100g']['1005']['amountPer100g'])
        self.assertEqual(c['nutrientsPer100g']['1005']['issue'], 'duplicate-id-manual-review-required')
        self.assertEqual(c['verificationIssues'][0]['nutrientId'], '1005')


class Record(unittest.TestCase):
    def test_never_approves_and_only_candidate_or_missing(self):
        good = build(line('Honey', 1, 'tsp', state='ready-to-use'))
        self.assertEqual((good['evidenceStatus'], good['statusReasons']), ('candidate', []))
        bad = build(line('Salt & pepper', None, 'each', 'to taste'))
        self.assertEqual(bad['evidenceStatus'], 'missing')
        self.assertEqual(set(bad['statusReasons']), {'state', 'amount', 'no-candidates'})
        for r in (good, bad):
            self.assertIs(r['approved'], False)
            self.assertIs(r['publishable'], False)
            self.assertTrue(all(v is None for v in r['decision'].values()))
            self.assertIn(r['evidenceStatus'], {'candidate', 'missing'})

    def test_fingerprint_is_reproducible_and_covers_the_record(self):
        a = build(line('Walnuts', 1, 'tbsp', 'chopped', state='raw'))
        b = build(line('Walnuts', 1, 'tbsp', 'chopped', state='raw'))
        self.assertEqual(json.dumps(a, sort_keys=True), json.dumps(b, sort_keys=True))
        body = {k: v for k, v in a.items() if k != 'fingerprint'}
        self.assertEqual(a['fingerprint'], 'sha256:' + checksum(body))
        c = build(line('Walnuts', 2, 'tbsp', 'chopped', state='raw'))
        self.assertNotEqual(a['fingerprint'], c['fingerprint'])
        self.assertEqual(set(a['toolVersion']), set(ingredient.SOURCE_FILES))

    def test_ledger_candidates_and_approved_records_are_context_only(self):
        ledger = [{'ingredient': 'Honey', 'review': {'ids': ['910011'], 'status': 'Approved',
                                                     'reviewStatus': 'approved', 'note': 'n', 'uses': []}}]
        runtime = {'ingredients': [{'ingredient': 'Honey', 'fdcId': '910011', 'identity': 'Generic honey',
                                    'preparation': 'Ready-to-use', 'approvedBy': 'Owner', 'approvedDate': '2026-10-14',
                                    'conversions': [{'quantity': 1, 'unit': 'tsp', 'grams': 7}]}]}
        r = build(line('Honey', 1, 'tsp', state='ready-to-use', search='nothing matches this'), ledger, runtime)
        self.assertEqual(r['search']['totalMatches'], 0)
        self.assertEqual([c['fdcId'] for c in r['candidates']], ['910011'])
        self.assertEqual(r['candidates'][0]['foundBy'], ['ledger'])
        self.assertIn('AR-3 is not approved', r['context']['reuseNote'])
        self.assertEqual(r['evidenceStatus'], 'candidate')

    def test_requested_ids_missing_from_the_snapshot_are_reported(self):
        r = build(line('Honey', 1, 'tsp', state='ready-to-use', fdcIds=['999999']))
        self.assertEqual(r['idsNotInSnapshot'], ['999999'])

    def test_markdown_shows_the_blank_decision(self):
        text = ingredient.render_markdown(build(line('Walnuts', 1, 'tbsp', 'chopped', state='raw')))
        self.assertIn('**Candidate-only.**', text)
        self.assertIn('| fdcId | |', text)
        self.assertIn('Unknown', text)


def quiet(fn, *args):
    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
        return fn(*args)


class Command(unittest.TestCase):
    def test_cli_writes_only_to_the_ignored_output_folder(self):
        import research
        out = config.REPO / 'research-output' / 'ingredients'
        names = [out / 'garlic-2-clove.json', out / 'garlic-2-clove.md']
        before = {p: p.read_bytes() for p in names if p.exists()}
        try:
            code = quiet(research.main, ['ingredient', 'Garlic', '--quantity', '2', '--unit', 'clove', '--notes',
                                         'minced', '--state', 'raw', '--fdc-csv', str(FIXTURES)])
            self.assertEqual(code, 0)
            record = json.loads(names[0].read_text(encoding='utf-8'))
            self.assertEqual(record['candidates'][0]['fdcId'], '910008')
            self.assertTrue(config.git_ignored(out))
        finally:
            for p in names:
                if p in before:
                    p.write_bytes(before[p])
                elif p.exists():
                    p.unlink()

    def test_cli_rejects_mixed_modes(self):
        import research
        self.assertEqual(quiet(research.main, ['ingredient', 'Garlic', '--recipe', 'x', '--line', '0',
                                               '--fdc-csv', str(FIXTURES)]), 1)
