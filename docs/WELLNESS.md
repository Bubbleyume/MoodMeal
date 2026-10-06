# Wellness features

## Entry points

Use the Wellness tab or the Profile shortcut. New routes are /wellness,
/health, /tracking, /reminders, /self-care, /glossary and /glossary/:id.
Underlined nutrient terms on food, meal, result and recipe screens open
the corresponding glossary entry. The initial glossary contains 12 core terms.

## Health preferences

Conditions and notes are optional and local. Food/meal ranking is opt-in:
iron-deficiency anemia prioritizes iron-containing foods and vitamin C;
hypertension favors fiber-rich dietary-pattern components; depression/anxiety
favor quick meals. Relevant candidates can be included beyond the mood tags.
Dietary filters still apply. No quantified nutrient totals, interaction checks,
diagnosis, treatment claims, or supplement dosages are supplied. Unknown-cause
anemia does not trigger iron ranking. Kidney disease disables condition-based
ranking; displayed generic foods are explicitly not kidney-safety screened.
Diabetes and custom conditions are recorded but have no specific ranking rules.

## Reminders

Daily local-time schedules support create, edit, pause, resume and delete.
Add multiple reminders for multiple dose times. Due or earlier-today reminders
appear across routes and can be dismissed for today; dismissal is not a record
of taking a medicine. Next-day recurrence is independent of today's dismissal.
Sound must be enabled by the user for the current open session. Browser sleep,
tab suspension, muted audio and closing the app prevent reliable alarms.

Calendar export creates an RFC 5545 daily event and display alarm with local
floating time, escaped text and UTF-8 content-line folding. Import into a calendar
and verify its alarms for closed-app use. Existing exported events are not
updated when schedules change here. Calendar providers may sync imported data.

## Tracking and privacy

Weight (kg or lb), blood pressure (mmHg) and pulse (bpm) support dated records,
notes, deletion confirmation, chronological trends, and CSV export of all values.
Weight units are displayed separately to prevent mixed-unit comparisons.
The BP graph shows systolic; first/latest values and change show both readings.
Graphs use timestamps and the most recent 30 points; history keeps all records.
Changes are not labeled as improvements or interpreted diagnostically.

New localStorage keys: moodmeal:health, moodmeal:measurements, moodmeal:reminders.
Existing keys remain unchanged. Clear Local Data removes all new keys too.
These records are not encrypted and are not backed up by Git or an account.
Saving reports browser storage failures rather than claiming success.

## Sources

Content links to NIH/MedlinePlus resources, including:
- https://ods.od.nih.gov/factsheets/Iron-Consumer/
- https://ods.od.nih.gov/factsheets/VitaminC-Consumer/
- https://ods.od.nih.gov/factsheets/Potassium-Consumer/
- https://medlineplus.gov/carbohydrates.html
- https://medlineplus.gov/antioxidants.html
- https://www.nhlbi.nih.gov/health/dash-eating-plan
- https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health
- https://www.nccih.nih.gov/health/yoga-effectiveness-and-safety
- https://www.nccih.nih.gov/health/meditation-and-mindfulness-effectiveness-and-safety

## Validation

Typecheck passes. The regular build script hits Node spawn EPERM in this
environment; production esbuild CLI + Tailwind + public asset/index steps pass.
tests/wellness.test.ts covers normalization, dietary filters, opt-out, condition
ranking, renal guard, invalid dates/measurements, reminder due times, recurring
dates, calendar escaping/folding, glossary aliases, and clearing storage.
Bundle this test with the installed esbuild CLI (platform=node, format=cjs)
to a temporary location and run that file with Node.

Browser checks: mobile and desktop navigation/layout; glossary deep link;
health-profile save/reload and affected food order; dated weight trend and BP
save; reminder due alert, dismissal/reload, pause, edit/reload and sound activation;
self-care relevance; CSV and calendar files downloaded and inspected.
Calendar import/delivery in an external calendar and actual speaker output
are not verified. No console warnings/errors observed during checked flows.
