# Usability review — 2026-10-15

Branch `knowledge-system-foundation`, starting at 64646f4 (equal to origin). The review used the production build (`npm run build`, served on port 4175) with headless Microsoft Edge (Playwright), plus the dev server on port 5173.

**Not tested on a physical device.** All mobile results come from emulation in desktop Chromium:
- emulated sizes: 360, 390 and 430 px phones and a 768 px tablet;
- touch and mobile mode enabled, at 3× pixel density.

Real-device checks remain open: iOS Safari and Android Chrome, safe-area insets, the on-screen keyboard, screen readers, and real network speeds.

## 1. Screens tested

Every route was tested at six sizes: 1440 × 900 desktop, 1024 × 768 tablet, 768 × 1024 tablet, and 430, 390 and 360 px phones.

- **Check-in flow:** Welcome, Onboarding, Mood Selection with the intensity sheet, Analyzing, Mood Result
- **Food:** Foods, Meals, Recipe Detail (Chamomile Toast, and Rainbow Fruit Skewers with its nutrition panel), Grocery
- **Your records:** Mood History, Profile, Avatar editor, Food preferences
- **Wellness and tools:** Wellness, Glossary and glossary term, Self-care, Health, Tracking, Reminders, Library

## 2. Desktop results (1440 and 1024)

The app renders as a centred phone-width frame. No console errors, failed requests, horizontal overflow, broken or distorted images, or missing alt text were found.

## 3. Mobile and tablet results (emulated)

- No horizontal scrolling on any route at 360–768 px.
- Images: 297 per size were checked, with none broken or distorted. Ingredient thumbnails stay 160 px WebP.
- Avatar layers render about 2× upscaled at 3× density. They look acceptable but could be sharper.
- Each route settles in under 1 s locally; this includes the audit's fixed 0.3 s wait.
- Recipe instructions and the nutrition panel read cleanly at 320–1440 px.

## 4. Accessibility findings

The fixed issues are listed in section 5. Remaining:

- **Medium:**
  - Several controls are 32–40 px rather than 44 px: header back buttons (36 px), nutrient chips (36 px), recipe "Add" buttons (36 px) and some Wellness tool buttons. They meet WCAG 2.5.8 (24 px) but not the 44 px platform guideline.
  - The mood intensity sheet is non-modal: the mood grid behind it stays tabbable.
- **Low:**
  - Food-preference and health checkboxes are 13 px, but their whole 44 px label row is clickable.
  - Avatar layers are upscaled on high-density screens.
  - Mood History stat and entry rows still use emotion emoji; the rest of the app uses the avatar faces.
  - The "Personal tools" summary is 24 px tall.

## 5. Bugs found and fixed

| Severity | Issue | Fix |
|---|---|---|
| High | A saved check-in with an unknown mood or an out-of-range intensity crashed Result, Foods and Meals to a blank screen. | `useDraftMood` treats an invalid saved check-in as no check-in, so those screens redirect to /mood. The stored value is not rewritten. |
| High | A profile saved in an unexpected shape (for example `[]`, or an older version missing fields) crashed Profile. | `readStorage` rejects an array where an object is expected, and `useProfile` fills missing fields from defaults when reading. Nothing is rewritten. |
| Medium | Keyboard: opening the intensity sheet left focus on the grid, and Escape did nothing. | Focus now moves to the slider. Escape closes the sheet and returns focus to the mood card. |
| Medium | Bottom navigation had no `aria-current`. The badge was read as "Grocery7". History and Wellness used the same icon. Inactive labels had 2.6:1 contrast. | Added `aria-current="page"`, screen-reader badge text ("7 items to get") and a Leaf icon for Wellness. Labels are now slate-500 and green-700. Learn, Preferences and Library highlight their parent tabs. |
| Medium | Grocery inputs had placeholder text only, with no label. | Added `aria-label`s: "Item name" and "Quantity (optional)". |
| Medium | The Profile notification switch had no accessible name. | Labelled it "Daily mood check-in reminder". |
| Medium | Secondary text (`text-slate-400`, 2.56:1) failed WCAG AA contrast across 11 files. | Changed to `text-slate-500` (about 4.8:1). The grocery badge is now red-600; the meal-ideas caption is slate-600. Measured low-contrast text went from 762 instances to 0. |
| Medium | Touch targets were 24–36 px: grocery done/remove, history delete, intensity-sheet close and grocery add. | All are now 44 px. Grocery and history buttons are named after their item. |
| Low | Result had no h1, and a glossary term page had two. | The mood name is the Result h1; the glossary term is now an h2. |
| Low | "Sources & review notes" and similar summaries were 16–20 px tall. | Raised to at least 24 px. |
| Low | Profile's About text said nutrition totals are "not yet calculated", but Rainbow Fruit Skewers shows an estimate. | The copy now says estimates appear only on fully reviewed recipes. |
| Low | History showed "1 entries". | Now singular/plural. |

