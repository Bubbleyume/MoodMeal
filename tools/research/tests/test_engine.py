"""Research engine tests. Synthetic fixtures and mocked HTTP only; no live calls."""
import json
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from moodmeal_research import config
from moodmeal_research.adapters.usda_api import ApiError, UsdaApiAdapter, load_fdc_review
from moodmeal_research.adapters.usda_csv import UsdaCsvAdapter
from moodmeal_research.cache import Cache, CacheRefused, redact
from moodmeal_research.normalize import amount

FIXTURES = Path(__file__).resolve().parent / 'fixtures' / 'fdc_csv'
SECRET = 'TEST-KEY-abc123+/='


class Ephemeral:
    name = 'memory-only-source'
    ephemeral = True


class Persistent:
    name = 'test-source'
    ephemeral = False


def api_response(fdc_id='900001'):
    """A USDA API-shaped response matching the CSV fixture for 900001."""
    return {
        'fdcId': int(fdc_id), 'description': 'Synthetic milk, reduced fat', 'dataType': 'SR Legacy',
        'publicationDate': '2019-04-01',
        'foodNutrients': [
            {'id': 11, 'amount': 50.0, 'nutrient': {'id': 1008, 'name': 'Energy', 'unitName': 'kcal'}},
            {'id': 12, 'amount': 0, 'nutrient': {'id': 1003, 'name': 'Protein', 'unitName': 'g'}},
            {'id': 14, 'amount': 1.2, 'nutrient': {'id': 1114, 'name': 'Vitamin D (D2 + D3)', 'unitName': 'µg'}},
        ],
        'foodPortions': [{'id': 501, 'amount': 1.0, 'gramWeight': 244.0, 'modifier': 'cup',
                          'portionDescription': '', 'measureUnit': {'id': 9999}}],
    }


def tree_state(root):
    return sorted((str(p.relative_to(root)), p.stat().st_size, p.stat().st_mtime_ns)
                  for p in root.rglob('*') if p.is_file())


class AmountTests(unittest.TestCase):
    def test_missing_is_none_and_zero_stays_zero(self):
        self.assertIsNone(amount(''))
        self.assertIsNone(amount(None))
        self.assertIsNone(amount('  '))
        self.assertIsNone(amount('n/a'))
        self.assertIsNone(amount('-1'))
        self.assertIsNone(amount('nan'))
        self.assertEqual(amount('0'), 0.0)
        self.assertEqual(amount('0.0'), 0.0)
        self.assertEqual(amount(0), 0.0)
        self.assertEqual(amount('50.0'), 50.0)


class CsvAdapterTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = UsdaCsvAdapter(FIXTURES).load(['900001', '900002', '999999'])

    def test_unknown_ids_are_absent_not_invented(self):
        self.assertEqual(sorted(self.data), ['900001', '900002'])

    def test_null_versus_measured_zero(self):
        n = self.data['900001']['record']['nutrients']
        self.assertIsNone(n['1235']['amountPer100g'])      # empty CSV amount
        self.assertEqual(n['1235']['sourceRowId'], '13')   # row evidence kept
        self.assertEqual(n['1003']['amountPer100g'], 0.0)  # measured zero

    def test_units_and_source_rows_retained(self):
        n = self.data['900001']['record']['nutrients']
        self.assertEqual((n['1008']['unit'], n['1008']['amountPer100g'], n['1008']['sourceRowId']), ('KCAL', 50.0, '11'))
        self.assertEqual(n['1114']['unit'], 'UG')

    def test_duplicate_nutrient_ids_flagged_never_merged(self):
        record = self.data['900002']['record']
        self.assertIsNone(record['nutrients']['1004']['amountPer100g'])
        self.assertEqual(record['nutrients']['1004']['resolution'], 'duplicate-id-manual-review-required')
        self.assertEqual([r['amountPer100g'] for r in record['duplicateNutrientRows']['1004']], [3.0, 3.5])
        self.assertEqual(record['verificationIssues'], [{'type': 'duplicate-nutrient-id', 'nutrientId': '1004', 'rowCount': 2}])

    def test_candidates_are_unreviewed_and_carry_provenance(self):
        entry = self.data['900001']
        self.assertEqual(entry['record']['reviewStatus'], 'unreviewed-candidate')
        self.assertIs(entry['record']['approved'], False)
        self.assertEqual(entry['provenance']['snapshot'], 'fdc_csv')
        self.assertIn('CC0', entry['provenance']['licence'])

    def test_portions(self):
        self.assertEqual(self.data['900001']['record']['portions'][0]['gramWeight'], 244.0)


