import { useState, useEffect } from "react";
export default function FoodImage({
  src,
  name,
  className = "h-44 w-full",
}: {
  src: string;
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return failed ? (
    <div
      className={`${className} flex items-center justify-center bg-brand-50 p-4 text-center text-sm text-slate-500`}
    >
      {name}
      <br />
      Image unavailable
    </div>
  ) : (
    <img
      src={src}
      alt={name}
      loading="lazy"
      className={`${className} bg-[#fffaf3] object-contain`}
      onError={() => setFailed(true)}
    />
  );
}