## 6. Verified working (no change needed)

- **Check-ins:** all 12 moods at intensity 3 and 9 (24 check-ins). Each stored check-in, goal heading and food list matched `goalsForMood` / `getRecommendations`, and the Meals page matched as well.
- **Explanations:** nutrient chips open their explanations; the sources disclosure shows provenance.
- **Preferences:** vegan plus a tree-nut allergy is saved and synced to the profile. The meals shown match `browseItems`; no displayed meal lists tree nuts, milk, egg or fish; foods exclude animal products and tree nuts.
- **Grocery:**
  - Recipe-to-grocery combines compatible amounts (brown rice ¾ + ¾ = 1.5 cup cooked; baby spinach 1 + 1 = 2 cup).
  - Manual add, done, clear completed and remove all work, with state kept after reload.
  - The badge count matches the list.
- **Mood History:** observations are shown, avoid causal wording, and deleting an entry works.
- **Persistence after reload:** display name, avatar, the Result page and the grocery list.
- **Missing data:**
  - Unknown recipe → /meals; unknown learn page → /wellness; unknown glossary term → "Term not found"; unknown route → /.
  - /result and /analyzing without a check-in → /mood.
- **Corrupt storage:** every key was set to unreadable values on 10 screens. Only the two High issues above failed, and both are fixed.
- **Keyboard:** a full check-in can be completed with the keyboard, and every tabbable control on Result, Grocery, Profile and Meals shows a visible focus indicator.

## 7. Remaining issues (not changed)

- **Medium:** Several 36 px controls and the non-modal intensity sheet (section 4).
- **Low:** Grocery items saved under the old "Whole-grain bread" name show the leaf fallback image.
- **Low:** The emoji/avatar inconsistency in Mood History.
- **Low:** The Profile notification switch is still a placeholder.

## 8. Test results

- TypeScript: pass.
- 29 knowledge tests: pass.
- Avatar tests: pass.
- 14 USDA tests: pass.
- 22 FatSecret tests: pass.
- Production build: pass (only the outdated Browserslist warning).
- `npm run test:browser`: pass, with no browser errors. It now includes regressions for sheet focus/Escape, `aria-current` and corrupt saved data.
- Review-only scripts (not committed):
  - functional flows: 138/138 pass;
  - six-size audit: 0 console errors, 0 overflow, 0 broken images, 0 unlabeled controls, 0 low-contrast text.

## 9. Release-readiness recommendation

Ready for continued internal testing on the current branch. Before any public release:
1. Test on at least one real iPhone (Safari) and one Android phone (Chrome), including VoiceOver/TalkBack and the on-screen keyboard over the grocery form and the mood sheet.
2. Grocery unit conversion and Mood History undo are done (see the follow-up below).
3. Raise the remaining 36 px controls to 44 px.
4. Keep the wellness and medical disclaimers and the USDA review gates as they are.

## Follow-up (user-approved, 2026-10-15)

**Undo for Mood History deletes.** Deleting an entry shows a snackbar ("Tired entry deleted." / Undo) above the bottom nav.
- Undo puts back the identical entry at its original stored position, and focus returns to that row's delete button.
- The snackbar is a `role="status"` live region and closes after 8 s; focus or hover pauses the countdown, and Escape dismisses it.
- After a keyboard delete, focus moves to Undo. After a pointer or touch delete, focus doesn't move, so the timer runs normally.
- Only the most recent deletion is undoable. It is held in memory only: the delete is saved immediately, and Undo re-adds the entry.

**Grocery unit conversion.** tsp, tbsp and cup of the same ingredient with the same notes now combine into one row.
- A row in the same unit is still preferred, so 2 tbsp + 2 tbsp stays "4 tbsp".
- Converted totals use the largest tidy unit: cups in 1/8 steps from 1/4 cup, then tablespoons in 1/2 steps, otherwise teaspoons. For example, 1 tbsp + 1 tsp = 4 tsp and 2 tbsp + 6 tsp = 0.25 cup.
- Weights, counts, different notes and completed rows are never converted.
- Existing saved lists are not rewritten; conversion applies only when items are added.

Tests: one new knowledge test and new browser checks (keyboard and pointer undo, auto-dismiss, soy sauce "4 tsp").

## Polish follow-up (2026-10-15)

- **Undo:** the window is 10 s. Every deletion gets its own Undo notice, so several deletions can each be recovered. Hover or focus pauses the countdown, and Escape dismisses the notices.
- **Layout:** notices now take layout space above the bottom nav, so they can't cover the last entry.
- **Wording:** one entry reads "Your tired mood intensity was 6/10."
- **Grocery fractions:** quantities show common fractions, such as ⅞ cup, while stored values keep full precision.
- **Units:** one explicit volume standard, US customary (1 cup = 16 tbsp = 48 tsp), defined in `src/lib/units.ts`.

These were tested by automated browser emulation (360 and 390 px, desktop) only, not on a physical device.
