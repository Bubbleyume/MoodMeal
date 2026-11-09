"""What a recipe line must establish before it can be reviewed (pure functions, no I/O).

Item 4 of the Phase 1 backlog. Nothing here approves anything: it only says which
facts a line states and which are missing. The word tables below are the written
attribute tables the item 3 sheet (AR-1) refers to; matching is by whole words,
never by how similar two descriptions sound.
"""
import re
from fractions import Fraction

# US customary kitchen volumes, the same standard as src/lib/units.ts
# (1 cup = 16 tbsp = 48 tsp). Fluid ounces follow from it: 1 fl oz = 2 tbsp.
VOLUME_IN_TSP = {'tsp': 1, 'tbsp': 3, 'fl oz': 6, 'cup': 48}
# Exact definitions: 1 US tsp = 4.92892159375 mL.
ML_PER_TSP = 4.92892159375
METRIC_ML = {'ml': 1, 'l': 1000}
# Exact mass definitions (international avoirdupois).
GRAMS_PER_MASS_UNIT = {'g': 1, 'kg': 1000, 'oz': 28.349523125, 'lb': 453.59237}

UNIT_ALIASES = {
    'tsp': 'tsp', 'teaspoon': 'tsp', 'teaspoons': 'tsp',
    'tbsp': 'tbsp', 'tbs': 'tbsp', 'tablespoon': 'tbsp', 'tablespoons': 'tbsp',
    'cup': 'cup', 'cups': 'cup',
    'fl oz': 'fl oz', 'fluid ounce': 'fl oz', 'fluid ounces': 'fl oz',
    'ml': 'ml', 'milliliter': 'ml', 'milliliters': 'ml', 'l': 'l', 'liter': 'l', 'liters': 'l',
    'g': 'g', 'gram': 'g', 'grams': 'g', 'kg': 'kg',
    'oz': 'oz', 'ounce': 'oz', 'ounces': 'oz', 'lb': 'lb', 'lbs': 'lb', 'pound': 'lb', 'pounds': 'lb',
}

# Preparation states. A description word from another group conflicts with the request.
STATE_WORDS = {
    'raw': {'raw'},
    'cooked': {'cooked', 'boiled', 'baked', 'roasted', 'steamed', 'fried', 'grilled', 'broiled',
               'braised', 'stewed', 'microwaved', 'sauteed', 'toasted', 'poached', 'scrambled'},
    'dry': {'dry', 'dried', 'uncooked', 'unprepared', 'dehydrated'},
    'brewed': {'brewed', 'prepared', 'infusion'},
    'frozen': {'frozen'},
    'canned': {'canned'},
    # Oils, sauces, honey and the like: eaten as sold. USDA descriptions rarely say so.
    'ready-to-use': set(),
}
# Recipe-note words that state a preparation, mapped to their group.
NOTE_STATE = {w: group for group, words in STATE_WORDS.items() for w in words}
NOTE_STATE.update({'massaged': 'raw', 'cooled': 'cooked'})

FORM_WORDS = {'chopped', 'sliced', 'diced', 'cubed', 'mashed', 'grated', 'shredded', 'minced',
              'whole', 'juiced', 'ground', 'crumbled', 'torn', 'peeled', 'halved', 'hulled', 'chunks'}

UNMEASURED = re.compile(r'\b(to taste|a few|pinch|handful|splash|dash|as needed)\b', re.I)


def words(text):
    """Lower-case words with accents folded (sautéed -> sauteed)."""
    folded = (text or '').lower().translate(str.maketrans('àáâäèéêëìíîïòóôöùúûüç', 'aaaaeeeeiiiioooouuuuc'))
    return re.findall(r'[a-z0-9]+', folded)


def parse_quantity(raw):
    """'1', '1/2', '1 1/2', '0.75' -> float. Anything else (None, 'to taste', '0') -> None."""
    if raw is None or isinstance(raw, bool):
        return None
    if isinstance(raw, (int, float)):
        return float(raw) if raw > 0 else None
    text = str(raw).strip()
    m = re.fullmatch(r'(\d+(?:\.\d+)?)(?:\s+(\d+/\d+))?|(\d+/\d+)', text)
    if not m:
        return None
    try:
        value = Fraction(m.group(3)) if m.group(3) else Fraction(m.group(1)) + (Fraction(m.group(2)) if m.group(2) else 0)
    except (ValueError, ZeroDivisionError):
        return None
    return float(value) if value > 0 else None


def normalize_unit(raw):
    """Canonical unit name, or the lower-cased text itself for count units ('each', 'clove')."""
    text = ' '.join(words(raw))
    return UNIT_ALIASES.get(text, text or None)


def unit_class(unit):
    if unit in GRAMS_PER_MASS_UNIT:
        return 'mass'
    if unit in VOLUME_IN_TSP:
        return 'volume'
    if unit in METRIC_ML:
        return 'metric-volume'
    return 'count' if unit else None


def state_from_notes(notes):
    found = sorted({NOTE_STATE[w] for w in words(notes) if w in NOTE_STATE})
    return found[0] if len(found) == 1 else None


def forms_from_notes(notes):
    return sorted({w for w in words(notes) if w in FORM_WORDS})


NEGATIONS = {'excluding', 'without', 'not', 'no', 'except'}


def stated_words(description):
    """Description words, minus those after a negation within the same comma-separated part,
    so 'Walnuts, excluding honey roasted' does not read as roasted."""
    kept = set()
    for part in (description or '').split(','):
        for w in words(part):
            if w in NEGATIONS:
                break
            kept.add(w)
    return kept


