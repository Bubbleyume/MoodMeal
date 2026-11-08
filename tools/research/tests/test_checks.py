"""Consistency-check tests: synthetic violations for each check, the two evidence
modes, and a regression test that the blocking checks hold on the repository's
committed data. The suite is portable: it never needs docs/usda/pending-review/."""
import contextlib
import copy
import io
import json
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import research
from moodmeal_research import checks, config

CATALOG = {
    'sourceCommit': 'abc', 'dirtyTree': False,
    'recipes': [
        {'id': 'r1', 'lines': [{'structured': {'name': 'Oats'}, 'approvedMapping': {'fdcId': '1', 'grams': 40.5}},
                               {'structured': {'name': 'Berries'}, 'approvedMapping': None}],
         'estimate': {'published': False}},
        {'id': 'r2', 'lines': [{'structured': {'name': 'Fruit'}, 'approvedMapping': None}],
         'estimate': {'published': True, 'inputs': [{'fdcId': '9', 'grams': 100}]}},
    ],
}


def ledger_entry(name, status='Approved', ids=('1',), uses=(('r1', '1/2 cup'),), approved_uses=None):
    review = {k: '' for k in checks.LEDGER_REVIEW_KEYS}
    review.update({'ids': list(ids), 'status': status, 'candidateRecords': [],
                   'uses': [{'recipeId': r, 'quantity': q} for r, q in uses]})
    if approved_uses is not None:
        review['approvedUses'] = approved_uses
    return {'ingredient': name, 'recipeUseCount': len(uses), 'review': review}


def runtime_record(name='Oats', fdc='1', grams=40.5, recipe_ids=('r1',), nutrients=None, report='report.json'):
    return {'ingredient': name, 'fdcId': fdc, 'identity': 'x', 'preparation': 'x', 'approvedBy': 'User',
            'approvedDate': '2026-10-14', 'apiReport': report, 'description': 'x', 'dataType': 'sr_legacy_food',
            'snapshot': 'snap', 'sourceURL': 'https://fdc.nal.usda.gov/x',
            'conversions': [{'quantity': 0.5, 'unit': 'cup', 'grams': grams, 'basePortionId': 'p1',
                             'derivation': 'USDA portion', 'recipeIds': list(recipe_ids)}],
            'nutrients': nutrients if nutrients is not None else {
                '1008': {'amount': 379.0, 'unit': 'KCAL', 'sourceRowId': '11'},
                '1003': {'amount': 0.0, 'unit': 'G', 'sourceRowId': '12'},
                '1235': {'amount': None, 'unit': 'G', 'sourceRowId': None}}}


def names(findings):
    return [(f['check'], f['subject']) for f in findings]


