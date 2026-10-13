# MoodMeal knowledge library

Implementation and verification: 2026-10-13.

## What changed

Mood check-ins now map to seven support goals and published qualitative nutrient facts. Food and meal explanations use the same nutrient matches as ranking. Nutrient chips open brief definitions and link to the glossary; source drawers show provenance and review limits. Runtime matching is local and deterministic: no AI service, internet search or uploaded health data is involved.

Preferences include diet, allergies, intolerances, dislikes, cuisines, cooking skill, budget, time and snack/full-meal/quick choices. Recipe cards and details share canonical ingredients, quantities, times and allergen tags. Grocery additions combine compatible quantities; different units or preparation notes stay separate. Allergy filtering uses declared ingredients and does not verify product labels or cross-contact.

History observations use real check-ins and linked food/meal interactions. They describe recorded patterns without claiming food caused mood changes. Wellness starts with ten educational topics and the glossary; existing health notes, reminders, trends and self-care remain accessible. Condition-based nutrition ranking is paused; existing health records are preserved.

59 AI-generated food and meal illustrations replace food emoji artwork. The app uses optimized WebP assets. These are illustrations, not photographs or portion measurements. Avatar labels are Soft Frame and Bold Frame; stored IDs and appearance choices are unchanged.

## Sources and review limits

Built-in brief explanations cite NIH ODS, MedlinePlus and other authoritative sources. Provenance explicitly identifies the source check as AI-assisted, not independent clinical review. Qualitative ingredient facts do not establish a recipe's precise nutrient amount, bioavailability or treatment effect. All current recipe nutrient totals are null and presented as not calculated. Recipes have editorial checks, including cooking temperatures, but have not been kitchen tested. Budget and cuisine tags are editorial estimates.

The local Library workspace imports PDF, EPUB, TXT, MD and MoodMeal JSON exports. PDF text extraction supports up to 600 pages; scanned pages require OCR elsewhere. EPUB imports read text sections. Files stay in this browser; source prose is held temporarily for candidate extraction and is not automatically copied into public articles. Candidates include source locations and unverified term associations, not automatically validated facts.

Draft -> Needs Review -> Reviewed -> Published is enforced. Publication requires original or licensed wording, source details, evidence status, reviewer and review notes. Medical-treatment and supplement-dose wording blocks publication. Automated keyword checks are aids, not a substitute for qualified review. Editing a reviewed/published entry returns it to review. Imported JSON decisions reset to Draft and unverified; original copy and source metadata remain.

Only approved educational entries and nutrient definitions publish into this browser's Wellness library. Imported food facts, recipes and support-goal associations can be reviewed as research but need explicit catalog integration before affecting recommendations. This is a local editorial workspace, not a shared authenticated administrator portal. The previously supplied books have not been silently copied or published.

## Storage and migration

Existing profile, avatar, grocery, reminder, health and mood storage is retained. Preferences initialize from the legacy dietary choice and save it for compatibility. New preferences, interaction history and review records use additional local-storage keys. Demo IDs matching seed-N are excluded from displayed history and observations; stored entries are not erased. No database migration or account setup is required.

Storage belongs to the current browser and origin. localhost, a LAN address and a different port have separate records; phone and desktop data do not sync. Clearing site data removes records. Library JSON export backs up editorial records, not all personal app data. Imported review status is deliberately reset. General existing storage behavior remains browser-based; Library and preference saves report storage failures.

## Files changed for this phase

- Model and source data: src/types/library.ts, src/types/index.ts, src/data/knowledge.ts, education.ts, foods.ts, meals.ts, recipes.ts, glossary.ts and assets.ts.
- Matching and persistence: src/lib/catalog.ts, preferences.ts, recommendations.ts, grocery.ts, interactions.ts, libraryReview.ts, resourceImport.ts and storage.ts; preference, grocery, mood and local-storage hooks.
- Interface: Knowledge.tsx, FoodImage.tsx, food/meal/grocery cards, HealthContext.tsx; PreferencesPage, LibraryPage, EducationPage, WellnessPage, RecipeDetailPage, result/history/profile/health/onboarding/browse pages and App.tsx routes.
- Avatar display labels: avatar preset/modular definitions and AvatarCreator; previous avatar assets and other existing local work preserved.
- Artwork: public/assets/foods and public/assets/meals. Prompt/tool/source manifests: food-artwork-manifest.json and food-artwork-revisions.json in this directory. Generation tool: built-in image generation. Original final PNGs are archived outside the public app at C:/Users/Shakh/Documents/Codex/2026-10-05/referenced-chatgpt-conversation-this-is-an/outputs/food-library-artwork.
- Tooling: package files, .gitignore, build/dev scripts (local PDF worker), scripts/test-knowledge.mjs, tests/knowledge.test.ts, tests/knowledge.browser.cjs and original test fixtures.

This checkout also contains earlier uncommitted avatar and wellness work. The list above describes this phase; git status includes that earlier work too.

## Verification

Passed: TypeScript, production build, 15 knowledge tests, avatar regression suite (312 asset paths), and browser integration. Browser checks cover mood recommendations, nutrient disclosure, preferences and reload, repeated recipe-to-grocery aggregation, real history, review/publishing, and PDF/EPUB imports. Ten routes were checked at 320, 390 and 1440 pixels with no horizontal overflow or browser console/page errors. These are Edge browser viewport checks, not a physical-phone test. Test contexts were isolated from the user's browser data.

Commands: npm run typecheck; npm run build; npm run test:knowledge; npm run test:avatars; npm run test:browser. Browser tests need the preview running; MOODMEAL_URL defaults to http://127.0.0.1:4175 and BROWSER_CHANNEL defaults to msedge.

Production dependency audit reported zero vulnerabilities. Existing development-tool dependencies still have audit findings; no breaking automatic upgrades were applied. The build also reports an outdated Browserslist database.

## Branch status

Work remains uncommitted on avatar-redesign-phase-2, HEAD 7edaaf7. No merge or push was performed in this phase. master remains 7d49790.