def describe_state(description, state):
    """How a USDA description relates to the requested state: matches, conflicts or not stated."""
    present = stated_words(description)
    groups = {g for g, ws in STATE_WORDS.items() if ws & present}
    if state is None:
        return {'result': 'state not requested', 'descriptionStates': sorted(groups)}
    if state in groups:
        return {'result': 'matches' if len(groups) == 1 else 'mixed', 'descriptionStates': sorted(groups)}
    if groups:
        return {'result': 'conflicts', 'descriptionStates': sorted(groups)}
    return {'result': 'not stated in description', 'descriptionStates': []}


def check(line):
    """Requirements for one line: {'quantity','unit','unitClass','state','forms','items'}.

    `line` has label, quantity (number, fraction text or None), unit, notes and state
    (an explicit state overrides the notes). Identity is always left to the owner.
    """
    quantity = parse_quantity(line.get('quantity'))
    unit = normalize_unit(line.get('unit'))
    notes = line.get('notes') or ''
    state = line.get('state') or state_from_notes(notes)
    forms = sorted(set(line.get('forms') or []) | set(forms_from_notes(notes)))
    unmeasured = bool(UNMEASURED.search(notes)) or bool(UNMEASURED.search(str(line.get('quantity') or '')))
    items = [
        {'id': 'identity', 'status': 'needs-owner-decision', 'value': line['label'],
         'detail': 'Which USDA record is this food? Candidates below are search results, not matches.'},
        {'id': 'state', 'status': 'met' if state else 'missing', 'value': state,
         'detail': 'Stated by the request.' if line.get('state') else
                   ('Read from the recipe notes.' if state else 'Raw, cooked, dry or another state is not stated.')},
        {'id': 'form', 'status': 'stated' if forms else 'not-stated', 'value': forms,
         'detail': 'Form words from the notes; a different form can change the weight.'},
        {'id': 'amount', 'status': 'met' if quantity and unit else 'missing',
         'value': {'quantity': quantity, 'unit': unit},
         'detail': ('Unmeasured wording such as "to taste" or "a few"; see item 3, UL-2 and UL-3.'
                    if unmeasured else 'No numeric quantity with a unit.') if not (quantity and unit) else
                   f'{unit_class(unit)} unit.'},
    ]
    return {'quantity': quantity, 'unit': unit, 'unitClass': unit_class(unit), 'state': state,
            'forms': forms, 'items': items}


LEADING_AMOUNT = re.compile(r'^\s*(\d+(?:\.\d+)?(?:\s+\d+/\d+)?|\d+/\d+)\s+(.*)$')


def portion_label(portion):
    """Readable portion text. FNDDS modifiers are numeric codes, so they are left out."""
    modifier = portion.get('modifier')
    if modifier and modifier.strip().isdigit():
        modifier = None
    return ' '.join(x for x in (modifier, portion.get('portionDescription')) if x) or None


def portion_measure(portion, measure_units):
    """{'unit', 'qualifier', 'amount', 'label'} for a USDA portion.

    SR Legacy puts the unit in the modifier ('tbsp', 'cup, chopped'); Foundation uses a
    measure unit ID; FNDDS leaves the amount blank and writes '1 tablespoon' in the
    description, so the leading number becomes the amount there.
    """
    label = portion_label(portion)
    amount = portion.get('amount')
    text = label or ''
    if not amount:
        m = LEADING_AMOUNT.match(text)
        if m:
            amount, text = parse_quantity(m.group(1)), m.group(2)
    mid = portion.get('measureUnitId')
    name = measure_units.get(mid) if mid and mid != '9999' else None
    if name:
        return {'unit': normalize_unit(name), 'qualifier': ' '.join(words(text)) or None,
                'amount': amount, 'label': label}
    head, _, rest = text.partition(',')
    head_words = words(head)
    for size in (2, 1):  # 'fl oz' before 'oz'
        if len(head_words) >= size:
            unit = UNIT_ALIASES.get(' '.join(head_words[:size]))
            if unit:
                qualifier = ' '.join(head_words[size:] + words(rest))
                return {'unit': unit, 'qualifier': qualifier or None, 'amount': amount, 'label': label}
    return {'unit': None, 'qualifier': ' '.join(words(text)) or None, 'amount': amount, 'label': label}


def grams_per_unit(portion, amount, p_unit, unit):
    """Grams of one requested unit from one portion, with how it was derived; None when it can't be."""
    grams = portion.get('gramWeight')
    if grams is None or not amount:
        return None
    per = grams / amount
    if p_unit == unit:
        return per, 'direct', f'USDA portion {portion["id"]}: {amount:g} {p_unit} = {grams:g} g.'
    if p_unit in VOLUME_IN_TSP and unit in VOLUME_IN_TSP:
        factor = VOLUME_IN_TSP[unit] / VOLUME_IN_TSP[p_unit]
        return per * factor, 'derived-us-customary', (
            f'USDA portion {portion["id"]}: {amount:g} {p_unit} = {grams:g} g, '
            f'times {Fraction(factor).limit_denominator(48)} {p_unit} per {unit} (1 cup = 16 tbsp = 48 tsp).')
    if p_unit in METRIC_ML and unit in VOLUME_IN_TSP:
        ml = METRIC_ML[p_unit] * amount
        per_tsp = grams / (ml / ML_PER_TSP)
        return per_tsp * VOLUME_IN_TSP[unit], 'derived-metric', (
            f'USDA portion {portion["id"]}: {amount:g} {p_unit} = {grams:g} g, converted with the exact '
            f'definition 1 US tsp = {ML_PER_TSP} mL. Not one of the US customary ratios in units.ts.')
    return None
