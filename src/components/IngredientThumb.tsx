import { useState, useEffect } from "react";
import { Leaf } from "./icons";
import { ingredientImages } from "../data/ingredientImages";

/**
 * Small square ingredient illustration on the shared ivory artwork
 * background. A label with two illustrations (e.g. "Salt & pepper") shows
 * them overlapping; a label without artwork, or whose image fails to load,
 * shows a neutral leaf instead of a broken image.
 */
export default function IngredientThumb({
  name,
  className = "h-11 w-11",
}: {
  name: string;
  className?: string;
}) {
  const images = ingredientImages(name).slice(0, 2);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [name]);
  const box = `${className} relative shrink-0 overflow-hidden rounded-xl bg-[#fffaf3] ring-1 ring-slate-100`;
  if (!images.length || failed)
    return (
      <div className={`${box} flex items-center justify-center text-brand-300`} aria-hidden="true">
        <Leaf size={18} />
      </div>
    );
  const pair = images.length === 2;
  return (
    <div className={box}>
      {images.map((image, i) => (
        <img
          key={image.src}
          src={image.src}
          alt={image.alt}
          width={160}
          height={160}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className={
            pair
              ? `absolute h-[70%] w-[70%] object-contain ${i === 0 ? "left-0 top-0" : "bottom-0 right-0"}`
              : "h-full w-full object-contain"
          }
        />
      ))}
    </div>
  );
}
