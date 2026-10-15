"""Build small WebP thumbnails from the original food and ingredient artwork.

The originals (1254 px PNG/WebP) stay untouched. Thumbnails are written to
public/assets/<folder>/thumbs/<id>.webp at THUMB_SIZE px, which covers the
app's largest thumbnail (44 CSS px) at 3x pixel density, so small slots never
download full-resolution artwork.

Run from the moodmeal folder:  python scripts/make-thumbnails.py
"""

from pathlib import Path

from PIL import Image

THUMB_SIZE = 160
QUALITY = 82
ROOT = Path(__file__).resolve().parent.parent / "public" / "assets"
SOURCES = {"ingredients": "*.png", "foods": "*.webp"}


def main() -> None:
    for folder, pattern in SOURCES.items():
        out_dir = ROOT / folder / "thumbs"
        out_dir.mkdir(exist_ok=True)
        for src in sorted((ROOT / folder).glob(pattern)):
            with Image.open(src) as im:
                im = im.convert("RGB")
                if im.width != im.height:
                    raise SystemExit(f"{src.name}: expected square artwork, got {im.size}")
                thumb = im.resize((THUMB_SIZE, THUMB_SIZE), Image.Resampling.LANCZOS)
                out = out_dir / f"{src.stem}.webp"
                thumb.save(out, "WEBP", quality=QUALITY, method=6)
                print(f"{folder}/thumbs/{out.name} {out.stat().st_size} bytes")


if __name__ == "__main__":
    main()
