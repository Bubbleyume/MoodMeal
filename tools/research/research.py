"""MoodMeal research engine CLI (development only; read-only for app data).

Run with:  python -I -B tools/research/research.py <command> [options]

  usda-csv <fdcId> --fdc-csv DIR          Normalized record from the local CSV snapshot.
  check-runtime <fdcId> --fdc-csv DIR     Compare an approved runtime record with the CSV.
  usda-api <fdcId> --compare-csv --fdc-csv DIR
                                          One read-only API request, compared with the CSV.
  checks                                  Ledger, runtime and catalog consistency report.
  tag-evidence --fdc-csv DIR [--threshold 0.10]
                                          Stage C: food tags vs %DV per RACC (report only).
  ingredient "<label>" --quantity Q --unit U [--state S] [--form F] --fdc-csv DIR
  ingredient --recipe RECIPE_ID --line N --fdc-csv DIR
                                          Candidate-only review record for one recipe line:
                                          requirements, USDA candidates, portion weights,
                                          evidence status and a blank decision (item 4).

Outputs go to research-output/ and raw API responses to research-cache/; both
must be git-ignored or nothing is written.
"""
import argparse
import json
import sys
from pathlib import Path

# python -I does not put this folder on sys.path.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from moodmeal_research import checks, config, ingredient, tag_evidence  # noqa: E402
from moodmeal_research.requirements import STATE_WORDS  # noqa: E402
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


def ingredient_request(cfg, args):
    """The line to research, from the catalog (--recipe/--line) or from the arguments."""
    if args.recipe is not None or args.line is not None:
        if args.recipe is None or args.line is None or args.label:
            raise config.ConfigError('Use either --recipe with --line, or a label with --quantity and --unit.')
        catalog_path = cfg.repo / 'research-output/catalog.json'
        catalog = json.loads(catalog_path.read_text(encoding='utf-8'))
        recipe = next((r for r in catalog['recipes'] if r['id'] == args.recipe), None)
        if recipe is None:
            raise config.ConfigError(f'Recipe {args.recipe} is not in research-output/catalog.json.')
        if not 0 <= args.line < len(recipe['lines']):
            raise config.ConfigError(f'{args.recipe} has lines 0 to {len(recipe["lines"]) - 1}.')
        s = recipe['lines'][args.line]['structured']
        request = {'recipeId': args.recipe, 'lineIndex': args.line, 'label': s['name'],
                   'quantity': s['quantity'], 'unit': s['unit'], 'notes': s['notes']}
        inputs = {'catalog': {'path': 'research-output/catalog.json', 'sourceCommit': catalog['sourceCommit'],
                              'sha256': ingredient.sha256_file(catalog_path)}}
    else:
        if not args.label:
            raise config.ConfigError('Give a label, or --recipe and --line.')
        request = {'label': args.label, 'quantity': args.quantity, 'unit': args.unit, 'notes': args.notes or ''}
        inputs = {}
    request.update({'state': args.state, 'forms': args.form or [], 'search': args.search,
                    'fdcIds': [str(i) for i in args.fdc_id or []]})
    return request, inputs


def run_ingredient(cfg, args):
    try:
        if args.max_candidates < 1:
            raise config.ConfigError('--max-candidates must be at least 1.')
        folder = cfg.require_csv()
        request, inputs = ingredient_request(cfg, args)
        ledger_path = cfg.repo / 'docs/usda/remaining-ingredient-review.json'
        runtime_path = cfg.repo / 'src/data/usda/approved-ingredients.json'
        ledger = checks.load(ledger_path)
        runtime = checks.load(runtime_path)
        for key, path in (('ledger', ledger_path), ('runtime', runtime_path),
                          ('foodPortion', folder / 'food_portion.csv'), ('measureUnit', folder / 'measure_unit.csv')):
            if path.is_file():
                inputs[key] = {'path': path.name if key in ('foodPortion', 'measureUnit') else path.relative_to(cfg.repo).as_posix(),
                               'sha256': ingredient.sha256_file(path)}
        out_dir = cfg.output_dir / 'ingredients'
        config.ensure_ignored(out_dir)
        record = ingredient.build_record(request, folder, ledger, runtime, inputs, args.max_candidates)
    except FileNotFoundError as exc:
        print(f'Error: {exc.filename} not found; run npm run export:catalog first.', file=sys.stderr)
        return 1
    except config.ConfigError as exc:
        print(f'Error: {exc}', file=sys.stderr)
        return 1
    out_dir.mkdir(parents=True, exist_ok=True)
    name = ingredient.slug(request)
    (out_dir / f'{name}.json').write_text(json.dumps(record, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    (out_dir / f'{name}.md').write_text(ingredient.render_markdown(record), encoding='utf-8')
    print(f'{request["label"]}: evidence status {record["evidenceStatus"]}'
          + (f' (missing: {", ".join(record["statusReasons"])})' if record['statusReasons'] else '')
          + f'; {len(record["candidates"])} candidate(s), {record["search"]["totalMatches"]} search match(es).')
    for c in record['candidates']:
        grams = sorted({round(o['grams'], 3) for o in c['weight']['options']})
        print(f'  FDC {c["fdcId"]} {c["description"]} [{c["dataType"]}; {"+".join(c["foundBy"])}]: '
              f'state: {c["state"]["result"]}; weight: {c["weight"]["status"]}'
              + (f' {", ".join(f"{g:g} g" for g in grams)}' if grams else ''))
    print(f'Wrote research-output/ingredients/{name}.json and .md ({record["fingerprint"]}). Nothing was approved.')
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
    ig = sub.add_parser('ingredient', help='Candidate-only review record for one recipe line (item 4). Approves nothing.')
    ig.add_argument('label', nargs='?', help='Ingredient label, e.g. "Olive oil".')
    ig.add_argument('--quantity', help='Amount: 1, 1/2, 1 1/2 or 0.75.')
    ig.add_argument('--unit', help='tsp, tbsp, cup, fl oz, g, oz, or a count unit such as each or clove.')
    ig.add_argument('--notes', help='Recipe notes, e.g. "chopped" or "cooked".')
    ig.add_argument('--state', choices=sorted(STATE_WORDS), help='Preparation state; overrides the notes.')
    ig.add_argument('--form', action='append', help='Form word such as chopped (repeatable).')
    ig.add_argument('--search', help='Search text when it should differ from the label.')
    ig.add_argument('--fdc-id', type=int, action='append', help='Also include this FDC ID (repeatable).')
    ig.add_argument('--recipe', help='Recipe ID from research-output/catalog.json (run npm run export:catalog first).')
    ig.add_argument('--line', type=int, help='Line index within --recipe, from 0.')
    ig.add_argument('--max-candidates', type=int, default=8, help='Search results to show (default 8).')
    ig.add_argument('--fdc-csv', help=f'FoodData Central CSV folder (or set {config.CSV_ENV}).')
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
    if args.command == 'ingredient':
        return run_ingredient(cfg, args)
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
