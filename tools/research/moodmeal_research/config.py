"""Paths for the research engine. No user-specific defaults."""
import os
import subprocess
from dataclasses import dataclass
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
CSV_ENV = 'MOODMEAL_FDC_CSV_DIR'
CSV_FILES = ('food.csv', 'nutrient.csv', 'food_nutrient.csv', 'food_portion.csv')


class ConfigError(Exception):
    pass


@dataclass(frozen=True)
class Config:
    repo: Path
    cache_dir: Path
    output_dir: Path
    fdc_csv: Path | None

    def require_csv(self) -> Path:
        if self.fdc_csv is None:
            raise ConfigError(f'No FoodData Central CSV folder: pass --fdc-csv or set {CSV_ENV}.')
        missing = [name for name in CSV_FILES if not (self.fdc_csv / name).is_file()]
        if missing:
            raise ConfigError(f'FoodData Central CSV folder {self.fdc_csv} lacks: {", ".join(missing)}.')
        return self.fdc_csv


def load(fdc_csv: str | None = None, repo: Path = REPO) -> Config:
    raw = fdc_csv or os.environ.get(CSV_ENV, '').strip() or None
    return Config(repo=repo, cache_dir=repo / 'research-cache', output_dir=repo / 'research-output',
                  fdc_csv=Path(raw) if raw else None)


def git_ignored(path: Path, repo: Path = REPO) -> bool:
    """True only if git reports a file inside `path` as ignored."""
    try:
        probe = (path / '.ignore-probe').resolve().relative_to(repo.resolve())
    except ValueError:
        return False  # outside the repository: cannot be proven ignored
    result = subprocess.run(['git', 'check-ignore', '-q', probe.as_posix()], cwd=repo,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return result.returncode == 0


def ensure_ignored(path: Path, is_ignored=git_ignored) -> None:
    if not is_ignored(path):
        raise ConfigError(f'{path} is not git-ignored; refusing to write research data there.')
