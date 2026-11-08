"""MoodMeal research engine CLI (development only; read-only for app data).

Run with:  python -I -B tools/research/research.py <command> [options]

  usda-csv <fdcId> --fdc-csv DIR          Normalized record from the local CSV snapshot.
  check-runtime <fdcId> --fdc-csv DIR     Compare an approved runtime record with the CSV.
  usda-api <fdcId> --compare-csv --fdc-csv DIR
                                          One read-only API request, compared with the CSV.
  checks                                  Ledger, runtime and catalog consistency report.
  tag-evidence --fdc-csv DIR [--threshold 0.10]
                                          Stage C: food tags vs %DV per RACC (report only).

Outputs go to research-output/ and raw API responses to research-cache/; both
must be git-ignored or nothing is written.
"""
import argparse
import json
import sys
from pathlib import Path

# python -I does not put this folder on sys.path.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from moodmeal_research import checks, config, tag_evidence  # noqa: E402
from moodmeal_research.adapters.usda_api import ApiError, UsdaApiAdapter  # noqa: E402
from moodmeal_research.adapters.usda_csv import UsdaCsvAdapter  # noqa: E402
from moodmeal_research.cache import Cache, CacheRefused  # noqa: E402


def write_output(cfg, name, document):
    config.ensure_ignored(cfg.output_dir)
    cfg.output_dir.mkdir(parents=True, exist_ok=True)
    path = cfg.output_dir / name
    path.write_text(json.dumps(document, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    return path


def csv_entry(cfg, fdc_id):
    entry = UsdaCsvAdapter(cfg.require_csv()).load([fdc_id]).get(str(fdc_id))
    if entry is None:
        raise config.ConfigError(f'FDC {fdc_id} is not in the CSV snapshot.')
    return entry


def runtime_differences(runtime, csv_record):
    """Every runtime nutrient must match the CSV amount, unit and source row exactly."""
    differences = []
    for nid, value in runtime['nutrients'].items():
        csv_value = csv_record['nutrients'].get(nid)
        if csv_value is None:
            if value.get('amount') is not None:
                differences.append({'nutrientId': nid, 'issue': 'absent-in-csv', 'runtime': value})
            continue
        for field, csv_field in (('amount', 'amountPer100g'), ('unit', 'unit'), ('sourceRowId', 'sourceRowId')):
            if value.get(field) != csv_value.get(csv_field):
                differences.append({'nutrientId': nid, 'field': field,
                                    'runtime': value.get(field), 'csv': csv_value.get(csv_field)})
    return differences


def run_tag_evidence(cfg, threshold):
    try:
        if not 0 < threshold <= 1:
            raise config.ConfigError('Threshold must be a fraction between 0 and 1.')
        knowledge = tag_evidence.load(tag_evidence.KNOWLEDGE)
        food_map = tag_evidence.load(tag_evidence.FOOD_MAP)
        adapter = UsdaCsvAdapter(cfg.require_csv())
        records = {k: v['record'] for k, v in adapter.load(tag_evidence.required_fdc_ids(food_map)).items()}
    except FileNotFoundError as exc:
        print(f'Error: {exc.filename} not found; run npm run export:catalog first.', file=sys.stderr)
        return 1
    except config.ConfigError as exc:
        print(f'Error: {exc}', file=sys.stderr)
        return 1
    if any(not c.get('foodIds') for c in knowledge['claims'] if c['claimType'] == 'meal-nutrient-derived'):
        print('Error: knowledge.json lacks foodIds; rerun npm run export:catalog.', file=sys.stderr)
        return 1
    report = tag_evidence.build_report(knowledge, food_map, records, threshold, adapter.snapshot)
    write_output(cfg, 'tag-evidence.json', report)
    (cfg.output_dir / 'TAG-EVIDENCE.md').write_text(tag_evidence.render_markdown(report), encoding='utf-8')
    s = report['summary']
    print(f'Food tags {s["foodTags"]}: {s["foodStatus"]}')
    print(f'Meal tags {s["mealTags"]}: {s["mealStatus"]}')
    print('Wrote research-output/tag-evidence.json and research-output/TAG-EVIDENCE.md')
    return 0


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest='command', required=True)
    ck = sub.add_parser('checks', help='Ledger, runtime and catalog consistency report (run npm run export:catalog first). '
                                       'Strict by default: every API evidence report must exist in docs/usda/pending-review/.')
    ck.add_argument('--repository-only', action='store_true',
                    help='Committed data only (for a clean clone): skip the API evidence audit and report it as not checked.')
    te = sub.add_parser('tag-evidence', help='Stage C report (run npm run export:catalog first).')
    te.add_argument('--fdc-csv', help=f'FoodData Central CSV folder (or set {config.CSV_ENV}).')
    te.add_argument('--threshold', type=float, default=0.10,
                    help='Fraction of the Daily Value per RACC (owner choice 2026-11-04: 0.10).')
    for name in ('usda-csv', 'check-runtime', 'usda-api'):
        p = sub.add_parser(name)
        p.add_argument('fdc_id', type=int)
        p.add_argument('--fdc-csv', help=f'FoodData Central CSV folder (or set {config.CSV_ENV}).')
        if name == 'usda-api':
            p.add_argument('--compare-csv', action='store_true', help='Compare with the local CSV snapshot.')
    args = parser.parse_args(argv)
    cfg = config.load(getattr(args, 'fdc_csv', None))
    if args.command == 'checks':
        try:
            report = checks.run_all(evidence=checks.REPOSITORY_ONLY if args.repository_only else checks.STRICT)
        except FileNotFoundError as exc:
            print(f'Error: {exc.filename} not found; run npm run export:catalog first.', file=sys.stderr)
            return 1
        write_output(cfg, 'findings.json', report)
        config.ensure_ignored(cfg.output_dir)
        (cfg.output_dir / 'FINDINGS.md').write_text(checks.render_markdown(report), encoding='utf-8')
        for c in report['checks']:
            print(f'{c["check"]:26} {c["mode"]:11} ' + ('not checked' if c['findings'] is None else f'{c["findings"]} finding(s)'))
        audit = report['evidenceAudit']
        print(f'Evidence audit: NOT CHECKED. {audit["note"]}' if not audit['checked'] else
              f'Evidence audit (strict): {audit["reportsFound"]} of {audit["reportsExpected"]} API reports found, '
              f'{audit["reportsMissing"]} missing.')
        print('Wrote research-output/findings.json and research-output/FINDINGS.md')
        return 1 if any(f['severity'] == 'blocking' for f in report['findings']) else 0
    if args.command == 'tag-evidence':
        return run_tag_evidence(cfg, args.threshold)
    try:
        if args.fdc_id <= 0:
            raise config.ConfigError('FDC ID must be positive.')
        if args.command == 'usda-csv':
            entry = csv_entry(cfg, args.fdc_id)
            path = write_output(cfg, f'usda-csv-{args.fdc_id}.json',
                                {'record': entry['record'], 'provenance': entry['provenance']})
            print(f'{entry["record"]["description"]}: {len(entry["record"]["nutrients"])} nutrient rows, '
                  f'{len(entry["record"]["portions"])} portions. Wrote {path.relative_to(cfg.repo)}')
        elif args.command == 'check-runtime':
            data = json.loads((cfg.repo / 'src/data/usda/approved-ingredients.json').read_text(encoding='utf-8'))
            records = [r for r in data['ingredients'] if r['fdcId'] == str(args.fdc_id)]
            if not records:
                raise config.ConfigError(f'FDC {args.fdc_id} has no approved runtime record.')
            entry = csv_entry(cfg, args.fdc_id)
            report = [{'ingredient': r['ingredient'], 'nutrientsChecked': len(r['nutrients']),
                       'differences': runtime_differences(r, entry['record'])} for r in records]
            path = write_output(cfg, f'check-runtime-{args.fdc_id}.json',
                                {'fdcId': str(args.fdc_id), 'provenance': entry['provenance'], 'records': report})
            for r in report:
                print(f'{r["ingredient"]}: {r["nutrientsChecked"]} nutrients checked, '
                      f'{len(r["differences"])} differences.')
            print(f'Wrote {path.relative_to(cfg.repo)}')
            return 1 if any(r['differences'] for r in report) else 0
        else:
            entry = csv_entry(cfg, args.fdc_id) if args.compare_csv else None
            adapter = UsdaApiAdapter(Cache(cfg.cache_dir))
            record, provenance = adapter.fetch(args.fdc_id)
            document = {'record': record, 'provenance': provenance, 'status': 'unreviewed-candidate'}
            if entry:
                document['comparison'] = adapter.compare(record, entry['compare'])
                document['csvProvenance'] = entry['provenance']
            path = write_output(cfg, f'usda-api-{args.fdc_id}.json', document)
            if entry:
                print(json.dumps(document['comparison']['summary'], indent=2))
            print(f'Wrote {path.relative_to(cfg.repo)}')
    except (config.ConfigError, ApiError, CacheRefused) as exc:
        print(f'Error: {exc}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
