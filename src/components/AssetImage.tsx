/**
 * Renders a real image asset when one exists at `src`, and falls back to
 * `children` (typically an <ImagePlaceholder />) when it's missing or fails
 * to load. This is what lets the app be "asset-ready": every food/meal/
 * emotion/brand-logo spot in the UI already points at a real local path
 * (see src/data/assets.ts), and today's fallback content quietly takes over
 * until a real transparent PNG/WebP is dropped in at that path.
 *
 * Deliberately never points at a remote/invented URL — only same-origin
 * paths under /public/assets are ever passed in.
 */
import React, { useState } from "react";

interface AssetImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback: React.ReactNode;
}

export default function AssetImage({ src, alt, className = "", fallback }: AssetImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) return <>{fallback}</>;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
