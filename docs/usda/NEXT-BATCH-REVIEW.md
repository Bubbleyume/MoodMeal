# Next ingredient batch — API review completed, approval pending

Checkpoint: ae01366. Fifteen ingredient labels (14 food types: Egg/Eggs share candidate records). Selected by frequency, with rolled oats, Greek yogurt and whole-grain bread explicitly included. All 61 remaining labels retain their earlier review status. No new nutrition approved or published.

**API retrieval completed:** 21 exact candidate IDs fetched locally on 2026-10-14 and compared offline against retained CSV evidence. Fifteen comparisons have zero material differences; six have review issues described below. The initial table documents CSV-based conversion proposals, not approval. API findings below supersede earlier source-availability notes. All existing approvals remain unchanged.

| Ingredient / uses | Recipe usage and quantities | Candidate ID and exact description | Preparation | Conversion / unresolved questions | Confidence and proposed status |
|---|---|---|---|---|---|
| Honey (5) | Warm Oatmeal with Berries — 1 tsp; Calming Kefir Smoothie — 1 tsp; Green Tea Energy Bites — 1/4 cup; Immune-Support Smoothie — 1 tsp; Berry Yogurt Parfait — 1 tsp | 169640: Honey | Ready-to-use | 1 tsp = 7 g derived from native 21 g/tbsp; 1/4 cup = 84.75 g from native 339 g/cup. Preserve native measures rather than forcing density consistency. | high source identity; recipe quantities directly convertible; API matched; ready for user approval |
| Banana (4) | Chamomile & Sweet Potato Toast — 1/2, sliced; Calming Kefir Smoothie — 1/2; Tropical Energy Smoothie — 1/2; Sunshine Banana Pancakes — 1, mashed | 173944: Bananas, raw | Raw peeled input | Size unspecified. Medium reference = 118 g, half = 59 g if adopted. Pancakes cook the raw input; smoothies use it raw. | source records verified; recipe identity/portion conditional; hold pending stated decisions and source issues below |
| Almonds (3) | Turkey Lettuce Wraps — 1 tbsp, chopped; Loaded Popcorn Trail Mix — 2 tbsp; Dark Chocolate Trail Mix — 1/4 cup | 170567: Nuts, almonds | Raw kernels assumed | Confirm raw/roasted and salted state. Whole, sliced, slivered and ground cup weights differ; chopped tbsp is not an exact listed portion. 1/4 cup whole would be 35.75 g only if whole is intended. | source records verified; recipe identity/portion conditional; hold pending stated decisions and source issues below |
| Brown rice (3) | Energizing Power Bowl — 3/4 cup cooked; Iron-Rich Beef Stir-Fry — 3/4 cup cooked; Brown Rice Veggie Bowl — 3/4 cup cooked | 169704: Rice, brown, long-grain, cooked (Includes foods for USDA's Food Distribution Program); 168875: Rice, brown, medium-grain, cooked (Includes foods for USDA's Food Distribution Program) | Cooked | Recipe explicitly measures cooked rice. Long-grain 3/4 cup = 151.5 g; medium-grain = 146.25 g. Choose grain type; never use a dry-rice record with cooked cups. | source records verified; recipe identity/portion conditional; hold pending stated decisions and source issues below |
| Egg (3) | Energizing Power Bowl — 1; Cozy Sweet Potato Hash — 2; Gentle Avocado Toast — 1 | 171287: Egg, whole, raw, fresh; 173424: Egg, whole, cooked, hard-boiled | Raw input; hard-boiled for toast | Choose size; large raw egg = 50 g edible without shell. Pancake/hash use raw ingredient weights before cooking; toast uses hard-boiled record (large 50 g). Power bowl cooking method remains unspecified. | source records verified; recipe identity/portion conditional; hold pending stated decisions and source issues below |
| Pineapple (3) | Tropical Energy Smoothie — 1 cup; Quinoa Fruit Salad — 1/2 cup, diced; Rainbow Fruit Skewers — 1 cup, raw chunks (165 g USDA reference weight) | 169124: Pineapple, raw, all varieties | Raw edible flesh | 1 cup chunks = 165 g, half = 82.5 g. Confirm diced/cubed treated as chunks; packing can differ. Exclude core/skin; do not substitute canned syrup fruit. | source records verified; recipe identity/portion conditional; hold pending stated decisions and source issues below |
| Pumpkin seeds (3) | Brown Rice Veggie Bowl — 2 tbsp; Crunchy Veggie Snack Plate — 1 tbsp; Magnesium-Rich Grounding Bowl — 2 tbsp | 170556: Seeds, pumpkin and squash seed kernels, dried | Dried shelled kernels assumed | Confirm kernels, raw/dried vs roasted and salt. Conditional 1 tbsp = 8.0625 g and 2 tbsp = 16.125 g from 129 g/cup. No shells. | source records verified; recipe identity/portion conditional; hold pending stated decisions and source issues below |
| Sweet potato (3) | Energizing Power Bowl — 1/2, roasted; Chamomile & Sweet Potato Toast — 1, sliced lengthwise into 1/4-inch planks; Cozy Sweet Potato Hash — 1, diced | 168482: Sweet potato, raw, unprepared (Includes foods for USDA's Food Distribution Program); 168483: Sweet potato, cooked, baked in skin, flesh, without salt | Raw input in toast/hash; roasted wording in power bowl | Need size, skin treatment and point of measurement. Raw reference potato 130 g; cooked medium flesh 114 g. Half roasted is ambiguous because instructions start by roasting it. Do not apply cooked values to raw grams. | source records verified; recipe identity/portion conditional; hold pending stated decisions and source issues below |
| Swiss chard (3) | Steak & Swiss Chard — 2 cups, chopped; Brown Rice Veggie Bowl — 1 cup, sautéed; Magnesium-Rich Grounding Bowl — 2 cups, sautéed | 169991: Chard, swiss, raw; 170401: Chard, swiss, cooked, boiled, drained, without salt | Raw vs sauteed measurement unresolved | Steak recipe 2 cups chopped raw can use 72 g. Bowl recipes specify sauteed cups but then instruct sauteing. Boiled/drained 175 g/cup is not sauteed. Specify raw weighed inputs plus oil or a validated cooked sauteed record and weight. | source records verified; recipe identity/portion conditional; hold pending stated decisions and source issues below |
| Almond butter (2) | Chamomile & Sweet Potato Toast — 2 tbsp; Green Tea Energy Bites — 1/2 cup | 168588: Nuts, almond butter, plain, without salt added | Ready-to-eat | Confirm plain unsalted. 2 tbsp = 32 g; 1/2 cup = 125 g using separate native portions. Do not replace the cup with 8 tbsp: USDA measures are not exactly additive. | source records verified; recipe identity/portion conditional; hold pending stated decisions and source issues below |
| Avocado (2) | Salmon & Quinoa Bowl — 1/4, sliced; Gentle Avocado Toast — 1/2 | 171705: Avocados, raw, all commercial varieties | Raw edible flesh | Variety/size unspecified. USDA generic fruit = 201 g edible; 1/4 = 50.25 g and 1/2 = 100.5 g only if that reference fruit is adopted. | source records verified; recipe identity/portion conditional; hold pending stated decisions and source issues below |
| Greek yogurt (2) | Immune-Support Smoothie — 1/2 cup; Berry Yogurt Parfait — 1 cup | 2705423: Yogurt, Greek, low fat milk, plain; 2705422: Yogurt, Greek, whole milk, plain; 2705424: Yogurt, Greek, nonfat milk, plain | Plain assumed, ready-to-eat | Propose plain low-fat generic FNDDS 2705423 only after fat level approval. Its own cup = 245 g (290701), half = 122.5 g. It is a compiled nonfat-yogurt/butter-oil model, not a lab-tested low-fat product. Whole/nonfat alternatives have their own portions; do not mix records. | source records verified; recipe identity/portion conditional; hold pending stated decisions and source issues below |
| Rolled oats (2) | Warm Oatmeal with Berries — 1/2 cup; Green Tea Energy Bites — 1 cup | 2346396: Oats, whole grain, rolled, old fashioned; 173904: Cereals, oats, regular and quick, not fortified, dry | Dry rolled oats | Exact Foundation rolled record lacks portion; SR regular/quick dry oats has 81 g/cup, half 40.5 g. Choose coherent record/portion or weigh exact rolled oats; never use cooked oatmeal. | source records verified; recipe identity/portion conditional; hold pending stated decisions and source issues below |
| Eggs (1) | Sunshine Banana Pancakes — 2 | 171287: Egg, whole, raw, fresh; 173424: Egg, whole, cooked, hard-boiled | Raw input; hard-boiled for toast | Choose size; large raw egg = 50 g edible without shell. Pancake/hash use raw ingredient weights before cooking; toast uses hard-boiled record (large 50 g). Power bowl cooking method remains unspecified. | source records verified; recipe identity/portion conditional; hold pending stated decisions and source issues below |
| Whole-grain bread (1) | Gentle Avocado Toast — 1 slice | 172688: Bread, whole-wheat, commercially prepared | As-purchased, then toasted | Whole-wheat is a candidate, not all whole-grain bread. Select loaf/product and slice mass; generic slice 32 g. Avoid toasted-per-100g values with untoasted slice weight. | source records verified; recipe identity/portion conditional; hold pending stated decisions and source issues below |

## Source portions and applicable nutrient evidence

Source records include nutrient IDs, units, derivations and amounts per 100 g. Missing rows/amounts are unknown, never zero. Energy alternatives must not be added together. Native portion IDs below support review; a portion of a different preparation or food must not be borrowed. FNDDS household amounts can be recorded in portion_description rather than numeric amount.

### FDC 168482: Sweet potato, raw, unprepared (Includes foods for USDA's Food Distribution Program)
Data type: sr_legacy_food; published: 2019-04-01; API retrieval: completed; exact retrieval timestamp and report listed below. [USDA record](https://fdc.nal.usda.gov/food-details/168482/nutrients).
- Portion 83166: amount=1.0; modifier=cup, cubes; description=none; grams=133.0; measure-unit ID=9999.
- Portion 83167: amount=1.0; modifier=sweetpotato, 5" long; description=none; grams=130.0; measure-unit ID=9999.
Selected nutrient IDs/amounts per 100 g: 1008: 86.0 KCAL; 2047: null; 2048: null; 1003: 1.57 G; 1004: 0.05 G; 1005: 20.12 G; 1079: 3.0 G; 1235: null.

### FDC 168483: Sweet potato, cooked, baked in skin, flesh, without salt
Data type: sr_legacy_food; published: 2019-04-01; API retrieval: completed; exact retrieval timestamp and report listed below. [USDA record](https://fdc.nal.usda.gov/food-details/168483/nutrients).
- Portion 83168: amount=1.0; modifier=cup; description=none; grams=200.0; measure-unit ID=9999.
- Portion 83169: amount=1.0; modifier=large; description=none; grams=180.0; measure-unit ID=9999.
- Portion 83170: amount=1.0; modifier=medium (2" dia, 5" long, raw); description=none; grams=114.0; measure-unit ID=9999.
- Portion 83171: amount=1.0; modifier=small; description=none; grams=60.0; measure-unit ID=9999.
Selected nutrient IDs/amounts per 100 g: 1008: 90.0 KCAL; 2047: null; 2048: null; 1003: 2.01 G; 1004: 0.15 G; 1005: 20.71 G; 1079: 3.3 G; 1235: null.

### FDC 168588: Nuts, almond butter, plain, without salt added
Data type: sr_legacy_food; published: 2019-04-01; API retrieval: completed; exact retrieval timestamp and report listed below. [USDA record](https://fdc.nal.usda.gov/food-details/168588/nutrients).
- Portion 83375: amount=1.0; modifier=tbsp; description=none; grams=16.0; measure-unit ID=9999.
- Portion 83376: amount=1.0; modifier=cup; description=none; grams=250.0; measure-unit ID=9999.
Selected nutrient IDs/amounts per 100 g: 1008: 614.0 KCAL; 2047: null; 2048: null; 1003: 20.96 G; 1004: 55.5 G; 1005: 18.82 G; 1079: 10.3 G; 1235: null.

### FDC 168875: Rice, brown, medium-grain, cooked (Includes foods for USDA's Food Distribution Program)
Data type: sr_legacy_food; published: 2019-04-01; API retrieval: completed; exact retrieval timestamp and report listed below. [USDA record](https://fdc.nal.usda.gov/food-details/168875/nutrients).
- Portion 83925: amount=1.0; modifier=cup; description=none; grams=195.0; measure-unit ID=9999.
Selected nutrient IDs/amounts per 100 g: 1008: 112.0 KCAL; 2047: null; 2048: null; 1003: 2.32 G; 1004: 0.83 G; 1005: 23.51 G; 1079: 1.8 G; 1235: null.

### FDC 169124: Pineapple, raw, all varieties
Data type: sr_legacy_food; published: 2019-04-01; API retrieval: completed; exact retrieval timestamp and report listed below. [USDA record](https://fdc.nal.usda.gov/food-details/169124/nutrients).
- Portion 84287: amount=1.0; modifier=cup, chunks; description=none; grams=165.0; measure-unit ID=9999.
- Portion 84288: amount=1.0; modifier=fruit; description=none; grams=905.0; measure-unit ID=9999.
- Portion 84289: amount=1.0; modifier=slice (4-2/3" dia x 3/4" thick); description=none; grams=166.0; measure-unit ID=9999.
- Portion 84290: amount=1.0; modifier=slice (3-1/2" dia x 3/4" thick); description=none; grams=84.0; measure-unit ID=9999.
- Portion 84291: amount=1.0; modifier=slice, thin (3-1/2" dia x 1/2" thick); description=none; grams=56.0; measure-unit ID=9999.
Selected nutrient IDs/amounts per 100 g: 1008: 50.0 KCAL; 2047: null; 2048: null; 1003: 0.54 G; 1004: 0.12 G; 1005: 13.12 G; 1079: 1.4 G; 1235: null.

### FDC 169640: Honey
Data type: sr_legacy_food; published: 2019-04-01; API retrieval: completed; exact retrieval timestamp and report listed below. [USDA record](https://fdc.nal.usda.gov/food-details/169640/nutrients).
- Portion 85264: amount=1.0; modifier=cup; description=none; grams=339.0; measure-unit ID=9999.
- Portion 85265: amount=1.0; modifier=tbsp; description=none; grams=21.0; measure-unit ID=9999.
- Portion 85266: amount=1.0; modifier=packet (0.5 oz); description=none; grams=14.0; measure-unit ID=9999.
Selected nutrient IDs/amounts per 100 g: 1008: 304.0 KCAL; 2047: null; 2048: null; 1003: 0.3 G; 1004: 0.0 G; 1005: 82.4 G; 1079: 0.2 G; 1235: null.

### FDC 169704: Rice, brown, long-grain, cooked (Includes foods for USDA's Food Distribution Program)
Data type: sr_legacy_food; published: 2019-04-01; API retrieval: completed; exact retrieval timestamp and report listed below. [USDA record](https://fdc.nal.usda.gov/food-details/169704/nutrients).
- Portion 85378: amount=1.0; modifier=cup; description=none; grams=202.0; measure-unit ID=9999.
Selected nutrient IDs/amounts per 100 g: 1008: 123.0 KCAL; 2047: null; 2048: null; 1003: 2.74 G; 1004: 0.97 G; 1005: 25.58 G; 1079: 1.6 G; 1235: null.

### FDC 169991: Chard, swiss, raw
Data type: sr_legacy_food; published: 2019-04-01; API retrieval: completed; exact retrieval timestamp and report listed below. [USDA record](https://fdc.nal.usda.gov/food-details/169991/nutrients).
- Portion 85834: amount=1.0; modifier=cup; description=none; grams=36.0; measure-unit ID=9999.
- Portion 85835: amount=1.0; modifier=leaf; description=none; grams=48.0; measure-unit ID=9999.
Selected nutrient IDs/amounts per 100 g: 1008: 19.0 KCAL; 2047: null; 2048: null; 1003: 1.8 G; 1004: 0.2 G; 1005: 3.74 G; 1079: 1.6 G; 1235: null.

### FDC 170401: Chard, swiss, cooked, boiled, drained, without salt
Data type: sr_legacy_food; published: 2019-04-01; API retrieval: completed; exact retrieval timestamp and report listed below. [USDA record](https://fdc.nal.usda.gov/food-details/170401/nutrients).
- Portion 86579: amount=1.0; modifier=cup, chopped; description=none; grams=175.0; measure-unit ID=9999.
Selected nutrient IDs/amounts per 100 g: 1008: 20.0 KCAL; 2047: null; 2048: null; 1003: 1.88 G; 1004: 0.08 G; 1005: 4.13 G; 1079: 2.1 G; 1235: null.

### FDC 170556: Seeds, pumpkin and squash seed kernels, dried
Data type: sr_legacy_food; published: 2019-04-01; API retrieval: completed; exact retrieval timestamp and report listed below. [USDA record](https://fdc.nal.usda.gov/food-details/170556/nutrients).
- Portion 86847: amount=1.0; modifier=cup; description=none; grams=129.0; measure-unit ID=9999.
- Portion 86848: amount=1.0; modifier=oz; description=none; grams=28.35; measure-unit ID=9999.
Selected nutrient IDs/amounts per 100 g: 1008: 559.0 KCAL; 2047: null; 2048: null; 1003: 30.23 G; 1004: 49.05 G; 1005: 10.71 G; 1079: 6.0 G; 1235: null.

### FDC 170567: Nuts, almonds
Data type: sr_legacy_food; published: 2019-04-01; API retrieval: completed; exact retrieval timestamp and report listed below. [USDA record](https://fdc.nal.usda.gov/food-details/170567/nutrients).
- Portion 86863: amount=1.0; modifier=cup, whole; description=none; grams=143.0; measure-unit ID=9999.
- Portion 86864: amount=1.0; modifier=cup, sliced; description=none; grams=92.0; measure-unit ID=9999.
- Portion 86865: amount=1.0; modifier=cup, slivered; description=none; grams=108.0; measure-unit ID=9999.
- Portion 86866: amount=1.0; modifier=cup, ground; description=none; grams=95.0; measure-unit ID=9999.
- Portion 86867: amount=1.0; modifier=oz (23 whole kernels); description=none; grams=28.35; measure-unit ID=9999.
- Portion 86868: amount=1.0; modifier=almond; description=none; grams=1.2; measure-unit ID=9999.
Selected nutrient IDs/amounts per 100 g: 1008: 579.0 KCAL; 2047: null; 2048: null; 1003: 21.15 G; 1004: 49.93 G; 1005: 21.55 G; 1079: 12.5 G; 1235: null.

### FDC 171287: Egg, whole, raw, fresh
Data type: sr_legacy_food; published: 2019-04-01; API retrieval: completed; exact retrieval timestamp and report listed below. [USDA record](https://fdc.nal.usda.gov/food-details/171287/nutrients).
- Portion 88374: amount=1.0; modifier=large; description=none; grams=50.0; measure-unit ID=9999.
- Portion 88375: amount=1.0; modifier=extra large; description=none; grams=56.0; measure-unit ID=9999.
- Portion 88376: amount=1.0; modifier=jumbo; description=none; grams=63.0; measure-unit ID=9999.
- Portion 88377: amount=1.0; modifier=cup (4.86 large eggs); description=none; grams=243.0; measure-unit ID=9999.
- Portion 88378: amount=1.0; modifier=medium; description=none; grams=44.0; measure-unit ID=9999.
- Portion 88379: amount=1.0; modifier=small; description=none; grams=38.0; measure-unit ID=9999.
Selected nutrient IDs/amounts per 100 g: 1008: 143.0 KCAL; 2047: null; 2048: null; 1003: 12.56 G; 1004: 9.51 G; 1005: 0.72 G; 1079: 0.0 G; 1235: null.

### FDC 171705: Avocados, raw, all commercial varieties
Data type: sr_legacy_food; published: 2019-04-01; API retrieval: completed; exact retrieval timestamp and report listed below. [USDA record](https://fdc.nal.usda.gov/food-details/171705/nutrients).
- Portion 89223: amount=1.0; modifier=cup, cubes; description=none; grams=150.0; measure-unit ID=9999.
- Portion 89224: amount=1.0; modifier=cup, pureed; description=none; grams=230.0; measure-unit ID=9999.
- Portion 89225: amount=1.0; modifier=cup, sliced; description=none; grams=146.0; measure-unit ID=9999.
- Portion 89226: amount=1.0; modifier=avocado, NS as to Florida or California; description=none; grams=201.0; measure-unit ID=9999.
- Portion 89227: amount=1.0; modifier=NLEA Serving; description=none; grams=50.0; measure-unit ID=9999.
Selected nutrient IDs/amounts per 100 g: 1008: 160.0 KCAL; 2047: null; 2048: null; 1003: 2.0 G; 1004: 14.66 G; 1005: 8.53 G; 1079: 6.7 G; 1235: null.

### FDC 172688: Bread, whole-wheat, commercially prepared
Data type: sr_legacy_food; published: 2019-04-01; API retrieval: completed; exact retrieval timestamp and report listed below. [USDA record](https://fdc.nal.usda.gov/food-details/172688/nutrients).
- Portion 91108: amount=1.0; modifier=slice; description=none; grams=32.0; measure-unit ID=9999.
- Portion 91109: amount=1.0; modifier=oz; description=none; grams=28.35; measure-unit ID=9999.
Selected nutrient IDs/amounts per 100 g: 1008: 252.0 KCAL; 2047: null; 2048: null; 1003: 12.45 G; 1004: 3.5 G; 1005: 42.71 G; 1079: 6.0 G; 1235: null.

### FDC 173424: Egg, whole, cooked, hard-boiled
Data type: sr_legacy_food; published: 2019-04-01; API retrieval: completed; exact retrieval timestamp and report listed below. [USDA record](https://fdc.nal.usda.gov/food-details/173424/nutrients).
- Portion 92498: amount=1.0; modifier=cup, chopped; description=none; grams=136.0; measure-unit ID=9999.
- Portion 92499: amount=1.0; modifier=tbsp; description=none; grams=8.5; measure-unit ID=9999.
- Portion 92500: amount=1.0; modifier=large; description=none; grams=50.0; measure-unit ID=9999.
Selected nutrient IDs/amounts per 100 g: 1008: 155.0 KCAL; 2047: null; 2048: null; 1003: 12.58 G; 1004: 10.61 G; 1005: 1.12 G; 1079: 0.0 G; 1235: null.

### FDC 173904: Cereals, oats, regular and quick, not fortified, dry
Data type: sr_legacy_food; published: 2019-04-01; API retrieval: completed; exact retrieval timestamp and report listed below. [USDA record](https://fdc.nal.usda.gov/food-details/173904/nutrients).
- Portion 93454: amount=1.0; modifier=cup; description=none; grams=81.0; measure-unit ID=9999.
- Portion 93455: amount=0.33; modifier=cup; description=none; grams=27.0; measure-unit ID=9999.
Selected nutrient IDs/amounts per 100 g: 1008: 379.0 KCAL; 2047: null; 2048: null; 1003: 13.15 G; 1004: 6.52 G; 1005: 67.7 G; 1079: 10.1 G; 1235: null.

### FDC 173944: Bananas, raw
Data type: sr_legacy_food; published: 2019-04-01; API retrieval: completed; exact retrieval timestamp and report listed below. [USDA record](https://fdc.nal.usda.gov/food-details/173944/nutrients).
- Portion 93511: amount=1.0; modifier=cup, mashed; description=none; grams=225.0; measure-unit ID=9999.
- Portion 93512: amount=1.0; modifier=cup, sliced; description=none; grams=150.0; measure-unit ID=9999.
- Portion 93513: amount=1.0; modifier=extra small (less than 6" long); description=none; grams=81.0; measure-unit ID=9999.
- Portion 93514: amount=1.0; modifier=small (6" to 6-7/8" long); description=none; grams=101.0; measure-unit ID=9999.
- Portion 93515: amount=1.0; modifier=medium (7" to 7-7/8" long); description=none; grams=118.0; measure-unit ID=9999.
- Portion 93516: amount=1.0; modifier=large (8" to 8-7/8" long); description=none; grams=136.0; measure-unit ID=9999.
- Portion 93517: amount=1.0; modifier=extra large (9" or longer); description=none; grams=152.0; measure-unit ID=9999.
- Portion 93518: amount=1.0; modifier=NLEA serving; description=none; grams=126.0; measure-unit ID=9999.
Selected nutrient IDs/amounts per 100 g: 1008: 89.0 KCAL; 2047: null; 2048: null; 1003: 1.09 G; 1004: 0.33 G; 1005: 22.84 G; 1079: 2.6 G; 1235: null.

### FDC 2346396: Oats, whole grain, rolled, old fashioned
Data type: foundation_food; published: 2022-10-28; API retrieval: completed; exact retrieval timestamp and report listed below. [USDA record](https://fdc.nal.usda.gov/food-details/2346396/nutrients).
- No native portion weights: conversion remains unresolved.
Selected nutrient IDs/amounts per 100 g: 1008: null; 2047: 381.626 KCAL; 2048: 378.866123 KCAL; 1003: 13.49645 G; 1004: 5.89 G; 1005: 68.65755 G; 1079: null; 1235: null.

### FDC 2705422: Yogurt, Greek, whole milk, plain
Data type: survey_fndds_food; published: 2024-10-31; API retrieval: completed; exact retrieval timestamp and report listed below. [USDA record](https://fdc.nal.usda.gov/food-details/2705422/nutrients).
- Portion 290693: amount=null; modifier=64562; description=1 5.3 oz container; grams=150.0; measure-unit ID=9999.
- Portion 290694: amount=null; modifier=60039; description=1 6 oz container; grams=170.0; measure-unit ID=9999.
- Portion 290695: amount=null; modifier=60598; description=1 container, NFS; grams=150.0; measure-unit ID=9999.
- Portion 290696: amount=null; modifier=10205; description=1 cup; grams=245.0; measure-unit ID=9999.
- Portion 290697: amount=null; modifier=90000; description=Quantity not specified; grams=150.0; measure-unit ID=9999.
Selected nutrient IDs/amounts per 100 g: 1008: 94 KCAL; 2047: null; 2048: null; 1003: 8.78 G; 1004: 4.39 G; 1005: 4.75 G; 1079: 0 G; 1235: null.

### FDC 2705423: Yogurt, Greek, low fat milk, plain
Data type: survey_fndds_food; published: 2024-10-31; API retrieval: completed; exact retrieval timestamp and report listed below. [USDA record](https://fdc.nal.usda.gov/food-details/2705423/nutrients).
- Portion 290698: amount=null; modifier=64562; description=1 5.3 oz container; grams=150.0; measure-unit ID=9999.
- Portion 290699: amount=null; modifier=60039; description=1 6 oz container; grams=170.0; measure-unit ID=9999.
- Portion 290700: amount=null; modifier=60598; description=1 container, NFS; grams=150.0; measure-unit ID=9999.
- Portion 290701: amount=null; modifier=10205; description=1 cup; grams=245.0; measure-unit ID=9999.
- Portion 290702: amount=null; modifier=90000; description=Quantity not specified; grams=150.0; measure-unit ID=9999.
Selected nutrient IDs/amounts per 100 g: 1008: 67 KCAL; 2047: null; 2048: null; 1003: 10.2 G; 1004: 1.36 G; 1005: 3.6 G; 1079: 0 G; 1235: null.

### FDC 2705424: Yogurt, Greek, nonfat milk, plain
Data type: survey_fndds_food; published: 2024-10-31; API retrieval: completed; exact retrieval timestamp and report listed below. [USDA record](https://fdc.nal.usda.gov/food-details/2705424/nutrients).
- Portion 290703: amount=null; modifier=64562; description=1 5.3 oz container; grams=150.0; measure-unit ID=9999.
- Portion 290704: amount=null; modifier=60039; description=1 6 oz container; grams=170.0; measure-unit ID=9999.
- Portion 290705: amount=null; modifier=60598; description=1 container, NFS; grams=150.0; measure-unit ID=9999.
- Portion 290706: amount=null; modifier=10205; description=1 cup; grams=245.0; measure-unit ID=9999.
- Portion 290707: amount=null; modifier=90000; description=Quantity not specified; grams=150.0; measure-unit ID=9999.
Selected nutrient IDs/amounts per 100 g: 1008: 59 KCAL; 2047: null; 2048: null; 1003: 10.3 G; 1004: 0.37 G; 1005: 3.64 G; 1079: 0 G; 1235: null.

## Complex ingredients remain on hold

- Salmon: species, cut, raw/cooked weight and preparation must be fixed before selecting an ID.
- Milk alternatives: specify the product/type, sweetening and fortification; they are not interchangeable with milk.
- Dark chocolate: cocoa percentage and chip/bar form matter; semisweet chips are not an automatic match.
- Kefir: plain versus flavored and fat content must be specified. Existing FNDDS candidate is a mixed model and is not a plain-kefir default.
- Seasonings: crushed chili-flake grams remain null; sea salt composition remains unresolved. Salt & pepper needs separate measured amounts.

## Candidate recipes — conditional, not yet eligible

- **Chamomile & Sweet Potato Toast:** banana, almond butter and sweet potato decisions would resolve much of the recipe; brewed chamomile portion and previously standardized cinnamon still need source/conversion review. Fix raw versus roasted sweet-potato weight.
- **Warm Oatmeal with Berries:** oats and honey are covered here, but milk choice, berry blend, chopped-walnut weight and cinnamon conversion remain. No complete total yet.
- **Berry Yogurt Parfait:** honey and Greek yogurt become usable after approval; granola identity and mixed-berry proportions still prevent a complete calculation.
- **Avocado Toast:** egg, bread and avocado decisions advance it, but crushed chili-flake grams still block a complete total. Fine table salt quantity was approved; composition/conversion still requires review for this recipe.
- **Brown Rice Veggie Bowl:** choose cooked rice type and resolve chard raw-versus-sauteed measurement; olive oil, tahini and lemon juice mappings also need approval.

**No new recipe is fully eligible solely from approving this batch.** Rainbow Fruit Skewers remains the only approved calculation. No live recipe totals were computed.

## Review boundary

The JSON companion now records per-ID retrieval dates, pending-report paths and comparison summaries. Full API responses remain in pending-review. Candidate confidence is not recipe approval. No runtime data has been changed.

## Completed API review

| FDC ID | Retrieved (UTC) | Material / informational fields | Result |
|---|---|---|---|
| 168482 | 2026-10-14T08:09:36.097086+00:00 | 0 / 13 | Clean nutritional comparison; not exact metadata match |
| 168483 | 2026-10-14T08:09:37.519328+00:00 | 0 / 13 | Clean nutritional comparison; not exact metadata match |
| 168588 | 2026-10-14T08:19:25.913624+00:00 | 3 / 14 | Manual source review required |
| 168875 | 2026-10-14T08:19:27.148121+00:00 | 0 / 13 | Clean nutritional comparison; not exact metadata match |
| 169124 | 2026-10-14T08:19:28.397870+00:00 | 0 / 13 | Clean nutritional comparison; not exact metadata match |
| 169640 | 2026-10-14T08:19:29.620184+00:00 | 0 / 13 | Clean nutritional comparison; not exact metadata match |
| 169704 | 2026-10-14T08:19:30.943835+00:00 | 0 / 13 | Clean nutritional comparison; not exact metadata match |
| 169991 | 2026-10-14T08:19:32.280525+00:00 | 0 / 13 | Clean nutritional comparison; not exact metadata match |
| 170401 | 2026-10-14T08:19:33.586384+00:00 | 0 / 13 | Clean nutritional comparison; not exact metadata match |
| 170556 | 2026-10-14T08:19:34.995152+00:00 | 0 / 13 | Clean nutritional comparison; not exact metadata match |
| 170567 | 2026-10-14T08:19:36.403811+00:00 | 2 / 13 | Manual source review required |
| 171287 | 2026-10-14T08:19:37.735102+00:00 | 0 / 13 | Clean nutritional comparison; not exact metadata match |
| 171705 | 2026-10-14T08:19:39.069294+00:00 | 2 / 13 | Manual source review required |
| 172688 | 2026-10-14T08:19:40.427839+00:00 | 0 / 13 | Clean nutritional comparison; not exact metadata match |
| 173424 | 2026-10-14T08:19:41.694801+00:00 | 0 / 13 | Clean nutritional comparison; not exact metadata match |
| 173904 | 2026-10-14T08:19:42.996956+00:00 | 0 / 13 | Clean nutritional comparison; not exact metadata match |
| 173944 | 2026-10-14T08:19:44.256391+00:00 | 0 / 13 | Clean nutritional comparison; not exact metadata match |
| 2346396 | 2026-10-14T08:19:45.667652+00:00 | 4 / 9 | Manual source review required |
| 2705422 | 2026-10-14T08:19:46.768351+00:00 | 1 / 1 | Manual source review required |
| 2705423 | 2026-10-14T08:19:47.866359+00:00 | 1 / 1 | Manual source review required |
| 2705424 | 2026-10-14T08:19:48.975027+00:00 | 0 / 1 | Clean nutritional comparison; not exact metadata match |

### Source issues requiring review

- **Almond butter 168588:** nutrient 1283 (phytosterols) appears twice: source row 1372134 has 139 mg/100 g, matching CSV; a second row has null amount and no row ID. All other numeric nutrients and portions match. The tool intentionally keeps the normalized phytosterol value null. Proposed resolution for approval: retain the sourced 139 mg row and preserve the empty duplicate as evidence; not applied.
- **Almonds 170567 and avocado 171705:** an additional phytosterol record has null amount and MG unit. No numeric disagreement was found, but this is a meaningful nutrient, not one of the six category IDs. Preserve it as unknown and retain the missing-value flags; do not substitute zero.
- **Rolled oats 2346396:** API provides portion 312593, amount 1, unit RACC (1121), weight 40 g. This does not establish a half-cup conversion. Exact rolled oats still need a weighed recipe amount, or explicit approval of the different SR regular/quick dry-oat record 173904 and its own 81 g/cup measure.
- **Greek yogurt whole 2705422:** water (1051) is 81.3 g/100 g in API versus 81.32 in CSV. **Low-fat 2705423:** 84.2 versus 84.15. These may reflect rounding, but that cause is not verified; no tolerance or overwrite applied. Nonfat 2705424 has a clean nutritional comparison. Fat level still needs user selection.

### Proposed approval decisions

- Honey 169640: approve 1 tsp = 7 g and 1/4 cup = 84.75 g as USDA reference conversions. API matches; not yet approved.
- Banana 173944: choose a medium peeled reference fruit, 118 g; half 59 g, if desired. Size remains a recipe decision.
- Eggs: select large 50 g edible eggs; preserve raw input 171287 versus hard-boiled 173424 by recipe. Power-bowl cooking method still unresolved.
- Brown rice: choose cooked long-grain (3/4 cup 151.5 g) or medium-grain (146.25 g); never substitute dry rice.
- Bread: approve whole-wheat specifically and the 32 g reference slice, or provide the intended loaf/slice weight. Generic whole-grain is not a precise identity.
- All remaining proposals retain the identity/portion questions in the table. Salmon, milk alternatives, chocolate and kefir stay on hold.

### Recipe readiness and validation

No additional complete recipe becomes eligible without further decisions. Suggested next pilot: Chamomile & Sweet Potato Toast after sweet-potato state/weight, medium banana, plain unsalted almond butter, cinnamon conversion and brewed-tea handling are settled. Oatmeal/parfait still need milk/berries/granola choices; avocado toast still has unresolved chili-flake grams. No live totals calculated.

API tool checkpoint: ae01366. Duplicate recovery changes and this report remain uncommitted. Fourteen Python tests, 19 knowledge tests and TypeScript validation pass. The earlier build passed; this phase changed only review documents/scripts. Pending report evidence and original API payloads remain intact.


## Honey approved (2026-10-14)

User decisions: **H1** FDC 169640 approved as generic honey. **H2** derived conversions approved: 1 tsp = 7 g, 1/4 cup = 84.75 g. **H3** missing added sugars remain null/Unknown, not zero. Recorded in `src/data/usda/approved-ingredients.json` with source rows, portions and API report reference; see README.md. No recipe totals are published; every recipe using honey still has unreviewed ingredients. The other 14 labels in this batch remain pending.

## Resumed USDA review after FatSecret checkpoint (2026-10-14)

FatSecret checkpoint: `d733311`, restricted to docs/fatsecret. No FatSecret evidence is used in this USDA batch. Rechecked all 21 saved API records against exact IDs and retained CSV baselines offline; comparison summaries still match: 15 clean nutritional comparisons, six source-review flags. No new API requests. Existing per-ID retrieval dates, units and portion references above remain authoritative. Current recipe usage counts match all 15 selected labels. Egg and Eggs are separate recipe labels sharing records (four uses combined). The 61-label queue is a review backlog, not 61 approved or distinct food identities; the live recipe source currently contains 72 exact ingredient labels overall.

### Approval package

Keep the same 15-label batch rather than fetching duplicate candidates. Proposed decisions, none applied:

1. Approve honey 169640, native reference conversions 7 g/tsp and 84.75 g per quarter cup.
2. Standardize raw peeled bananas 173944 to medium 118 g (half 59 g); large eggs to 50 g edible, preserving raw 171287 versus hard-boiled 173424.
3. Select cooked long-grain rice 169704 (151.5 g per three-quarter cup), rather than mixing its measure with medium-grain 168875.
4. Confirm plain unsalted almond butter 168588 and explicitly resolve its duplicate phytosterol rows before accepting that nutrient. Other source amounts match; do not silently choose the numeric duplicate.
5. Specify sweet potato raw edible weight/skin handling, almond form and salt/roasting state, pumpkin kernels and roasting state, avocado reference size, bread type/slice mass, yogurt fat level, rolled-oat record and measured grams. Pineapple chunks-to-diced equivalence requires an explicit convention outside the already approved skewers pilot.
6. Keep sauteed chard on hold: boiled/drained composition and portions are not a substitute. Record raw input plus measured oil or obtain a suitable sauteed preparation record.

No additional recipe is eligible for complete estimates yet. Recommended next pilot remains **Chamomile & Sweet Potato Toast** because its five inputs can be explicitly standardized without selecting a meat cut, milk alternative or mixed topping. It still needs approval of raw sweet-potato edible mass and skin treatment; half a medium banana (59 g); plain unsalted almond butter (32 g for two tablespoons) with duplicate-nutrient handling; a source-backed gram conversion for the already approved 1/16 tsp cinnamon; and brewed chamomile identity plus finished beverage volume (tea bag excluded). Do not claim full micronutrient coverage when retained values are null. Added sugars and other absent nutrients stay unknown.

Sunshine Banana Pancakes remains a later candidate: oat flour identity/half-cup grams and topping fruit composition are unresolved. Oatmeal/parfait additionally require milk, berry-mixture or granola decisions. Avocado toast retains unresolved chili-flake grams. Meat cuts, salmon species/state, kefir, chocolate, milk alternatives, mixed seasonings and unmeasured oil remain held.

Earlier triage wording about salt/pinches is historical: 1/16 tsp cinnamon and fine table salt instructions were approved; chili flakes have an approved 1/16 tsp instruction but unknown grams/composition; sea salt has an approved weighed 0.4 g instruction but unresolved sodium composition. No table-salt substitution is authorized for sea salt.

No totals calculated, new approvals assigned or runtime records changed. Await user decisions before importing or publishing. Validation on this checkpoint: 22 FatSecret tests, 14 USDA tests, 19 knowledge tests, avatar tests, TypeScript and build pass; only the existing Browserslist age warning remains.

## Remaining labels decided (2026-10-14)

See `BATCH-REMAINING-14-PROPOSAL.md` for the approval table and user decisions. Approved records are in `src/data/usda/approved-ingredients.json`; Greek yogurt and avocado remain pending, and several uses remain on hold. No recipe totals were published.


## Chamomile Toast estimate published (2026-10-19)

The user approved peeled sweet-potato flesh and the recipe estimate. The Toast now explicitly says to peel the potato. Its five exact ingredient conversions are checked by `approvedChamomileToastNutrition`; the estimate appears only for the approved recipe wording and servings. Per serving: 364 kcal, 9.4 g protein, 46.3 g carbohydrate, 18.0 g fat, 8.8 g fiber, 14.1 g total sugars; added sugars and any other unavailable nutrient values remain Unknown. Input weights total 458.1625 g including 237 g brewed tea; 130 g raw sweet potato is before toasting, with no cooking yield adjustment. See `docs/usda/README.md`. Greek yogurt and avocado remain pending; other approved uses remain recipe-scoped and do not make their recipes eligible.
