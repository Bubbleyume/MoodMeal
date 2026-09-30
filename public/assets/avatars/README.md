# Avatar asset layers

This tree is where the final, illustrated avatar artwork drops in once it
exists. Today, `src/components/avatar/Avatar.tsx` draws every layer as
hand-coded SVG shapes (deliberately simple placeholders — see that file's
top comment, and the swap-in-point comment above each `render*`/`<Eye>`/
`<Eyebrow>`/`<Mouth>` function), reading the same `id` values documented
here through the ASSET RESOLUTION layer, `src/data/avatarAssets.ts`.
Nothing about the avatar *system* (types, data, persistence, the Creator
UI, the emotion/expression mapping) needs to change when real artwork
replaces those shapes — only `avatarAssets.ts` (to point each `get*Asset`
getter at a real file) and that same small set of render functions in
`Avatar.tsx` need to change.

**The one rule that matters most: every file in every folder below is an
uncolored SHAPE — never a specific color baked in.** `avatarAssets.ts`
tints each shape at render time from the user's chosen color (skin tone,
hair color, eye color, or clothing color) or, for line-art layers, from a
contrast-adaptive "ink" color computed from skin tone. This is why there is
no `skin/` folder of its own (skin tone is a *tint*, applied to `base/`,
not a separate shape) and no top-level `expressions/` folder (expression is
folded into the `eyes/`/`eyebrows/`/`mouths/` filenames themselves, crossed
with identity style where relevant) — see `src/types/avatar.ts` for
`AvatarConfig` (identity) vs. `ExpressionSpec` (mood).

**Phase 2C simplified the Creator UI** to five short steps (Frame, Pose,
Skin Tone, Hairstyle, Hair Color) plus one standard outfit, to keep the
first production art pack small — see the main project README's "Avatar
system" section for the full explanation and the exact **starter pack**
file list (about 44 files) that the current app actually needs, versus the
larger, still-modeled-but-not-yet-exposed option set below.

Each id below is a value stored in a user's `AvatarConfig`
(`src/types/avatar.ts`) or in the active mood's `ExpressionSpec`
(`src/data/avatarExpressions.ts`). File naming, once real assets exist, is
`<folder>/<name>.svg` (or `.png`/`.webp` masks), matching what each
`avatarAssets.ts` getter already computes:

- `base/<frame>.svg` — one file per `FrameId` (`soft`, `bold`) — the
  overall body/silhouette illustration, tinted with skin color. This is
  the MVP's actual "frame" choice; give each one a genuinely distinct
  build rather than reusing one body at two widths (which is the
  placeholder vector renderer's shortcut — see `getBaseAsset`'s comment in
  avatarAssets.ts). Not currently split by `FaceShapeId` — that field
  still exists for a future advanced mode but isn't exposed today.
- `hair/<hairStyle>.svg` — one file per `HairStyleId`: `short-cut`,
  `buzz-cut`, `long-wavy`, `curly`, `coily`, `braids`, `locs` — the Phase
  2C starter range, spanning a meaningful set of textures/lengths. Tinted
  with hair color — never a separate file per hair color. (The current
  renderer additionally splits some styles into a back layer and a front
  layer so long styles can pass behind the head/body; production art
  should keep that split where it's useful.)
- `lower-body/<pose>.svg` — one file per `PoseId` (`standing`, `seated`) —
  legs and feet, driven by pose rather than any identity field. `standing`
  is straight legs + simple shoes; `seated` should be a genuine, respectful
  wheelchair presentation (a real seat, frame and wheels) — the current
  placeholder only hints at this with a seat rail and two wheel outlines,
  which is the single highest-value upgrade the first art pack can make.
  Fixed jeans + shoe colors baked in (not user-tintable — see
  `JEANS_COLOR`/`SHOE_COLOR` in avatarAssets.ts), since outfit color isn't
  a Creator choice in the MVP.
- `eyes/<eyeStyle>--<eyesExpression>.svg` — one file per `EyeStyleId`
  crossed with `EyeShapeKey` (the `eyes` field of the active
  `ExpressionSpec`). Only `round--*` (9 files) is needed for the current
  starter pack, since eye style isn't yet an exposed Creator choice; the
  other two `EyeStyleId` values are modeled for a future mode. Tinted with
  eye color.
- `eyebrows/<eyebrowStyle>--<eyebrowsExpression>.svg` — one file per
  `EyebrowStyleId` crossed with `EyebrowShapeKey`. Only `natural--*` (8
  files) is needed for the current starter pack, for the same reason as
  eyes above. Tinted with the contrast-adaptive ink color (derived from
  skin tone), not hair color, so brows stay legible on every skin tone.
- `mouths/<mouthExpression>.svg` — one file per `MouthShapeKey` (12 files
  — mouths have no separate identity "style"). Tinted with ink color.
- `facial-hair/<facialHair>.svg` — one file per `FacialHairId` except
  `none`. Not needed for the starter pack (every new MVP avatar's
  `facialHair` defaults to `none`); only relevant for an advanced mode or
  for full-parity art on avatars that chose one before Phase 2C. Tinted
  with hair color.
- `clothing/<clothingStyle>.svg` — one file per `ClothingStyleId`. Only
  `crew-neck` (the "MoodMeal shirt") is needed for the starter pack — it's
  the MVP's one standard outfit. Tinted with clothing color.
- `accessories/<accessoryId>.svg` — one file per `AccessoryId` (`glasses`,
  `earrings`, `headband`, `freckles`). Not needed for the starter pack
  (every new MVP avatar's `accessories` defaults to `[]`); only relevant
  for an advanced mode or full-parity art on pre-2C avatars. Glasses/
  earrings/headband render in a fixed palette; freckles tint with ink
  color.
- `effects/<effect>.svg` — `blush`, `tears`, `sweatDrop`: fixed-palette
  overlays applied per `ExpressionSpec`'s optional flags, never tinted from
  any identity field.

Identity layers (`base/`, `hair/`, `lower-body/`, `clothing/`,
`accessories/`, `facial-hair/`) never change when mood changes. `eyes/` and
`eyebrows/` depend on BOTH identity (style) and mood (expression) — that's
why their filenames are a `style--expression` pair rather than either
alone. `mouths/` and `effects/` depend on mood only. This split is enforced
by the type system (`AvatarConfig` vs. `ExpressionSpec` share no fields) as
well as by the folder layout here.

Color values for every tint (skin/hair/eye/clothing) come from
`src/data/avatarOptions.ts`'s swatch lists, resolved by
`avatarAssets.ts`'s `resolveSkinColor`/`resolveHairColor`/
`resolveEyeColor`/`resolveClothingColor`/`resolveInkColor` — never
hardcoded into an art file. Jeans/shoe colors are the two exceptions —
fixed, non-editable constants (`JEANS_COLOR`/`SHOE_COLOR`) rather than a
resolver, since the MVP doesn't let users choose them.

See the main project README's "Avatar system" section for the full
production art brief (style direction, canvas size, layer registration
requirements, and the starter-pack vs. full-option-set file counts) before
commissioning real illustrations.