class CacheTests(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp(prefix='moodmeal-cache-test-'))

    def tearDown(self):
        shutil.rmtree(self.dir, ignore_errors=True)

    def test_refuses_ephemeral_adapter(self):
        cache = Cache(self.dir, is_ignored=lambda p: True)
        with self.assertRaises(CacheRefused):
            cache.put(Ephemeral(), 'https://example.test/x', {'a': 1}, 'licence')
        self.assertEqual(list(self.dir.iterdir()), [])

    def test_refuses_directory_that_is_not_git_ignored(self):
        cache = Cache(self.dir / 'sub', is_ignored=lambda p: False)
        with self.assertRaises(CacheRefused):
            cache.put(Persistent(), 'https://example.test/x', {'a': 1}, 'licence')
        self.assertFalse((self.dir / 'sub').exists())

    def test_real_git_check_refuses_paths_outside_repo(self):
        self.assertFalse(config.git_ignored(self.dir))

    def test_repository_cache_and_output_dirs_are_ignored(self):
        cfg = config.load()
        self.assertTrue(config.git_ignored(cfg.cache_dir))
        self.assertTrue(config.git_ignored(cfg.output_dir))

    def test_key_redacted_from_url_and_payload(self):
        cache = Cache(self.dir, is_ignored=lambda p: True)
        url = f'https://api.example.test/food/1?api_key={SECRET}'
        path = cache.put(Persistent(), url, {'echo': SECRET}, 'licence', secrets=[SECRET])
        text = path.read_text(encoding='utf-8')
        self.assertNotIn(SECRET, text)
        self.assertIn('[REDACTED]', text)
        self.assertEqual(redact('x?api_key=abc&y=1'), 'x?api_key=[REDACTED]&y=1')

    def test_redacted_entry_reads_back_with_valid_checksum(self):
        cache = Cache(self.dir, is_ignored=lambda p: True)
        url = f'https://api.example.test/food/1?api_key={SECRET}'
        cache.put(Persistent(), url, {'echo': SECRET, 'link': url, 'n': 0}, 'licence', secrets=[SECRET])
        document = cache.get('test-source', url, secrets=[SECRET])
        self.assertEqual(document['payload'], {'echo': '[REDACTED]',
                                               'link': 'https://api.example.test/food/1?api_key=[REDACTED]', 'n': 0})

    def test_entry_has_provenance_and_round_trips(self):
        cache = Cache(self.dir, is_ignored=lambda p: True)
        cache.put(Persistent(), 'https://example.test/x', {'a': 1}, 'CC0')
        document = cache.get('test-source', 'https://example.test/x')
        self.assertEqual(document['payload'], {'a': 1})
        self.assertEqual(document['licence'], 'CC0')
        self.assertEqual(len(document['checksum']), 64)
        self.assertIn('retrievedAt', document)


class ApiAdapterTests(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp(prefix='moodmeal-api-test-'))
        self.fdc = load_fdc_review()
        self.usda_dir = config.REPO / 'docs' / 'usda'

    def tearDown(self):
        shutil.rmtree(self.dir, ignore_errors=True)

    def adapter(self, response):
        cache = Cache(self.dir, is_ignored=lambda p: True)
        return UsdaApiAdapter(cache, fdc_review=self.fdc, key=SECRET), mock.patch.object(
            self.fdc, 'request', return_value=response)

    def test_fetch_writes_only_to_cache_never_docs_usda(self):
        before = tree_state(self.usda_dir)
        adapter, patched = self.adapter(api_response())
        with patched as request, \
                mock.patch.object(self.fdc, 'save', side_effect=AssertionError('save() must not be called')), \
                mock.patch.object(self.fdc, 'already_saved', side_effect=AssertionError('already_saved() must not be called')):
            record, provenance = adapter.fetch(900001)
        request.assert_called_once()
        self.assertEqual(tree_state(self.usda_dir), before)
        self.assertEqual(len(list(self.dir.glob('*.json'))), 1)
        self.assertEqual(record['reviewStatus'], 'unreviewed-candidate')
        self.assertNotIn(SECRET, json.dumps(provenance))
        self.assertNotIn(SECRET, next(self.dir.glob('*.json')).read_text(encoding='utf-8'))

    def test_matching_csv_compares_clean(self):
        adapter, patched = self.adapter(api_response())
        with patched:
            record, _ = adapter.fetch(900001)
        csv_entry = UsdaCsvAdapter(FIXTURES).load(['900001'])['900001']
        summary = adapter.compare(record, csv_entry['compare'])['summary']
        # 1235 is present in the CSV (empty amount) but absent from the API response.
        self.assertEqual(summary['materialDifferences'] - summary['missingValueDifferences'], 0)

    def test_mismatched_id_rejected(self):
        adapter, patched = self.adapter(api_response('900002'))
        with patched, self.assertRaises(ApiError):
            adapter.fetch(900001)

    def test_missing_key_is_an_error_without_request(self):
        cache = Cache(self.dir, is_ignored=lambda p: True)
        adapter = UsdaApiAdapter(cache, fdc_review=self.fdc, key=None)
        with mock.patch.dict('os.environ', {'FDC_API_KEY': ''}), \
                mock.patch.object(self.fdc, 'request') as request, self.assertRaises(ApiError):
            adapter.fetch(900001)
        request.assert_not_called()

    def test_errors_never_echo_the_key(self):
        adapter, _ = self.adapter(None)
        with mock.patch.object(self.fdc, 'request', side_effect=self.fdc.ReviewError(f'bad {SECRET}')):
            with self.assertRaises(ApiError) as ctx:
                adapter.fetch(900001)
        self.assertNotIn(SECRET, str(ctx.exception))


class ConfigTests(unittest.TestCase):
    def test_missing_csv_folder_is_a_clear_error(self):
        with mock.patch.dict('os.environ', {config.CSV_ENV: ''}):
            cfg = config.load(None)
        with self.assertRaises(config.ConfigError):
            cfg.require_csv()

    def test_no_user_specific_default(self):
        with mock.patch.dict('os.environ', {config.CSV_ENV: ''}):
            self.assertIsNone(config.load(None).fdc_csv)


if __name__ == '__main__':
    unittest.main()
