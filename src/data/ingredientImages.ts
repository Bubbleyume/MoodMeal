// Central resolver from an ingredient or grocery label to its illustration(s).
//
// docs/ingredient-artwork-coverage.json is the single source of truth for
// which artwork illustrates each recipe ingredient label. Labels are matched
// exactly (case-insensitive), never by fuzzy pattern, so an illustration is
// never borrowed from a different food (oat flour stays oat flour, not
// steel-cut oats). Grocery items added from a Food card resolve through the
// food's own artwork. Anything else has no image and callers show a fallback.
//
// Images are illustration only, never evidence of recipe identity, portions
// or nutrient composition. Small slots always load the 160 px WebP from
// thumbs/ (built by scripts/make-thumbnails.py), never the 1254 px original.
import coverage from "../../docs/ingredient-artwork-coverage.json";
import { FOODS } from "./foods";

export interface IngredientImage {
  /** 160 px WebP thumbnail served to the UI. */
  src: string;
  /** Full-resolution original artwork the thumbnail was built from. */
  original: string;
  alt: string;
}

const ARTWORK_PATH = /^\/assets\/(ingredients|foods)\/([a-z0-9-]+)\.(png|webp)$/;

export function thumbnailPath(original: string): string {
  const match = original.match(ARTWORK_PATH);
  if (!match) throw new Error(`Unexpected artwork path: ${original}`);
  return `/assets/${match[1]}/thumbs/${match[2]}.webp`;
}

function subjectName(original: string): string {
  const [, folder, id] = original.match(ARTWORK_PATH)!;
  if (folder === "foods") {
    const food = FOODS.find((f) => f.id === id);
    if (food) return food.name.toLowerCase();
  }
  return id.replace(/-/g, " ");
}

function toImage(original: string): IngredientImage {
  return {
    src: thumbnailPath(original),
    original,
    alt: `Illustration of ${subjectName(original)}`,
  };
}

const key = (name: string) => name.trim().toLowerCase();

const BY_LABEL = new Map<string, IngredientImage[]>(
  coverage.map((entry) => [key(entry.ingredient), entry.images.map(toImage)]),
);

/** Ingredient labels with artwork, as listed in the coverage manifest. */
export const COVERED_INGREDIENT_LABELS = coverage.map((e) => e.ingredient);

export function ingredientImages(name: string): IngredientImage[] {
  const byLabel = BY_LABEL.get(key(name));
  if (byLabel) return byLabel;
  const food = FOODS.find((f) => key(f.name) === key(name));
  return food ? [toImage(food.image)] : [];
}
