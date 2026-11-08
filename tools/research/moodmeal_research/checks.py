"""Consistency checks across the review ledger, runtime approvals and catalog.

Read-only. Every check reports findings; none fixes data. A check is listed
in BLOCKING only after it passed on the repository's data, so the test suite
fails if that check regresses. All other checks stay report-only until the
owner reviews their findings.

Evidence modes. The API evidence reports named by runtime approvals live in
docs/usda/pending-review/, which is git-ignored and never committed.
- 'strict' (the default, used by `research.py checks`): the api-evidence check
  runs and is blocking, so a single missing report fails.
- 'repository-only' (for a clean clone): the api-evidence check does not run,
  and the report says so explicitly. Every other check, including the
  blocking runtime-provenance fields, runs exactly as in strict mode.
"""
import json
import math
from collections import Counter
from pathlib import Path

from .config import REPO

LEDGER = REPO / 'docs/usda/remaining-ingredient-review.json'
RUNTIME = REPO / 'src/data/usda/approved-ingredients.json'
EVIDENCE = REPO / 'docs/usda/pending-review'
CATALOG = REPO / 'research-output/catalog.json'
KNOWLEDGE = REPO / 'research-output/knowledge.json'

LEDGER_STATUSES = {'Approved', 'Partially approved', 'Review', 'Hold', 'Candidate', 'Exclude'}
LEDGER_REVIEW_KEYS = {'ids', 'status', 'state', 'note', 'uses', 'proposedDefaultFdcId', 'reviewStatus',
                      'sourceVerificationStatus', 'nutrientBasis', 'candidateRecords', 'ambiguity'}
RUNTIME_KEYS = {'ingredient', 'fdcId', 'identity', 'preparation', 'approvedBy', 'approvedDate', 'apiReport',
                'conversions', 'description', 'dataType', 'snapshot', 'sourceURL', 'nutrients'}

# Checks that passed on current data and now guard against regressions.
BLOCKING = {
    'ledger-schema',
    'runtime-nutrient-values',
    'runtime-conversions',
    'runtime-provenance',
    'api-evidence',
}

STRICT = 'strict'
REPOSITORY_ONLY = 'repository-only'
EVIDENCE_MODES = (STRICT, REPOSITORY_ONLY)
CHECKS = ['ledger-schema', 'runtime-nutrient-values', 'runtime-conversions', 'runtime-provenance', 'api-evidence',
          'runtime-uses-in-ledger', 'ledger-uses-in-runtime', 'runtime-names-in-ledger',
          'catalog-coverage', 'ledger-uses-in-catalog']


