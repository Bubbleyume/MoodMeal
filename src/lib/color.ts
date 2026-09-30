// Small "#rrggbb" color helpers shared by the avatar renderer and pickers.

/** Perceptual luma (0-255) of a "#rrggbb" hex — higher means lighter. */
export function relativeLuma(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 255;
  const num = parseInt(m[1], 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/** Whether a "#rrggbb" hex reads as "light" above the given luma threshold. */
export function isLightColor(hex: string, threshold = 190): boolean {
  return relativeLuma(hex) > threshold;
}

/** Darkens a "#rrggbb" hex by `amount` (0-1). */
export function shade(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const num = parseInt(m[1], 16);
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 0xff) * (1 - amount)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
