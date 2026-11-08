"""Read-only USDA FoodData Central API adapter.

Reuses normalize(), request() and compare() from docs/usda/fdc_review.py
without modifying that file. It never calls fdc_review.save() or
already_saved() and never writes under docs/usda/; raw responses go only to
the git-ignored research cache. That cache is an evidence archive: fetch()
always makes a fresh request and never answers from it.
"""
import importlib.util
import os
from datetime import datetime, timezone

from ..config import REPO
from ..provenance import USDA_FDC_LICENCE, SourceRecord

KEY_ENV = 'FDC_API_KEY'


class ApiError(Exception):
    pass


def load_fdc_review(path=REPO / 'docs' / 'usda' / 'fdc_review.py'):
    spec = importlib.util.spec_from_file_location('moodmeal_fdc_review_shared', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class UsdaApiAdapter:
    name = 'usda-api'
    ephemeral = False
    licence = USDA_FDC_LICENCE

    def __init__(self, cache, fdc_review=None, key=None):
        self.cache = cache
        self.fdc = fdc_review or load_fdc_review()
        self._key = key

    def _api_key(self):
        key = (self._key or os.environ.get(KEY_ENV, '')).strip()
        if not key:
            raise ApiError(f'{KEY_ENV} is not set in this process environment.')
        return key

    def fetch(self, fdc_id):
        """One read-only request. Returns (normalized record, provenance dict)."""
        fdc_id = str(int(fdc_id))
        key = self._api_key()
        try:
            raw = self.fdc.request(f'food/{fdc_id}', key)
        except self.fdc.ReviewError as exc:
            raise ApiError(str(exc).replace(key, '[REDACTED]')) from None
        if str(raw.get('fdcId')) != fdc_id:
            raise ApiError('Returned FDC ID does not match the requested ID.')
        retrieved = datetime.now(timezone.utc).isoformat(timespec='seconds')
        url = f'{self.fdc.BASE}food/{fdc_id}?api_key={key}'
        self.cache.put(self, url, raw, self.licence, secrets=[key])
        record = self.fdc.normalize(raw)
        record['reviewStatus'] = 'unreviewed-candidate'
        provenance = SourceRecord('USDA FoodData Central API', self.name, fdc_id, self.licence,
                                  url=f'{self.fdc.BASE}food/{fdc_id}', retrievedAt=retrieved).to_dict()
        return record, provenance

    def compare(self, record, csv_compare_record):
        return self.fdc.compare(record, csv_compare_record)
