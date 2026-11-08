"""Content-addressed local research cache, git-ignored by requirement."""
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote, quote_plus

from .config import ConfigError, ensure_ignored, git_ignored
from .provenance import checksum

_KEY_PARAM = re.compile(r'(api_key=)[^&#\s"]*', re.IGNORECASE)


class CacheRefused(Exception):
    pass


def redact(text: str, secrets=()) -> str:
    text = _KEY_PARAM.sub(r'\1[REDACTED]', text)
    for secret in secrets:
        if secret:
            for form in {secret, quote(secret, safe=''), quote_plus(secret), json.dumps(secret)[1:-1]}:
                text = text.replace(form, '[REDACTED]')
    return text


class Cache:
    def __init__(self, directory: Path, is_ignored=git_ignored):
        self.directory = Path(directory)
        self._is_ignored = is_ignored

    def _key(self, adapter_name: str, url: str) -> str:
        return checksum({'adapter': adapter_name, 'url': url})

    def put(self, adapter, url: str, payload, licence: str, secrets=()) -> Path:
        if getattr(adapter, 'ephemeral', True):
            raise CacheRefused(f'{getattr(adapter, "name", adapter)} is ephemeral; its data is never cached.')
        try:
            ensure_ignored(self.directory, self._is_ignored)
        except ConfigError as exc:
            raise CacheRefused(str(exc)) from None
        safe_url = redact(url, secrets)
        # Redact before checksumming so the checksum covers exactly the payload stored.
        safe_payload = json.loads(redact(json.dumps(payload, ensure_ascii=True), secrets))
        document = {'adapter': adapter.name, 'url': safe_url,
                    'retrievedAt': datetime.now(timezone.utc).isoformat(timespec='seconds'),
                    'licence': licence, 'checksum': checksum(safe_payload), 'payload': safe_payload}
        encoded = json.dumps(document, indent=2, ensure_ascii=True)
        if any(s and s in encoded for s in secrets):
            raise CacheRefused('A secret survived redaction; nothing was written.')
        self.directory.mkdir(parents=True, exist_ok=True)
        path = self.directory / f'{self._key(adapter.name, safe_url)}.json'
        tmp = path.with_suffix('.tmp')
        tmp.write_text(encoded, encoding='utf-8')
        os.replace(tmp, path)
        return path

    def get(self, adapter_name: str, url: str, secrets=()):
        path = self.directory / f'{self._key(adapter_name, redact(url, secrets))}.json'
        if not path.is_file():
            return None
        document = json.loads(path.read_text(encoding='utf-8'))
        if checksum(document['payload']) != document['checksum']:
            raise CacheRefused(f'Cache entry {path.name} failed its checksum.')
        return document