def load(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def finding(check, subject, message, **details):
    return {'check': check, 'severity': 'blocking' if check in BLOCKING else 'report',
            'subject': subject, 'message': message, 'details': details}


def close(a, b):
    return a is not None and b is not None and math.isclose(float(a), float(b), rel_tol=0, abs_tol=1e-9)


def check_ledger_schema(ledger, catalog):
    out = []
    recipes = {r['id'] for r in catalog['recipes']}
    for entry in ledger:
        name = entry.get('ingredient')
        review = entry.get('review') or {}
        if not isinstance(name, str) or not name:
            out.append(finding('ledger-schema', repr(name), 'Entry has no ingredient name.'))
            continue
        missing = sorted(LEDGER_REVIEW_KEYS - set(review))
        if missing:
            out.append(finding('ledger-schema', name, 'Review fields missing.', missing=missing))
        if review.get('status') not in LEDGER_STATUSES:
            out.append(finding('ledger-schema', name, 'Unknown review status.', status=review.get('status')))
        uses = review.get('uses') or []
        if entry.get('recipeUseCount') != len(uses):
            out.append(finding('ledger-schema', name, 'recipeUseCount differs from listed uses.',
                               recipeUseCount=entry.get('recipeUseCount'), uses=len(uses)))
        for use in uses + (review.get('approvedUses') or []):
            if use.get('recipeId') not in recipes:
                out.append(finding('ledger-schema', name, 'Use names a recipe that does not exist.',
                                   recipeId=use.get('recipeId')))
        for use in review.get('approvedUses') or []:
            if not use.get('fdcId') or not isinstance(use.get('grams'), (int, float)):
                out.append(finding('ledger-schema', name, 'Approved use lacks an FDC ID or gram weight.', use=use))
        if review.get('status') in ('Approved', 'Partially approved') and not review.get('ids'):
            out.append(finding('ledger-schema', name, 'Approved entry lists no FDC IDs.'))
    return out


def check_runtime_nutrient_values(runtime):
    """Unknown stays null; any number must be finite, non-negative and carry a source row."""
    out = []
    for record in runtime['ingredients']:
        for nid, value in record['nutrients'].items():
            amount = value.get('amount')
            if amount is None:
                continue
            if not isinstance(amount, (int, float)) or isinstance(amount, bool) or not math.isfinite(amount) or amount < 0:
                out.append(finding('runtime-nutrient-values', record['ingredient'], 'Invalid nutrient amount.',
                                   nutrientId=nid, amount=amount))
            elif not value.get('sourceRowId'):
                out.append(finding('runtime-nutrient-values', record['ingredient'],
                                   'Numeric amount without a source row (possible inferred value).',
                                   nutrientId=nid, amount=amount))
            if not value.get('unit'):
                out.append(finding('runtime-nutrient-values', record['ingredient'], 'Nutrient has no unit.',
                                   nutrientId=nid))
    return out


def check_runtime_conversions(runtime, catalog):
    out = []
    recipes = {r['id'] for r in catalog['recipes']}
    for record in runtime['ingredients']:
        for c in record['conversions']:
            if not (isinstance(c.get('quantity'), (int, float)) and c['quantity'] > 0):
                out.append(finding('runtime-conversions', record['ingredient'], 'Quantity must be positive.', conversion=c))
            if not (isinstance(c.get('grams'), (int, float)) and c['grams'] > 0):
                out.append(finding('runtime-conversions', record['ingredient'], 'Grams must be positive.', conversion=c))
            if not c.get('basePortionId') or not c.get('derivation'):
                out.append(finding('runtime-conversions', record['ingredient'],
                                   'Conversion lacks its USDA portion ID or derivation.', conversion=c))
            for rid in c.get('recipeIds') or []:
                if rid not in recipes:
                    out.append(finding('runtime-conversions', record['ingredient'],
                                       'Conversion names a recipe that does not exist.', recipeId=rid))
    return out


def check_runtime_provenance(runtime):
    """Committed data only: every runtime approval records its provenance fields, including apiReport."""
    out = []
    for record in runtime['ingredients']:
        missing = sorted(k for k in RUNTIME_KEYS if not record.get(k))
        if missing:
            out.append(finding('runtime-provenance', record['ingredient'], 'Provenance fields missing.', missing=missing))
    return out


def expected_api_reports(runtime):
    return [(record['ingredient'], record['apiReport']) for record in runtime['ingredients'] if record.get('apiReport')]


def check_api_evidence(runtime, evidence_dir=EVIDENCE):
    """Local evidence audit: every API report a runtime approval names exists in evidence_dir.
    A missing folder means every report is missing."""
    return [finding('api-evidence', name, 'API evidence report not found in docs/usda/pending-review.', apiReport=report)
            for name, report in expected_api_reports(runtime) if not (Path(evidence_dir) / report).is_file()]


def _ledger_by_name(ledger):
    return {e['ingredient']: e for e in ledger}


def check_runtime_uses_in_ledger(runtime, ledger):
    """Every runtime conversion is documented by a ledger approval for that ingredient and FDC ID."""
    out = []
    by_name = _ledger_by_name(ledger)
    by_fdc = {}
    for e in ledger:
        for use in e['review'].get('approvedUses') or []:
            by_fdc.setdefault((use['fdcId'], use['recipeId']), []).append((e, use))
    for record in runtime['ingredients']:
        fdc = record['fdcId']
        for c in record['conversions']:
            for rid in c.get('recipeIds') or [None]:
                itemized = [u for _, u in by_fdc.get((fdc, rid), []) if close(u.get('grams'), c['grams'])]
                if itemized:
                    continue
                entry = by_name.get(record['ingredient'])
                approved = entry and entry['review']['status'] in ('Approved', 'Partially approved') \
                    and fdc in entry['review'].get('ids', [])
                if not approved:
                    out.append(finding('runtime-uses-in-ledger', record['ingredient'],
                                       'Runtime conversion has no matching ledger approval.',
                                       fdcId=fdc, recipeId=rid, grams=c['grams']))
    return out


def check_ledger_uses_in_runtime(runtime, ledger, catalog):
    """Every itemized ledger approval has a runtime conversion or a published pilot input."""
    out = []
    conversions = [(r['fdcId'], rid, c['grams']) for r in runtime['ingredients'] for c in r['conversions']
                   for rid in (c.get('recipeIds') or [None])]
    pilot = [(i['fdcId'], r['id'], i['grams']) for r in catalog['recipes'] if r['estimate'].get('published')
             for i in r['estimate'].get('inputs', [])]
    for e in ledger:
        for use in e['review'].get('approvedUses') or []:
            key = (use['fdcId'], use['recipeId'])
            if any(f == key[0] and rid in (key[1], None) and close(g, use['grams']) for f, rid, g in conversions):
                continue
            via_pilot = any(f == key[0] and rid == key[1] and close(g, use['grams']) for f, rid, g in pilot)
            out.append(finding('ledger-uses-in-runtime', e['ingredient'],
                               'Approved use is served by a published pilot input, not a runtime conversion.'
                               if via_pilot else 'Ledger approved use has no runtime conversion.',
                               recipeId=use['recipeId'], fdcId=use['fdcId'], grams=use['grams'], viaPilot=via_pilot))
    return out


def check_runtime_names_in_ledger(runtime, ledger):
    names = {e['ingredient'] for e in ledger}
    return [finding('runtime-names-in-ledger', r['ingredient'],
                    'Runtime ingredient name has no ledger entry of the same name.', fdcId=r['fdcId'])
            for r in runtime['ingredients'] if r['ingredient'] not in names]


def check_catalog_coverage(catalog, ledger):
    """Every recipe ingredient use is approved at runtime, covered by a published estimate,
    or tracked in the ledger for that recipe."""
    out = []
    tracked = {(u['recipeId'], e['ingredient']) for e in ledger for u in e['review'].get('uses') or []}
    for r in catalog['recipes']:
        if r['estimate'].get('published'):
            continue  # its approved inputs are listed under estimate.inputs
        for line in r['lines']:
            label = line['structured']['name']
            if line['approvedMapping'] is None and (r['id'], label) not in tracked:
                out.append(finding('catalog-coverage', label,
                                   'Unapproved recipe use is not tracked in the ledger for this recipe.', recipeId=r['id']))
    return out


def check_ledger_uses_in_catalog(catalog, ledger):
    """Ledger uses must point at a real ingredient line (stale labels or recipes are reported)."""
    out = []
    labels = {r['id']: {l['structured']['name'] for l in r['lines']} for r in catalog['recipes']}
    for e in ledger:
        for use in e['review'].get('uses') or []:
            if e['ingredient'] not in labels.get(use['recipeId'], set()):
                out.append(finding('ledger-uses-in-catalog', e['ingredient'],
                                   'Ledger use does not match an ingredient label in that recipe.',
                                   recipeId=use['recipeId'], quantity=use.get('quantity')))
    return out


def knowledge_summary(knowledge):
    claims = knowledge['claims']
    return {
        'stage': knowledge.get('stage'),
        'claimCount': len(claims),
        'byType': dict(Counter(c['claimType'] for c in claims)),
        'byReviewOrigin': dict(Counter(c['reviewOrigin'] for c in claims)),
        'flags': dict(Counter(f for c in claims for f in c['flags'])),
        'publishedAiOnlyByType': dict(Counter(c['claimType'] for c in claims
                                              if 'published-with-ai-assisted-review-only' in c['flags'])),
    }


def run_all(ledger=None, runtime=None, catalog=None, knowledge=None, evidence=STRICT, evidence_dir=EVIDENCE):
    if evidence not in EVIDENCE_MODES:
        raise ValueError(f'evidence must be one of {EVIDENCE_MODES}, not {evidence!r}')
    ledger = ledger if ledger is not None else load(LEDGER)
    runtime = runtime if runtime is not None else load(RUNTIME)
    catalog = catalog if catalog is not None else load(CATALOG)
    strict = evidence == STRICT
    evidence_findings = check_api_evidence(runtime, evidence_dir) if strict else []
    findings = (check_ledger_schema(ledger, catalog) + check_runtime_nutrient_values(runtime)
                + check_runtime_conversions(runtime, catalog) + check_runtime_provenance(runtime) + evidence_findings
                + check_runtime_uses_in_ledger(runtime, ledger) + check_ledger_uses_in_runtime(runtime, ledger, catalog)
                + check_runtime_names_in_ledger(runtime, ledger) + check_catalog_coverage(catalog, ledger)
                + check_ledger_uses_in_catalog(catalog, ledger))
    expected = len(expected_api_reports(runtime))
    if strict:
        audit = {'mode': STRICT, 'checked': True, 'reportsExpected': expected,
                 'reportsFound': expected - len(evidence_findings), 'reportsMissing': len(evidence_findings)}
    else:
        audit = {'mode': REPOSITORY_ONLY, 'checked': False, 'reportsExpected': expected, 'reportsNotChecked': expected,
                 'note': f'{expected} API evidence reports in docs/usda/pending-review/ were not checked '
                         '(repository-only mode). Run research.py checks without --repository-only to audit them.'}
    report = {
        'kind': 'moodmeal-consistency-findings',
        'sourceCommit': catalog.get('sourceCommit'), 'dirtyTree': catalog.get('dirtyTree'),
        'note': 'Report only. No data was changed. Blocking checks guard rules that held on current data.',
        'evidenceAudit': audit,
        'checks': [{'check': c, 'mode': 'not-checked', 'findings': None} if c == 'api-evidence' and not strict else
                   {'check': c, 'mode': 'blocking' if c in BLOCKING else 'report',
                    'findings': sum(f['check'] == c for f in findings)} for c in CHECKS],
        'findings': findings,
    }
    if knowledge is not None or KNOWLEDGE.is_file():
        report['knowledgeInventory'] = knowledge_summary(knowledge if knowledge is not None else load(KNOWLEDGE))
    return report


def render_markdown(report):
    lines = ['# Consistency findings', '',
             f'Source commit {report["sourceCommit"]}' + (' (uncommitted changes present)' if report['dirtyTree'] else '') + '.',
             report['note'], '']
    audit = report['evidenceAudit']
    if audit['checked']:
        lines.append(f'**Evidence audit (strict):** {audit["reportsFound"]} of {audit["reportsExpected"]} '
                     f'API evidence reports found; {audit["reportsMissing"]} missing.')
    else:
        lines.append(f'**Evidence audit: not checked.** {audit["note"]}')
    lines += ['', '| Check | Mode | Findings |', '| --- | --- | --- |']
    lines += [f'| {c["check"]} | {c["mode"]} | {"not checked" if c["findings"] is None else c["findings"]} |'
              for c in report['checks']]
    for c in report['checks']:
        items = [f for f in report['findings'] if f['check'] == c['check']]
        if not items:
            continue
        lines += ['', f'## {c["check"]} ({len(items)})', '']
        for f in items:
            detail = ', '.join(f'{k}={v}' for k, v in f['details'].items())
            lines.append(f'- **{f["subject"]}**: {f["message"]}' + (f' ({detail})' if detail else ''))
    k = report.get('knowledgeInventory')
    if k:
        lines += ['', '## Stage A knowledge-claim inventory', '', f'{k["claimCount"]} claims. Inventory only; nothing was changed.', '',
                  '| Claim type | Claims | Published with AI-assisted review only |', '| --- | --- | --- |']
        lines += [f'| {t} | {n} | {k["publishedAiOnlyByType"].get(t, 0)} |' for t, n in k['byType'].items()]
        lines += ['', '| Flag | Claims |', '| --- | --- |'] + [f'| {f} | {n} |' for f, n in k['flags'].items()]
    return '\n'.join(lines) + '\n'