class SyntheticChecks(unittest.TestCase):
    def setUp(self):
        self.ledger = [ledger_entry('Oats', approved_uses=[{'recipeId': 'r1', 'fdcId': '1', 'grams': 40.5}]),
                       ledger_entry('Berries', status='Hold', ids=('2',))]
        self.runtime = {'ingredients': [runtime_record()]}
        self.evidence = Path(tempfile.mkdtemp(prefix='moodmeal-evidence-'))
        (self.evidence / 'report.json').write_text('{}', encoding='utf-8')

    def tearDown(self):
        shutil.rmtree(self.evidence, ignore_errors=True)

    def test_clean_synthetic_data_has_no_findings(self):
        self.assertEqual(checks.check_ledger_schema(self.ledger, CATALOG), [])
        self.assertEqual(checks.check_runtime_nutrient_values(self.runtime), [])
        self.assertEqual(checks.check_runtime_conversions(self.runtime, CATALOG), [])
        self.assertEqual(checks.check_runtime_provenance(self.runtime), [])
        self.assertEqual(checks.check_api_evidence(self.runtime, self.evidence), [])
        self.assertEqual(checks.check_runtime_uses_in_ledger(self.runtime, self.ledger), [])
        self.assertEqual(checks.check_ledger_uses_in_runtime(self.runtime, self.ledger, CATALOG), [])
        self.assertEqual(checks.check_catalog_coverage(CATALOG, self.ledger), [])

    def test_null_and_measured_zero_are_valid_but_unsourced_numbers_are_not(self):
        rt = copy.deepcopy(self.runtime)
        rt['ingredients'][0]['nutrients']['1235'] = {'amount': 0.0, 'unit': 'G', 'sourceRowId': None}
        rt['ingredients'][0]['nutrients']['1004'] = {'amount': -1, 'unit': 'G', 'sourceRowId': '13'}
        found = checks.check_runtime_nutrient_values(rt)
        self.assertEqual(sorted(f['details']['nutrientId'] for f in found), ['1004', '1235'])
        self.assertTrue(all(f['severity'] == 'blocking' for f in found))

    def test_ledger_schema_violations(self):
        bad = copy.deepcopy(self.ledger)
        bad[0]['review']['status'] = 'Maybe'
        bad[0]['recipeUseCount'] = 3
        bad[1]['review']['uses'].append({'recipeId': 'missing', 'quantity': '1'})
        bad[1]['recipeUseCount'] = 2
        del bad[1]['review']['note']
        messages = [f['message'] for f in checks.check_ledger_schema(bad, CATALOG)]
        self.assertIn('Unknown review status.', messages)
        self.assertIn('recipeUseCount differs from listed uses.', messages)
        self.assertIn('Use names a recipe that does not exist.', messages)
        self.assertIn('Review fields missing.', messages)

    def test_conversion_and_provenance_violations(self):
        rt = copy.deepcopy(self.runtime)
        rt['ingredients'][0]['conversions'][0].update({'basePortionId': '', 'recipeIds': ['ghost'], 'grams': 0})
        rt['ingredients'][0]['apiReport'] = 'absent.json'
        del rt['ingredients'][0]['snapshot']
        conv = [f['message'] for f in checks.check_runtime_conversions(rt, CATALOG)]
        self.assertEqual(len(conv), 3)
        prov = checks.check_runtime_provenance(rt)
        self.assertEqual([f['message'] for f in prov], ['Provenance fields missing.'])
        self.assertEqual(prov[0]['severity'], 'blocking')
        evidence = checks.check_api_evidence(rt, self.evidence)
        self.assertEqual([(f['check'], f['severity'], f['details']['apiReport']) for f in evidence],
                         [('api-evidence', 'blocking', 'absent.json')])

    def test_runtime_approval_without_ledger_record_is_reported(self):
        rt = {'ingredients': [runtime_record(name='Mystery', fdc='77')]}
        self.assertEqual(names(checks.check_runtime_uses_in_ledger(rt, self.ledger)),
                         [('runtime-uses-in-ledger', 'Mystery')])
        self.assertEqual(names(checks.check_runtime_names_in_ledger(rt, self.ledger)),
                         [('runtime-names-in-ledger', 'Mystery')])

    def test_ledger_approval_without_runtime_or_with_pilot_only(self):
        ledger = self.ledger + [ledger_entry('Fruit', uses=(('r2', '1 cup'),), ids=('9',),
                                             approved_uses=[{'recipeId': 'r2', 'fdcId': '9', 'grams': 100}]),
                                ledger_entry('Ghost', uses=(('r1', '1'),), ids=('5',),
                                             approved_uses=[{'recipeId': 'r1', 'fdcId': '5', 'grams': 3}])]
        found = {f['subject']: f['details']['viaPilot'] for f in checks.check_ledger_uses_in_runtime(self.runtime, ledger, CATALOG)}
        self.assertEqual(found, {'Fruit': True, 'Ghost': False})

    def test_untracked_use_reported_but_published_estimate_lines_skipped(self):
        ledger = [self.ledger[0]]  # Berries no longer tracked
        found = checks.check_catalog_coverage(CATALOG, ledger)
        self.assertEqual(names(found), [('catalog-coverage', 'Berries')])
        self.assertEqual(found[0]['severity'], 'report')

    def test_stale_ledger_label_reported(self):
        ledger = self.ledger + [ledger_entry('Old name', status='Review', uses=(('r1', '1'),))]
        self.assertEqual(names(checks.check_ledger_uses_in_catalog(CATALOG, ledger)),
                         [('ledger-uses-in-catalog', 'Old name')])

    def test_checks_never_modify_inputs(self):
        before = json.dumps([self.ledger, self.runtime, CATALOG], sort_keys=True)
        for mode in checks.EVIDENCE_MODES:
            checks.run_all(self.ledger, self.runtime, CATALOG, knowledge={'claims': [], 'stage': 'A'},
                           evidence=mode, evidence_dir=self.evidence)
        self.assertEqual(json.dumps([self.ledger, self.runtime, CATALOG], sort_keys=True), before)


