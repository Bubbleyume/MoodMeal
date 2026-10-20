"""Build src/data/usda/approved-ingredients.json from user-approved decisions.

Nutrients come from the retained FoodData Central CSV snapshot (the same
source as the pilot) and must match the saved pending-review API report
exactly; any disagreement stops the build. Missing values stay null.
Approving an ingredient does not publish recipe totals.
Run: python -I docs/usda/build-approved-ingredients.py
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
PILOT = json.loads((ROOT / 'src/data/usda/pilot-foods.json').read_text(encoding='utf-8'))
CSV = {**json.loads((HERE / 'batch-02-source-records.json').read_text(encoding='utf-8')),
       **json.loads((HERE / 'approved-source-records.json').read_text(encoding='utf-8'))}
OUT = ROOT / 'src/data/usda/approved-ingredients.json'

APPROVALS = [{
    'ingredient': 'Honey',
    'fdcId': '169640',
    'identity': 'Generic honey (USDA SR Legacy "Honey"); no brand, floral source or processing claims.',
    'preparation': 'Ready-to-use',
    'approvedBy': 'User (project owner) decisions H1-H3',
    'approvedDate': '2026-10-14',
    'apiReport': '20261014T081929Z-7f956233da664e6aaca7d65dd0475f96.json',
    'conversions': [
        {'quantity': 1, 'unit': 'tsp', 'grams': 7.0, 'basePortionId': '85265',
         'derivation': 'Derived: USDA 1 tbsp = 21 g (portion 85265) divided by 3 tsp per tbsp.'},
        {'quantity': 0.25, 'unit': 'cup', 'grams': 84.75, 'basePortionId': '85264',
         'derivation': 'Derived: USDA 1 cup = 339 g (portion 85264) divided by 4.'},
    ],
    'nutrientNotes': {
        '1235': 'USDA record has no added-sugars value. Kept null/Unknown, never zero or inferred from total sugars.',
    },
}]

B_DECISIONS = 'User (project owner) approved recommended rows of BATCH-REMAINING-14-PROPOSAL.md'
DATE = '2026-10-14'
SB = 'recipe-chamomile-comfort-toast'
NO_ADDED_SUGARS = {'1235': 'USDA record has no added-sugars value. Kept null/Unknown, never zero or inferred from total sugars.'}
# Cross-unit factors below (tsp from tbsp = 1/3, tbsp from cup = 1/16) use the
# app's single volume standard, US customary: 1 cup = 16 tbsp = 48 tsp
# (src/lib/units.ts). tests/knowledge.test.ts checks the built values agree.


def conv(quantity, unit, notes, recipes, base, factor, derivation):
    """A conversion approved only for this exact quantity, unit, notes and recipe set."""
    return {'quantity': quantity, 'unit': unit, 'notes': notes, 'recipeIds': recipes,
            'grams': None, 'basePortionId': base, 'factor': factor, 'derivation': derivation}


def approve(ingredient, fdc, report, identity, preparation, decision, conversions, notes=None,
           approved_date=DATE, approved_by=None, calculator_eligible=True):
    approval = {'ingredient': ingredient, 'fdcId': fdc, 'identity': identity, 'preparation': preparation,
            'approvedBy': approved_by or f'{B_DECISIONS} ({decision})',
            'approvedDate': approved_date, 'apiReport': report,
            'conversions': conversions, 'nutrientNotes': {**NO_ADDED_SUGARS, **(notes or {})}}
    if not calculator_eligible:
        approval['calculatorEligible'] = False
    return approval


APPROVALS += [
    approve('Banana', '173944', '20261014T081944Z-4ff87473cee1422bbe0b53109d36b08c.json',
            'Raw banana, peeled; unspecified size standardized to USDA medium (7 to 7-7/8 in long).', 'Raw edible flesh', 'B1', [
                conv(0.5, 'each', 'sliced', [SB], '93515', 0.5, 'Half of USDA medium banana 118 g (portion 93515).'),
                conv(0.5, 'each', '', ['recipe-calming-kefir-smoothie', 'recipe-tropical-energy-smoothie'], '93515', 0.5,
                     'Half of USDA medium banana 118 g (portion 93515).'),
                conv(1, 'each', 'mashed', ['recipe-sunshine-pancakes'], '93515', 1,
                     'USDA medium banana 118 g (portion 93515), raw weight before mashing and cooking.')]),
    approve('Almond butter', '168588', '20261014T081925Z-e95481b466524909bda020e686ca70e8.json',
            'Plain almond butter without salt added.', 'Ready-to-eat', 'B2', [
                conv(2, 'tbsp', '', [SB], '83375', 2, 'USDA 1 tbsp = 16 g (portion 83375) x 2.'),
                conv(0.5, 'cup', '', ['recipe-green-tea-oat-bites'], '83376', 0.5, 'USDA 1 cup = 250 g (portion 83376) / 2.')],
            {'1283': 'API response has two phytosterol rows: sourced row 1372134 = 139 mg/100 g (matches CSV) and an empty duplicate with no row ID. Approved: keep the sourced 139 mg row; the empty duplicate stays preserved as evidence in the pending report.'}),
    approve('Sweet potato', '168482', '20261014T080936Z-897d0fc8b97240bcbee4b640b7552bb8.json',
            'Raw sweet potato; "1 sweet potato" standardized to the USDA 5 in long potato, 130 g edible weight.',
            'Raw input weight before toasting or pan-cooking', 'B3', [
                conv(1, 'each', 'peeled, sliced lengthwise into 1/4-inch planks', [SB], '83167', 1, 'USDA 1 sweetpotato, 5 in long = 130 g edible flesh (portion 83167); user approved peeled flesh on 2026-10-19.'),
                conv(1, 'each', 'diced', ['recipe-cozy-sweet-potato-hash'], '83167', 1, 'USDA 1 sweetpotato, 5 in long = 130 g edible (portion 83167).')],
            {'skin': 'For Chamomile & Sweet Potato Toast, user approved peeled edible flesh on 2026-10-19. "1/2 roasted" in Rice, Egg & Greens Bowl remains on hold.'}),
    approve('Egg', '171287', '20261014T081937Z-45dd515823dc45ed972ba318ef2436ab.json',
            'Whole raw egg, large, edible portion without shell.', 'Raw input weight before cooking', 'B4', [
                conv(2, 'each', '', ['recipe-cozy-sweet-potato-hash'], '88374', 2, 'USDA large egg 50 g (portion 88374) x 2.')],
            {'hold': 'Rice, Egg & Greens Bowl egg stays on hold until a cooking method is chosen.'}),
    approve('Egg', '173424', '20261014T081941Z-a496377f151f46c695d72d84d4a8dde1.json',
            'Whole egg, hard-boiled, large.', 'Cooked, hard-boiled', 'B4', [
                conv(1, 'each', '', ['recipe-gentle-avocado-toast'], '92500', 1, 'USDA hard-boiled large egg 50 g (portion 92500).')]),
    approve('Eggs', '171287', '20261014T081937Z-45dd515823dc45ed972ba318ef2436ab.json',
            'Whole raw eggs, large, edible portion without shell.', 'Raw input to batter', 'B5', [
                conv(2, 'each', '', ['recipe-sunshine-pancakes'], '88374', 2, 'USDA large egg 50 g (portion 88374) x 2.')]),
    approve('Brown rice', '169704', '20261014T081930Z-46c3fa25d64242f8b794ee1e82e4bfba.json',
            'Brown rice, long-grain, cooked; never dry rice.', 'Cooked (recipes measure cooked rice)', 'B6', [
                conv(0.75, 'cup', 'cooked', ['recipe-energizing-power-bowl', 'recipe-iron-rich-stir-fry', 'recipe-brown-rice-veggie-bowl'],
                     '85378', 0.75, 'USDA 1 cup cooked = 202 g (portion 85378) x 3/4.')]),
    approve('Rolled oats', '173904', '20261014T081942Z-afcb7c03b18b4cfe9ba00398d40bb635.json',
            'Old-fashioned rolled oats matched to USDA SR "Cereals, oats, regular and quick, not fortified, dry". Foundation 2346396 not used: no fiber, no 1008 energy and no cup portion.',
            'Dry, uncooked', 'B7', [
                conv(0.5, 'cup', '', ['recipe-warm-oatmeal-berries'], '93454', 0.5, 'USDA 1 cup = 81 g (portion 93454) / 2.'),
                conv(1, 'cup', '', ['recipe-green-tea-oat-bites'], '93454', 1, 'USDA 1 cup = 81 g (portion 93454).')]),
    approve('Pineapple', '169124', '20261014T081928Z-9276935574834579a8c63e2135101062.json',
            'Fresh raw pineapple, not canned.', 'Raw edible flesh', 'B9', [
                conv(1, 'cup', '', ['recipe-tropical-energy-smoothie'], '84287', 1, 'USDA 1 cup chunks = 165 g (portion 84287).')],
            {'hold': 'Quinoa Fruit Salad "1/2 cup diced" stays on hold (diced-as-chunks convention not approved). Rainbow Fruit Skewers pilot approval is separate and unchanged.'}),
    approve('Pumpkin seeds', '170556', '20261014T081935Z-80856b5ee34347f7a7be28e51844e945.json',
            'Hulled pumpkin seed kernels (pepitas), raw/dried, unroasted, unsalted.', 'Dried kernels, no shells', 'B10', [
                conv(2, 'tbsp', '', ['recipe-brown-rice-veggie-bowl', 'recipe-magnesium-boost-bowl'], '86847', 0.125, 'Derived: USDA 1 cup = 129 g (portion 86847) / 8.'),
                conv(1, 'tbsp', '', ['recipe-crunchy-veggie-snack-plate'], '86847', 0.0625, 'Derived: USDA 1 cup = 129 g (portion 86847) / 16.')]),
    approve('Swiss chard', '169991', '20261014T081932Z-c145fda132414b8da358fac9a22aa8e7.json',
            'Raw Swiss chard, chopped.', 'Raw input weight, sauteed in separately listed oil', 'B11', [
                conv(2, 'cup', 'chopped', ['recipe-steak-and-greens'], '85834', 2, 'USDA 1 cup = 36 g (portion 85834) x 2.')],
            {'hold': '"Sauteed" cups in Brown Rice Veggie Bowl and Quinoa & Greens Bowl stay on hold; boiled 170401 is not a sauteed record.'}),
    approve('Almonds', '170567', '20261014T081936Z-fc3c1a93239c421a880bb39096abc3b4.json',
            'Raw, unsalted whole almonds.', 'Raw whole kernels', 'B13', [
                conv(0.25, 'cup', '', ['recipe-dark-chocolate-trail-mix'], '86863', 0.25, 'USDA 1 cup whole = 143 g (portion 86863) / 4.'),
                conv(2, 'tbsp', '', ['recipe-loaded-popcorn-mix'], '86863', 0.125, 'Derived: USDA 1 cup whole = 143 g (portion 86863) / 8.')],
            {'1283': 'API has an empty phytosterol row (null amount); kept unknown, never zero.',
             'hold': 'Turkey Lettuce Wraps "1 tbsp chopped" stays on hold (no native chopped portion).'}),
    approve('Whole-wheat bread', '172688', '20261014T081940Z-62ae301ba0e14cd491c3434c0c15c7f2.json',
            'Commercially prepared whole-wheat bread (label renamed from "Whole-grain bread").', 'As purchased, then toasted; untoasted slice weight', 'B14', [
                conv(1, 'slice', '', ['recipe-gentle-avocado-toast'], '91108', 1, 'USDA 1 slice = 32 g (portion 91108).')]),
    approve('Ground cinnamon', '171320', '20261015T005749Z-f986ddfd4a1543b8b82452e0ceb41585.json',
            'Ground cinnamon spice.', 'Dry spice', 'C1', [
                conv(0.0625, 'tsp', '', [SB, 'recipe-warm-oatmeal-berries'], '88429', 0.0625, 'Derived: USDA 1 tsp = 2.6 g (portion 88429) / 16.')],
            {'hold': 'Sunshine Pancakes "Cinnamon 1/2 tsp" is not approved.'}),
    approve('Chamomile tea bag', '174156', '20261015T005750Z-e2564d9ce89245c8a8d69ee81c0d8ca2.json',
            'Brewed chamomile tea; the tea bag itself is removed and excluded, like wooden skewers.', 'Brewed beverage', 'C2', [
                conv(1, 'each', '', [SB], '93843', 1, 'One bag steeped in 1 cup (8 fl oz) hot water: USDA 1 cup brewed = 237 g (portion 93843).')]),
]

APPROVALS.append(approve('Walnuts', '170187', '20261020T140047Z-8c2ff267ca874e0c9763a4014f9041db.json',
        'English walnuts per USDA SR Legacy record; exact approval is for the chopped topping in Warm Oatmeal with Berries only.',
        'Chopped; roasting and salt state are unspecified in the recipe and USDA food description.',
        'User approved the 1 tbsp chopped conversion for Warm Oatmeal with Berries only on 2026-10-20; Dark Chocolate Trail Mix remains held.',
        [conv(1, 'tbsp', 'chopped', ['recipe-warm-oatmeal-berries'], '86201', 1/16,
              'Derived: USDA 1 cup chopped = 117 g (portion 86201) divided by 16 tbsp per cup.')],
        {'hold': 'Dark Chocolate Trail Mix 1/4 cup remains unapproved; walnut form and English-walnut identity have not been confirmed.'},
        approved_date='2026-10-20',
        approved_by='User (project owner) approved the chopped 1 tbsp conversion for Warm Oatmeal with Berries only; Dark Chocolate Trail Mix remains held.',
        calculator_eligible=False))


def build(approval):
    fdc = approval['fdcId']
    source = CSV[fdc]
    report = json.loads((HERE / 'pending-review' / approval['apiReport']).read_text(encoding='utf-8'))
    api = report['record']
    if str(api['fdcId']) != fdc or report.get('approved') is not False:
        raise SystemExit(f'{fdc}: API report identity or status mismatch')
    nutrients = {}
    for d in PILOT['definitions']:
        row = source['nutrients'].get(d['id'])
        amount = row['amount'] if row else None
        unit = row['unit'] if row else d['unit']
        if unit != d['unit']:
            raise SystemExit(f'{fdc} {d["id"]}: unit {unit} != {d["unit"]}')
        a = api['nutrients'].get(d['id'])
        api_amount = a['amountPer100g'] if a else None
        if amount != api_amount:
            raise SystemExit(f'{fdc} {d["id"]}: CSV {amount} != API {api_amount}')
        nutrients[d['id']] = {'amount': amount, 'unit': d['unit'],
                              'sourceRowId': row['sourceRow']['id'] if row and row['sourceRow'] else None}
    portions = {p['id']: p for p in source['portions']}
    for c in approval['conversions']:
        base = float(portions[c['basePortionId']]['gram_weight'])
        if 'factor' in c:
            c['grams'] = round(base * c.pop('factor'), 6)
            continue
        expected = {'tsp': base / 3, 'cup': base * c['quantity']}[c['unit']]
        if abs(expected - c['grams']) > 1e-9:
            raise SystemExit(f'{fdc}: conversion {c} does not follow from portion {base} g')
    food = source['food']
    return {**approval, 'description': food['description'], 'dataType': food['data_type'],
            'publicationDate': food['publication_date'], 'snapshot': PILOT['snapshot'],
            'sourceURL': f'https://fdc.nal.usda.gov/food-details/{fdc}/nutrients',
            'portions': source['portions'], 'nutrients': nutrients,
            'status': 'ingredient-approved', 'recipeTotalsPublished': False}


OUT.write_text(json.dumps({'snapshot': PILOT['snapshot'],
                           'note': 'Approved ingredient records only. Recipe totals require every ingredient to be reviewed.',
                           'ingredients': [build(a) for a in APPROVALS]}, indent=2) + '\n', encoding='utf-8')
print('Wrote ' + str(OUT.relative_to(ROOT)))
