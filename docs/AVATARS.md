# Avatar system

Onboarding and Profile use the accessible avatar creator. The current user-facing frame labels are **Soft Frame** and **Bold Frame**; legacy Androgynous avatars retain their Classic Frame label. The internal `feminine`, `masculine`, and `androgynous` IDs remain for saved-data compatibility.

The modular creator supports six skin tones. Each frame has seven hairstyles and independently remembered hair and eye colors. The avatar expression changes with the selected mood. Older preset avatars remain supported and are not automatically converted.

## Artwork and rendering

The modular artwork is stored under `public/assets/avatars/layers-v1/` as layered WebP files. Scalp, hair, base, expression, and iris layers are loaded before display. Hair and eye color filters affect only those artwork layers; they do not tint skin, clothing, eye whites, or pupils. Precomposed `modular-v1` artwork remains available for compatibility. Legacy preset artwork continues to render for unversioned configurations.

## Storage and compatibility

The app keeps the `moodmeal:avatar` localStorage key and existing `baseStyle`, `skinTone`, and `hairStyle` fields. Modular configurations opt in with `artworkVersion: "modular-v1"`; optional per-frame appearances remember hairstyle, hair color, and eye color independently. The top-level hairstyle mirrors the active frame for compatibility. Invalid stored values are normalized safely. The avatar represents the user; there is no separate mascot.

## Accessibility and failure handling

Avatar choices use accessible radio groups with keyboard navigation and a visible selected state. Layers preload before display so a partial face is not shown. If a mood expression is unavailable, the renderer falls back to neutral; if the artwork still cannot load, it shows a generic placeholder.

## Validation

Run `npm run typecheck`, `npm run test:avatars`, and `npm run test:browser`. Avatar tests cover legacy retention, malformed storage, appearance choices, color filters, and asset paths. Browser checks cover onboarding, Profile, keyboard operation, saving and reloads, and artwork fallback. Mobile layout checks use browser emulation; they are not a substitute for physical-device accessibility testing.
