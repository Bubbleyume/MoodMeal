# Modular avatar customization

Onboarding and Profile share the accessible avatar chooser. Girl and Boy each have seven hairstyles and independently remembered hairstyle, hair color and eye color choices. Skin tone remains a shared choice. Expression preview does not change mood history.

- Girl: long waves, short wavy, straight with bangs, curly-updo ponytail, long braids, short, straight.
- Boy: tousled, short curls, buzz cut, side part, short twists, long wavy, braids.
- Hair: original artwork, black, brown, blonde, auburn, silver, purple.
- Eyes: brown, blue, green, hazel, gray.

## Storage and compatibility

The `moodmeal:avatar` key and existing `baseStyle`, `skinTone`, `hairStyle` fields remain. `artworkVersion: "modular-v1"` opts into modular artwork. Optional `appearances.feminine` and `appearances.masculine` hold each character's `hairStyle`, `hairColor` and `eyeColor`. The top-level hairstyle mirrors the active character for compatibility. Switching characters saves the current appearance and restores the other character's appearance. Existing modular configurations initialize only their active hairstyle; the other character starts with its own default. Invalid styles and colors normalize safely.

Unversioned avatars retain their original preset artwork, including Androgynous. Opening the editor does not convert them. Users may keep their previous avatar before saving. New users start with Girl/Medium/Long waves. No health, reminder, mood or meal storage changes.

## Artwork and rendering

`public/assets/avatars/layers-v1` contains transparent, lossless 512x768 WebP layers. Runtime order is tone-matched scalp underlay, back hair, base, expression, irises, front hair. Color filters apply only to hair and isolated brown iris pixels; scalp, skin, clothes, logos, eye whites and pupils keep their original artwork. Scalp partings are masked separately and matched to all six skin tones, so gaps reveal skin rather than the page background. Closed eyes naturally do not show an iris color.

The girls' first two default styles now use brown artwork. Original color remains an explicit option, and previously chosen color presets stay selected. Girls' saved `short-curly` IDs intentionally remain compatible and now display the revised artwork labeled Short wavy; the boys' Short curls are unchanged. Existing `straight` means Straight with bangs, while new `long-straight` is the separate Straight option. Each character has its own braid and wave artwork even where selection IDs are shared.

The 312 precomposed images in `modular-v1` remain available for compatibility and reference. Additional and revised hairstyles were generated against the approved faceless bases, masked into separate layers, aligned, and composited with the untouched base and expression artwork. Generation records and editable PNGs are in the workspace's `outputs/avatar-customization-v1` package.

All layers preload before display. A missing expression falls back to neutral with the same character, tone, hair and colors. If those layers also fail, a generic placeholder appears; partial faces are never displayed. Changing the avatar resets loading. Failed requests are evicted from the shared preload cache.

## Validation

Run `npm run typecheck`, `npm run test:avatars` and `npm run build`. Tests cover legacy retention, invalid storage, separate character choices/colors, JSON round trips, all precomposed/layer paths, and untinted body/expression layers.

Browser checks in Edge cover onboarding, Profile, saving/reloading, all fourteen hairstyles and color presets, mood/result rendering, keyboard selection, legacy retention and missing-expression fallback. Layouts checked at 320, 390 and 1440 pixels; normal flows have no console errors. Mobile checks use emulation, not a physical phone.


## October reference revision
Eight generated revisions/additions match BOYS HAIR REVISION.png and GIRLS HAIR REVISION.png, including brown long waves. Editable PNGs, exact generation prompts, six-tone scalp review sheets and production scripts are saved in the workspace under `outputs/avatar-hair-revisions-v2`. Revised filenames carry `-r2` to prevent old artwork being mistaken for the new files. No storage reset or manual migration is required.