class EvidenceModes(unittest.TestCase):
    """Strict mode audits the local API reports; repository-only mode says it did not."""

    def setUp(self):
        self.ledger = [ledger_entry('Oats', approved_uses=[{'recipeId': 'r1', 'fdcId': '1', 'grams': 40.5}])]
        self.runtime = {'ingredients': [runtime_record(report='a.json'), runtime_record(report='b.json')]}
        self.evidence = Path(tempfile.mkdtemp(prefix='moodmeal-evidence-'))
        self.absent = self.evidence / 'no-such-folder'

    def tearDown(self):
        shutil.rmtree(self.evidence, ignore_errors=True)

    def run_checks(self, **kwargs):
        return checks.run_all(self.ledger, self.runtime, CATALOG, knowledge={'claims': [], 'stage': 'A'}, **kwargs)

    def blocking(self, report):
        return [(f['check'], f['details'].get('apiReport')) for f in report['findings'] if f['severity'] == 'blocking']

    def check_row(self, report):
        return next(c for c in report['checks'] if c['check'] == 'api-evidence')

    def test_strict_passes_when_every_report_exists(self):
        for name in ('a.json', 'b.json'):
            (self.evidence / name).write_text('{}', encoding='utf-8')
        report = self.run_checks(evidence=checks.STRICT, evidence_dir=self.evidence)
        self.assertEqual(self.blocking(report), [])
        self.assertEqual(report['evidenceAudit'], {'mode': 'strict', 'checked': True, 'reportsExpected': 2,
                                                   'reportsFound': 2, 'reportsMissing': 0})
        self.assertEqual(self.check_row(report), {'check': 'api-evidence', 'mode': 'blocking', 'findings': 0})

    def test_strict_fails_when_only_one_report_is_missing(self):
        (self.evidence / 'a.json').write_text('{}', encoding='utf-8')
        report = self.run_checks(evidence=checks.STRICT, evidence_dir=self.evidence)
        self.assertEqual(self.blocking(report), [('api-evidence', 'b.json')])
        self.assertEqual(report['evidenceAudit']['reportsMissing'], 1)
        self.assertEqual(report['evidenceAudit']['reportsFound'], 1)

    def test_strict_fails_when_the_evidence_folder_is_absent(self):
        report = self.run_checks(evidence=checks.STRICT, evidence_dir=self.absent)
        self.assertEqual(self.blocking(report), [('api-evidence', 'a.json'), ('api-evidence', 'b.json')])

    def test_strict_is_the_default(self):
        report = self.run_checks(evidence_dir=self.absent)
        self.assertEqual(report['evidenceAudit']['mode'], 'strict')
        self.assertEqual(len(self.blocking(report)), 2)

    def test_repository_only_reports_the_evidence_as_not_checked(self):
        report = self.run_checks(evidence=checks.REPOSITORY_ONLY, evidence_dir=self.absent)
        self.assertEqual(self.blocking(report), [])
        self.assertFalse(any(f['check'] == 'api-evidence' for f in report['findings']))
        self.assertEqual(self.check_row(report), {'check': 'api-evidence', 'mode': 'not-checked', 'findings': None})
        audit = report['evidenceAudit']
        self.assertEqual((audit['mode'], audit['checked'], audit['reportsNotChecked']), ('repository-only', False, 2))
        self.assertIn('were not checked', audit['note'])
        markdown = checks.render_markdown(report)
        self.assertIn('Evidence audit: not checked.', markdown)
        self.assertIn('| api-evidence | not-checked | not checked |', markdown)

    def test_missing_provenance_fields_block_in_both_modes(self):
        del self.runtime['ingredients'][0]['snapshot']
        self.runtime['ingredients'][1]['apiReport'] = ''
        for mode in checks.EVIDENCE_MODES:
            report = self.run_checks(evidence=mode, evidence_dir=self.absent)
            prov = [f for f in report['findings'] if f['check'] == 'runtime-provenance']
            self.assertEqual([(f['severity'], f['details']['missing']) for f in prov],
                             [('blocking', ['snapshot']), ('blocking', ['apiReport'])], mode)

    def test_unknown_mode_is_refused(self):
        with self.assertRaises(ValueError):
            self.run_checks(evidence='lenient')

    def test_research_checks_command_is_strict_unless_told_otherwise(self):
        real = checks.run_all
        calls = []

        def fake_run_all(evidence):
            calls.append(evidence)
            return real(self.ledger, self.runtime, CATALOG, knowledge={'claims': [], 'stage': 'A'},
                        evidence=evidence, evidence_dir=self.absent)

        out = self.evidence / 'out'
        cfg = config.Config(repo=config.REPO, cache_dir=out, output_dir=out, fdc_csv=None)
        with mock.patch.object(research.config, 'load', return_value=cfg),                 mock.patch.object(research.config, 'ensure_ignored'),                 mock.patch.object(research.checks, 'run_all', side_effect=fake_run_all),                 contextlib.redirect_stdout(io.StringIO()) as printed:
            strict_exit = research.main(['checks'])
            repo_only_exit = research.main(['checks', '--repository-only'])
        self.assertEqual(calls, ['strict', 'repository-only'])
        self.assertEqual((strict_exit, repo_only_exit), (1, 0))
        self.assertIn('Evidence audit: NOT CHECKED.', printed.getvalue())


