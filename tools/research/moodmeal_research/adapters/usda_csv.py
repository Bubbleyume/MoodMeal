"""Streaming reader for a local FoodData Central CSV snapshot (read-only)."""
import csv
from pathlib import Path

from ..normalize import compare_shape, from_csv
from ..provenance import USDA_FDC_LICENCE, SourceRecord


class UsdaCsvAdapter:
    name = 'usda-csv'
    ephemeral = False
    licence = USDA_FDC_LICENCE

    def __init__(self, folder: Path):
        self.folder = Path(folder)
        self.snapshot = self.folder.name

    def _rows(self, filename, keep=None, key='fdc_id'):
        """Yield dict rows; with `keep`, only rows whose `key` column is in it."""
        with (self.folder / filename).open(encoding='utf-8-sig', newline='') as f:
            reader = csv.reader(f)
            header = next(reader)
            index = header.index(key) if keep is not None else None
            for row in reader:
                if keep is None or row[index] in keep:
                    yield dict(zip(header, row))

    def load(self, fdc_ids):
        """Return {fdcId: {'record', 'compare', 'provenance'}} for the IDs found; one pass per file."""
        ids = {str(i) for i in fdc_ids}
        foods = {r['fdc_id']: r for r in self._rows('food.csv', ids)}
        definitions = {r['id']: r for r in self._rows('nutrient.csv')}
        nutrient_rows = {i: [] for i in foods}
        for row in self._rows('food_nutrient.csv', set(foods)):
            nutrient_rows[row['fdc_id']].append(row)
        portion_rows = {i: [] for i in foods}
        for row in self._rows('food_portion.csv', set(foods)):
            portion_rows[row['fdc_id']].append(row)
        result = {}
        for fdc_id, food in foods.items():
            result[fdc_id] = {
                'record': from_csv(food, definitions, nutrient_rows[fdc_id], portion_rows[fdc_id], self.snapshot),
                'compare': compare_shape(food, definitions, nutrient_rows[fdc_id], portion_rows[fdc_id]),
                'provenance': SourceRecord('USDA FoodData Central CSV', self.name, fdc_id, self.licence,
                                           snapshot=self.snapshot).to_dict(),
            }
        return result
