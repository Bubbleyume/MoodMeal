/**
 * The official MoodMeal logo mark (see src/data/assets.ts BRANDING.logo).
 * Always rendered at its native 1:1 aspect ratio — never stretched,
 * squashed, cropped, or recolored — and used sparingly (app icon/favicon,
 * a small brand mark on Welcome/loading, About/Profile), not on every
 * screen. Falls back to the text wordmark if the asset is ever missing.
 */
import React from "react";
import AssetImage from "./AssetImage";
import { BRANDING } from "../data/assets";

interface BrandLogoProps {
  className?: string;
}

export default function BrandLogo({ className = "h-14 w-14" }: BrandLogoProps) {
  return (
    <AssetImage
      src={BRANDING.logo}
      alt="MoodMeal"
      className={`${className} rounded-2xl object-contain`}
      fallback={
        <span className={`${className} flex items-center justify-center rounded-2xl bg-gradient-to-br from-moodPink-500 via-moodViolet-400 to-moodViolet-500 font-display font-extrabold text-white`}>
          MM
        </span>
      }
    />
  );
}