@unittest.skipUnless(checks.CATALOG.is_file(), 'run npm run export:catalog first (npm run test:research does this)')
class RepositoryData(unittest.TestCase):
    """Regression guard: blocking checks held on the repository data when introduced.
    Repository-only mode, so it runs in a clean clone; `research.py checks` audits the evidence."""

    @classmethod
    def setUpClass(cls):
        cls.report = checks.run_all(evidence=checks.REPOSITORY_ONLY)

    def test_blocking_checks_pass(self):
        blocking = [f for f in self.report['findings'] if f['severity'] == 'blocking']
        self.assertEqual(blocking, [], json.dumps(blocking, indent=2))

    def test_every_check_ran(self):
        self.assertEqual(len(self.report['checks']), 10)
        self.assertTrue(checks.BLOCKING <= {c['check'] for c in self.report['checks']})

    def test_evidence_audit_is_reported_as_not_checked(self):
        audit = self.report['evidenceAudit']
        expected = len(checks.expected_api_reports(checks.load(checks.RUNTIME)))
        self.assertFalse(audit['checked'])
        self.assertGreater(expected, 0)
        self.assertEqual(audit['reportsNotChecked'], expected)

    def test_knowledge_inventory_flags_are_consistent(self):
        if not checks.KNOWLEDGE.is_file():
            self.skipTest('knowledge.json not exported')
        claims = checks.load(checks.KNOWLEDGE)['claims']
        self.assertTrue(claims)
        for c in claims:
            ai_only = c['published'] and c['reviewOrigin'] == 'ai-assisted'
            self.assertEqual(ai_only, 'published-with-ai-assisted-review-only' in c['flags'], c['id'])
            if not c['evidence']:
                self.assertIn('no-evidence', c['flags'], c['id'])


if __name__ == '__main__':
    unittest.main()
