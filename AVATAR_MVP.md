# MoodMeal: three preset avatars

Onboarding and Profile offer exactly Feminine, Androgynous, and Masculine.
The original transparent PNGs are under public/assets/avatars/presets/ and
src/data/avatarPresets.ts owns their labels, order, and asset mapping.
They are the three October 5, 2026 images ending AM-1, AM-2, and AM-3,
respectively, copied without resizing or editing (1086 x 1448, RGBA).

The shared Avatar renderer shows a full character or crops the same asset
for a Profile thumbnail. Expressions are fixed. Mood selection, recommendations,
history, diet preferences, and other app flows remain separate and unchanged.
Skin-tone and hairstyle controls and expression previews are deferred.

## Storage and compatibility

The moodmeal:avatar key still stores {baseStyle, skinTone, hairStyle}.
baseStyle selects the preset. Valid existing skin/hair values survive saves
but are not rendered. No new storage key or destructive migration is needed.
The existing normalizer still maps retired presets/base models to their base
styles. Unknown object values default to Feminine; null, arrays and primitive
values represent no avatar. Legacy fields were already normalized away before
this change. Inherited object properties are now rejected in legacy lookup maps.
Missing images show an accessible initial placeholder without retry loops.
Skip saves the existing Feminine default. Cancel does not save the draft.

## Verification (October 5, 2026)

- Typecheck passed.
- Standard build script encountered Node child-process spawn EPERM in this
  environment. Equivalent production esbuild CLI, Tailwind compilation,
  asset copy and index generation succeeded; that production output was tested.
- Browser: 375 x 812 mobile and 1440 x 900 desktop layouts checked visually.
- Each preset saved in Profile and survived reload; Profile crops checked.
- Keyboard arrow selection and cancellation without save checked.
- Missing PNG simulated in dist only: initial placeholder appeared, then
  original asset restored. No console errors during checked flows.
- Migration assertions passed for current data/JSON round trips, all legacy
  presets/base models, malformed values, and prototype-property names.

Earlier README art-system descriptions refer to the deferred SVG pipeline.
