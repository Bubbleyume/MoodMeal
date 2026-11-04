"""Source provenance attached to every research value."""
import hashlib
import json
from dataclasses import asdict, dataclass

USDA_FDC_LICENCE = 'USDA FoodData Central; CC0 1.0 public domain dedication'


def checksum(document) -> str:
    canonical = json.dumps(document, sort_keys=True, separators=(',', ':'), ensure_ascii=True)
    return hashlib.sha256(canonical.encode('utf-8')).hexdigest()


@dataclass(frozen=True)
class SourceRecord:
    source: str          # e.g. 'USDA FoodData Central CSV'
    adapter: str         # adapter name
    identifier: str      # e.g. FDC ID
    licence: str
    snapshot: str | None = None   # CSV snapshot folder name, when applicable
    url: str | None = None        # credentials always redacted
    retrievedAt: str | None = None

    def to_dict(self):
        return asdict(self)
