const { chromium } = require("playwright");
const baseURL = process.env.MOODMEAL_URL || "http://127.0.0.1:4175";
const assert = require("node:assert/strict");
const fs = require("node:fs");
fs.mkdirSync("work", { recursive: true });
const { zipSync, strToU8 } = require("fflate");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.BROWSER_CHANNEL || "msedge",
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.setDefaultTimeout(10000);
    const fullArtwork = [];
    page.on("request", (r) => {
      if (/\/assets\/ingredients\/[^/]+\.png$/.test(r.url())) fullArtwork.push(r.url());
    });
    await page.goto(baseURL + "/mood");
    await page.getByRole("button", { name: "Tired mood", exact: true }).click();
    await page.getByRole("button", { name: /Find|Continue|Show|Get/ }).click();
    await page.waitForURL("**/result");
    await page.getByText("Steady Energy", { exact: true }).waitFor();
    await page
      .locator("article")
      .first()
      .getByRole("button", { name: "Add to Grocery", exact: true })
      .click();
    await page.reload();
    assert((await page.locator("article").count()) > 0);
    await page
      .locator("article")
      .first()
      .getByRole("button", { name: /Protein/ })
      .click();
    await page
      .getByText(
        "Provides building blocks for making and repairing body tissues.",
      )
      .waitFor();
    await page.screenshot({ path: "work/qa-result-mobile.png" });
    await page.goto(baseURL + "/recipe/recipe-salmon-quinoa-bowl");
    await page
      .getByRole("button", { name: "Add ingredients to Grocery", exact: true })
      .click();
    await page.waitForTimeout(2100);
    await page
      .getByRole("button", { name: "Add ingredients to Grocery", exact: true })
      .click();
    await page.goto(baseURL + "/grocery");
    await page.reload();
    const groceries = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("moodmeal:groceryList")),
    );
    assert.equal(
      groceries.find((i) => i.name === "Baby spinach").quantity,
      "2 cup",
    );
    await page.goto(baseURL + "/history");
    await page.getByText(/You saved Salmon & Quinoa Bowl/).waitFor();
    assert.equal(await page.getByText("1 entry", { exact: true }).count(), 1);
    await page.goto(baseURL + "/preferences");
    await page.getByLabel("fish", { exact: true }).check();
    await page
      .getByLabel("Dietary pattern", { exact: true })
      .selectOption("vegetarian");
    await page.getByRole("button", { name: "Save food preferences" }).click();
    await page.getByText("Food preferences saved.").waitFor();
    await page.reload();
    assert(await page.getByLabel("fish", { exact: true }).isChecked());
    await page.goto(baseURL + "/meals");
    assert.equal(
      await page.getByRole("heading", { name: "Salmon & Quinoa Bowl" }).count(),
      0,
    );
    await page.goto(baseURL + "/library");
    await page
      .getByLabel("Source title", { exact: true })
      .fill("Test research");
    await page.getByLabel("Author", { exact: true }).fill("QA author");
    await page
      .locator("input[type=file]")
      .setInputFiles({
        name: "research.txt",
        mimeType: "text/plain",
        buffer: Buffer.from(
          "Fiber is a nutrient. Mood and energy. Recipe ingredients include oats. Gut and hydration. A supplement cures anxiety.",
        ),
      });
    await page.getByText(/Created 4 Draft candidates/).waitFor();
    await page
      .getByRole("button", { name: "Move to published", exact: true })
      .click();
    await page
      .getByText("Follow Draft → Needs Review → Reviewed → Published.")
      .waitFor();
    await page
      .getByLabel("Content type", { exact: true })
      .selectOption("wellness-education");
    await page
      .getByLabel("Title", { exact: true })
      .fill("My reviewed food routine");
    await page
      .getByLabel("Original public explanation", { exact: true })
      .fill(
        "Regular meals can be a manageable part of an everyday self-care routine.",
      );
    await page.getByLabel("Reviewer name", { exact: true }).fill("QA reviewer");
    await page
      .getByLabel("Verification and copyright notes")
      .fill("Checked against the source. Original wording.");
    await page
      .getByLabel("Evidence status", { exact: true })
      .selectOption("source-supported");
    await page
      .getByLabel("I wrote this wording or have permission to publish it.")
      .check();
    for (const status of ["needs-review", "reviewed", "published"])
      await page
        .getByRole("button", { name: `Move to ${status}`, exact: true })
        .click();
    await page.reload();
    await page.goto(baseURL + "/wellness");
    await page.getByRole("link", { name: /My reviewed food routine/ }).click();
    await page
      .getByText(
        "Regular meals can be a manageable part of an everyday self-care routine.",
      )
      .waitFor();
    // EPUB extraction remains entirely local.
    await page.goto(baseURL + "/library");
    await page
      .locator("summary")
      .filter({ hasText: "Import a research resource" })
      .click();
    await page
      .locator("input[type=file]")
      .setInputFiles({
        name: "sample.epub",
        mimeType: "application/epub+zip",
        buffer: Buffer.from(
          zipSync({
            "OEBPS/chapter.xhtml": strToU8(
              "<html><body><p>Fiber and protein. A recipe with oats. Sleep routines.</p></body></html>",
            ),
          }),
        ),
      });
    await page.getByText(/EPUB text sections/).waitFor();
    // Minimal searchable PDF fixture (no copyrighted material).
    const pdf = fs.readFileSync("tests/fixtures/research.pdf");
    await page
      .locator("input[type=file]")
      .setInputFiles({
        name: "sample.pdf",
        mimeType: "application/pdf",
        buffer: pdf,
      });
    await page
      .getByText(/Read text from 1 of 1 PDF pages/)
      .waitFor({ timeout: 20000 });
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of [
        "result",
        "foods",
        "meals",
        "recipe/recipe-salmon-quinoa-bowl",
        "grocery",
        "history",
        "wellness",
        "preferences",
        "profile",
        "library",
      ]) {
        await page.goto(baseURL + "/" + route);
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `overflow ${width} ${route}`,
        );
        if (
          width === 390 &&
          ["meals", "wellness", "preferences", "profile"].includes(route)
        )
          await page.screenshot({ path: `work/qa-${route}.png` });
      }
    }
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(baseURL + "/recipe/recipe-rainbow-fruit-skewers");
      const nutrition = page.locator('[aria-label="Estimated nutrition per serving"]');
      await nutrition.waitFor();
      await page.getByText(/This recipe provides .*about 3\.5 g of fiber per serving/).waitFor();
      for (const value of ["85 kcal", "1.2 g", "21.7 g", "0.4 g", "3.5 g", "Unknown"])
        assert((await nutrition.innerText()).includes(value), value);
      await nutrition.getByText("Portions & calculation", { exact: true }).click();
      for (const id of ["167762", "169124", "171711"])
        assert((await nutrition.innerText()).includes(id));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `pilot overflow ${width}`);
      await nutrition.screenshot({ path: `work/qa-usda-pilot-${width}.png` });
      await page.reload();
      await nutrition.waitFor();
      assert((await nutrition.innerText()).includes("85 kcal"));
    }
    await page.goto(baseURL + "/recipe/recipe-gentle-avocado-toast");
    await page.getByText(/Nutrition totals: not calculated/).waitFor();
    assert.equal(await page.locator('[aria-label="Estimated nutrition per serving"]').count(), 0);
    // A Sick check-in maps to Hydration, which no pilot nutrient matches.
    await page.evaluate(() => localStorage.setItem("moodmeal:draftMood", JSON.stringify({
      emotionId: "sick", intensity: 5, note: "", submittedAt: new Date().toISOString(),
    })));
    await page.goto(baseURL + "/recipe/recipe-rainbow-fruit-skewers");
    await page.getByText("No verified nutrient in it matches your hydration food picks yet.").waitFor();
    const other = page.getByTestId("other-verified-nutrients");
    assert((await other.innerText()).includes("not matched to your Hydration picks"));
    assert(!(await page.getByText(/This recipe provides/).count()));
    assert((await page.locator('[aria-label="Estimated nutrition per serving"]').innerText()).includes("85 kcal"));
    await page.evaluate(() => localStorage.removeItem("moodmeal:draftMood"));
    // Ingredient artwork: every image loads, thumbnails stay square and small.
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of [
        "recipe/recipe-salmon-quinoa-bowl",
        "recipe/recipe-turkey-lettuce-wraps",
        "grocery",
        "meals",
        "foods",
      ]) {
        await page.goto(baseURL + "/" + route);
        await page.locator("img").first().waitFor();
        const images = await page.evaluate(async () => {
          const imgs = [...document.querySelectorAll("img")];
          imgs.forEach((img) => (img.loading = "eager"));
          await Promise.all(imgs.map((img) => img.decode().catch(() => {})));
          return imgs.map((img) => ({
            src: img.getAttribute("src"),
            alt: img.alt,
            ok: img.complete && img.naturalWidth > 0,
            w: img.getBoundingClientRect().width,
            h: img.getBoundingClientRect().height,
          }));
        });
        for (const img of images) {
          assert(img.ok, `broken image ${img.src} on ${route}`);
          assert(img.alt, `missing alt ${img.src}`);
          if (img.src.includes("/thumbs/")) {
            assert(Math.abs(img.w - img.h) < 1, `distorted ${img.src}`);
            assert(img.w <= 48, `thumbnail too large ${img.src}`);
          }
        }
        if (route.startsWith("recipe/")) {
          const rows = page
            .locator("section")
            .filter({ has: page.getByRole("heading", { name: "Ingredients", exact: true }) })
            .locator("li");
          for (let i = 0; i < (await rows.count()); i++)
            assert((await rows.nth(i).locator('img[src*="/thumbs/"]').count()) > 0, `row ${i} ${route}`);
        }
        if (route === "grocery")
          assert(images.some((i) => i.src.includes("/assets/ingredients/thumbs/")));
        if (route === "meals")
          assert((await page.getByRole("list", { name: /^Ingredients in / }).count()) > 0);
        assert(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          `overflow ${width} ${route}`,
        );
        if (width !== 1440 && route !== "foods")
          await page.screenshot({ path: `work/qa-artwork-${route.replace("/", "-")}-${width}.png` });
      }
    }
    assert.deepEqual(fullArtwork, [], "full-resolution ingredient PNGs requested");
    // Usability regressions: mood sheet keyboard access and current-tab marking.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(baseURL + "/mood");
    const tired = page.getByRole("button", { name: "Tired mood", exact: true });
    await tired.focus();
    await page.keyboard.press("Enter");
    await page.getByRole("dialog").waitFor();
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute("aria-label")), "Mood intensity");
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("dialog").count(), 0);
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute("aria-label")), "Tired mood");
    assert.equal(await page.locator('nav a[aria-current="page"]').innerText(), "Home");
    // Unreadable saved data must not blank a screen, and is left in storage untouched.
    const savedDraft = await page.evaluate(() => localStorage.getItem("moodmeal:draftMood"));
    const savedProfile = await page.evaluate(() => localStorage.getItem("moodmeal:profile"));
    await page.evaluate(() => {
      localStorage.setItem("moodmeal:draftMood", JSON.stringify({ emotionId: "unknown", intensity: 99 }));
      localStorage.setItem("moodmeal:profile", "[]");
    });
    for (const route of ["/result", "/foods", "/meals", "/profile"]) {
      await page.goto(baseURL + route);
      assert((await page.locator("body").innerText()).trim().length > 20, `blank ${route}`);
    }
    assert.equal(new URL(page.url()).pathname, "/profile");
    assert.equal(await page.evaluate(() => localStorage.getItem("moodmeal:profile")), "[]");
    await page.evaluate(([d, p]) => {
      d === null ? localStorage.removeItem("moodmeal:draftMood") : localStorage.setItem("moodmeal:draftMood", d);
      p === null ? localStorage.removeItem("moodmeal:profile") : localStorage.setItem("moodmeal:profile", p);
    }, [savedDraft, savedProfile]);
    // Mood History delete offers Undo for each deletion; restoring puts back the identical entries.
    await page.setViewportSize({ width: 360, height: 740 });
    await page.evaluate(() => localStorage.setItem("moodmeal:moodHistory", JSON.stringify([
      { id: "m-test-1", date: "2026-10-14T09:00:00.000Z", emotionId: "tired", intensity: 6, note: "Long day" },
      { id: "m-test-2", date: "2026-10-13T09:00:00.000Z", emotionId: "happy", intensity: 4 },
      { id: "m-test-3", date: "2026-10-12T09:00:00.000Z", emotionId: "worried", intensity: 7 },
    ])));
    const historyBefore = await page.evaluate(() => localStorage.getItem("moodmeal:moodHistory"));
    const storedCount = () => page.evaluate(() => JSON.parse(localStorage.getItem("moodmeal:moodHistory")).length);
    await page.goto(baseURL + "/history");
    // Keyboard delete moves focus to that notice's Undo; Undo restores and refocuses the row.
    await page.getByRole("button", { name: /^Delete Tired entry from / }).focus();
    await page.keyboard.press("Enter");
    await page.getByText(/^Tired entry from .* deleted\.$/).waitFor();
    assert.match(await page.evaluate(() => document.activeElement.getAttribute("aria-label")), /^Undo delete of Tired entry/);
    assert.equal(await storedCount(), 2);
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => localStorage.getItem("moodmeal:moodHistory")), historyBefore);
    assert.equal(await page.getByText(/^Tired entry from .* deleted\.$/).count(), 0);
    assert.match(await page.evaluate(() => document.activeElement.getAttribute("aria-label")), /^Delete Tired entry/);
    // Consecutive deletions each stay recoverable, undone in any order.
    await page.getByRole("button", { name: /^Delete Happy entry from / }).click();
    await page.getByRole("button", { name: /^Delete Worried entry from / }).click();
    await page.getByRole("button", { name: /^Delete Tired entry from / }).click();
    assert.equal(await storedCount(), 0);
    assert.equal(await page.locator("[data-undo-id]").count(), 3);
    assert.notEqual(await page.evaluate(() => document.activeElement.textContent.trim()), "Undo");
    // Notices take layout space above the nav: they never overlap the list or the nav.
    const layout = await page.evaluate(() => {
      const region = document.querySelector('[role="status"][aria-live="polite"]').getBoundingClientRect();
      const scroll = document.querySelector(".screen-scroll").getBoundingClientRect();
      const nav = document.querySelector("nav").getBoundingClientRect();
      return { regionTop: region.top, scrollBottom: scroll.bottom, lastNotice: [...document.querySelectorAll("[data-undo-id]")].pop().getBoundingClientRect().bottom, navTop: nav.top };
    });
    assert(layout.scrollBottom <= layout.regionTop + 0.5, JSON.stringify(layout));
    assert(layout.lastNotice <= layout.navTop + 0.5, JSON.stringify(layout));
    await page.getByRole("button", { name: /^Undo delete of Happy entry/ }).click();
    await page.getByRole("button", { name: /^Undo delete of Worried entry/ }).click();
    await page.getByRole("button", { name: /^Undo delete of Tired entry/ }).click();
    assert.equal(await page.evaluate(() => localStorage.getItem("moodmeal:moodHistory")), historyBefore);
    // With a long list, the last entry scrolls fully above the notices.
    await page.evaluate(() => localStorage.setItem("moodmeal:moodHistory", JSON.stringify(
      Array.from({ length: 12 }, (_, i) => ({ id: `m-long-${i}`, date: new Date(Date.UTC(2026, 9, 14 - i, 9)).toISOString(), emotionId: "tired", intensity: 5 })))));
    await page.goto(baseURL + "/history");
    await page.getByRole("button", { name: /^Delete Tired entry from / }).first().click();
    await page.locator(".screen-scroll").evaluate((el) => { el.scrollTop = el.scrollHeight; });
    const lastRow = await page.evaluate(() => {
      const rows = [...document.querySelectorAll("[data-entry-id]")];
      const last = rows[rows.length - 1].closest("div.flex").getBoundingClientRect();
      const region = document.querySelector('[role="status"][aria-live="polite"]').getBoundingClientRect();
      return { lastBottom: last.bottom, regionTop: region.top };
    });
    assert(lastRow.lastBottom <= lastRow.regionTop, JSON.stringify(lastRow));
    await page.screenshot({ path: "work/qa-history-undo-360.png" });
    // Hover pauses the 10 s countdown; leaving resumes it; Escape dismisses all notices.
    await page.locator("[data-undo-id]").first().hover();
    await page.waitForTimeout(10500);
    assert.equal(await page.locator("[data-undo-id]").count(), 1);
    await page.mouse.move(5, 5);
    // The remaining time (nearly all 10 s, since hover began right away) resumes.
    await page.waitForTimeout(5000);
    assert.equal(await page.locator("[data-undo-id]").count(), 1);
    await page.locator("[data-undo-id]").waitFor({ state: "detached", timeout: 7000 });
    assert.equal(await storedCount(), 11);
    await page.getByRole("button", { name: /^Delete Tired entry from / }).first().focus();
    await page.keyboard.press("Enter");
    await page.locator("[data-undo-id]").waitFor();
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("[data-undo-id]").count(), 0);
    assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), "All Entries");
    assert.equal(await storedCount(), 10);
    // Pointer delete with no interaction closes on its own after 10 s, not before.
    await page.getByRole("button", { name: /^Delete Tired entry from / }).first().click();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(8500);
    assert.equal(await page.locator("[data-undo-id]").count(), 1);
    await page.locator("[data-undo-id]").waitFor({ state: "detached", timeout: 3500 });
    await page.setViewportSize({ width: 390, height: 844 });
    // Recipe-to-grocery converts 1 tsp + 1 tbsp soy sauce into one row.
    await page.evaluate(() => localStorage.setItem("moodmeal:groceryList", "[]"));
    for (const id of ["recipe-energizing-power-bowl", "recipe-iron-rich-stir-fry"]) {
      await page.goto(baseURL + "/recipe/" + id);
      await page.getByRole("button", { name: "Add ingredients to Grocery", exact: true }).click();
    }
    const soyRows = (await page.evaluate(() => JSON.parse(localStorage.getItem("moodmeal:groceryList")))).filter((i) => i.name === "Soy sauce");
    assert.deepEqual(soyRows.map((i) => i.quantity), ["4 tsp"]);
    await page.goto(baseURL + "/grocery");
    await page.getByText("4 tsp").waitFor();
    // ¾ cup + 2 tbsp is stored precisely and shown as ⅞ cup; brown rice 1½ cup cooked.
    await page.getByLabel("Item name").fill("Rolled oats");
    await page.getByLabel("Quantity (optional)").fill("0.75 cup");
    await page.getByRole("button", { name: "Add item" }).click();
    await page.getByLabel("Item name").fill("Rolled oats");
    await page.getByLabel("Quantity (optional)").fill("2 tbsp");
    await page.getByRole("button", { name: "Add item" }).click();
    const oats = (await page.evaluate(() => JSON.parse(localStorage.getItem("moodmeal:groceryList")))).filter((i) => i.name === "Rolled oats");
    assert.deepEqual(oats.map((i) => i.quantity), ["0.875 cup"]);
    await page.getByText("⅞ cup", { exact: true }).waitFor();
    await page.getByText("1½ cup cooked", { exact: true }).waitFor();
    assert.equal(await page.getByText("0.875 cup").count(), 0);
    await page.screenshot({ path: "work/qa-grocery-converted-390.png" });
    // Nutrition Calculator: reached from Wellness, calculates, validates, saves nothing.
    const storageBefore = await page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort()));
    await page.goto(baseURL + "/wellness");
    await page.getByRole("link", { name: /Nutrition Calculator/ }).click();
    await page.waitForURL("**/nutrition-calculator");
    assert.equal(await page.locator('nav a[aria-current="page"]').innerText(), "Wellness");
    await page.getByLabel("Search approved ingredients").fill("banana");
    await page.getByRole("button", { name: "Add Banana (Raw, peeled)" }).click();
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute("aria-label")), "Amount of Banana");
    await page.keyboard.type("1");
    await page.getByLabel("Servings").fill("2");
    const results = page.getByTestId("calc-results");
    await results.waitFor();
    const resultText = await results.innerText();
    for (const v of ["105 kcal", "53 kcal", "27.0 g", "3.1 g", "14.4 g", "Total sugars"]) assert(resultText.includes(v), v);
    await page.getByText("Ingredient weights & calculation").click();
    await page.getByText(/Banana: 1 medium banana .* = 118 g/).waitFor();
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `calculator overflow ${width}`);
      if (width !== 1440) await page.screenshot({ path: `work/qa-calculator-${width}.png` });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByLabel("Amount of Banana").fill("-1");
    await page.getByText("Amount must be greater than 0.").waitFor();
    assert.equal(await page.getByLabel("Amount of Banana").getAttribute("aria-invalid"), "true");
    assert.equal(await page.getByTestId("calc-results").count(), 0);
    await page.getByLabel("Amount of Banana").fill("1/2");
    await page.getByLabel("Servings").fill("0");
    await page.getByText(/whole number of servings from 1 to 100/).waitFor();
    assert.equal(await page.getByTestId("calc-results").count(), 0);
    await page.getByLabel("Search approved ingredients").fill("dragonfruit");
    await page.getByText(/No approved ingredient matches/).waitFor();
    await page.getByRole("button", { name: "Remove Banana" }).click();
    await page.getByText("No ingredients yet.", { exact: false }).waitFor();
    assert.equal(await page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort())), storageBefore);
    // Open Food Facts barcode lookup (all responses mocked; no live requests).
    const offRequests = [];
    // v3.5 nutrition: aggregated set plus input sets as entered.
    const offNut = (m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, { value: v, unit: k === "energy-kcal" ? "kcal" : "g", source: "packaging" }]));
    const offSet = (per, perQuantity, m) => ({ per, per_quantity: perQuantity, per_unit: "g", preparation: "as_sold", source: "packaging", nutrients: offNut(m) });
    const offNutrition = (per, m, sets) => ({ aggregated_set: { per, preparation: "as_sold", nutrients: offNut(m) }, input_sets: sets ?? [offSet(per, 100, m)] });
    const offProduct = (extra) => ({
      code: "0012345678905", product_name: "Test Granola", brands: "Example Co", quantity: "400 g",
      product_quantity: 400, product_quantity_unit: "g",
      serving_quantity: 30, serving_quantity_unit: "g", serving_size: "30 g",
      nutrition: offNutrition("100g", { "energy-kcal": 400, proteins: 10, carbohydrates: 60, fat: 12, fiber: 0 }),
      allergens_tags: ["en:milk"], ingredients_text: "Oats, <script>alert(1)</script> honey", ...extra,
    });
    const mixedPer100 = { "energy-kcal": 360 / 103 * 100, proteins: 12, carbohydrates: 60, fat: 8, fiber: 1, sugars: 7 };
    const mixedPerPack = { "energy-kcal": 360, proteins: 12, carbohydrates: 60, fat: 8, fiber: 1, sugars: 7 };
    await page.route("**/api/v3.5/product/**", async (route) => {
      const url = route.request().url();
      offRequests.push({ url, ua: route.request().headers()["x-user-agent"] });
      const code = url.match(/product\/(\d+)/)[1];
      const json = (status, body, headers = {}) => route.fulfill({ status, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*", ...headers }, body: JSON.stringify(body) });
      if (code === "0012345678905") return json(200, { status: "success", result: { id: "product_found" }, product: offProduct() });
      if (code === "96385074") return json(200, { status: "success", result: { id: "product_found" }, product: offProduct({ code: "96385074", product_name: "Test Juice", quantity: "1 L", product_quantity_unit: "ml", serving_quantity: 250, serving_quantity_unit: "ml", serving_size: "250 ml" }) });
      if (code === "0810111890373") return json(200, { status: "success", result: { id: "product_found" }, product: offProduct({
        code: "0810111890373", product_name: "Mixed-basis Noodles", quantity: "3.62 oz", product_quantity: 102.6,
        serving_quantity: 103, serving_size: "1 pack (103 g)",
        nutrition: offNutrition("100g", mixedPer100, [offSet("100g", 100, mixedPer100), offSet("serving", 103, mixedPerPack)]),
      }) });
      if (code === "00012345678905") return json(404, { status: "failure", result: { id: "product_not_found" } });
      if (code === "4006381333931") return json(429, {}, { "Retry-After": "30" });
      return route.abort("failed");
    });
    const errorsBeforeOff = errors.length;
    const lookUp = async (code) => {
      await page.getByLabel("Barcode (EAN or UPC)").fill(code);
      await page.getByRole("button", { name: "Look Up" }).click();
    };
    // Invalid input: message, no request.
    await lookUp("12345");
    await page.getByText(/Barcodes have 8, 12, 13 or 14 digits/).waitFor();
    assert.equal(offRequests.length, 0);
    // Found: preview with provenance; nothing is added until confirmed.
    await lookUp("0012345678905");
    const preview = page.getByTestId("off-preview");
    await preview.waitFor();
    const previewText = await preview.innerText();
    for (const t of ["Open Food Facts product data", "Test Granola", "Example Co", "0012345678905", "per 100 g", "30 g", "Allergens recorded: milk", "May contain (traces): Not recorded. This does not mean", "Open Database License", "Product page"])
      assert(previewText.toLowerCase().includes(t.toLowerCase()), t);
    assert(previewText.includes("<script>alert(1)</script>"), "ingredient text shown as plain text");
    // Values are shown as recorded per 100 g, with a per-serving column to compare with the package.
    const valuesTable = await page.getByTestId("off-values").innerText();
    for (const t of ["Per 100 g", "Per serving (30 g)", "400 kcal", "120 kcal"])
      assert(valuesTable.includes(t), t);
    assert(previewText.includes("Compare these with your package"));
    assert.equal(await page.locator("script:not([src])").filter({ hasText: "alert(1)" }).count(), 0);
    assert.equal(offRequests.length, 1);
    assert.match(offRequests[0].url, /\/product\/0012345678905\?/);
    assert.match(offRequests[0].ua, /^MoodMeal\//);
    assert.equal(await page.getByTestId("calc-row").count(), 0);
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `preview overflow ${width}`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await preview.screenshot({ path: "work/qa-off-preview-390.png" });
    await page.getByRole("button", { name: "Add to calculator" }).click();
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute("aria-label")), "Amount of Test Granola");
    await page.keyboard.type("50");
    const productRow = page.getByTestId("calc-row").filter({ hasText: "Test Granola" });
    assert((await productRow.innerText()).toLowerCase().includes("open food facts product data"));
    // Mixed with a USDA food: labeled mixed sources, provenance per ingredient, incomplete sugars.
    await page.getByLabel("Search approved ingredients").fill("banana");
    await page.getByRole("button", { name: "Add Banana (Raw, peeled)" }).click();
    await page.keyboard.type("1");
    await page.getByLabel("Servings").fill("1");
    await page.getByTestId("calc-results").waitFor();
    assert.match(await page.getByTestId("calc-source-label").innerText(), /^Estimate from mixed sources: USDA FoodData Central .* and Open Food Facts product data/);
    const mixed = await page.getByTestId("calc-results").innerText();
    assert(mixed.includes("305 kcal"), mixed);
    assert(mixed.includes("Incomplete: no recorded value for Test Granola"), mixed);
    await page.getByText("Ingredient weights & calculation").click();
    const provenance = await page.getByTestId("calc-provenance").allInnerTexts();
    assert(provenance.some((t) => /Source: Open Food Facts product data .*barcode 0012345678905/s.test(t)), provenance.join(" | "));
    assert(provenance.some((t) => /Source: USDA FoodData Central/.test(t)), provenance.join(" | "));
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `mixed overflow ${width}`);
      if (width !== 1440) await page.screenshot({ path: `work/qa-off-mixed-${width}.png` });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    // Repeat lookup of the same barcode uses the session cache (no new request).
    await lookUp("0012345678905");
    await preview.waitFor();
    assert.equal(offRequests.length, 1);
    await page.getByRole("button", { name: "Cancel" }).click();
    // Conflicting package entries in the source record: flagged in the preview and results, not corrected.
    await page.waitForTimeout(3100);
    await lookUp("0810111890373");
    await preview.waitFor();
    const conflictText = await page.getByTestId("off-conflicts").innerText();
    assert(conflictText.includes("Carbohydrates: 60 g per 100 g would be 61.8 g per 103 g serving, but the per-serving entry says 60 g."), conflictText);
    assert(!/Protein:/.test(conflictText), "protein differs only within label rounding");
    await preview.screenshot({ path: "work/qa-off-conflict-390.png" });
    await page.getByRole("button", { name: "Add to calculator" }).click();
    await page.keyboard.type("103");
    const conflictMarkers = await page.getByTestId("calc-conflict").allInnerTexts();
    assert.deepEqual(conflictMarkers, ["Source values conflict for Mixed-basis Noodles; check the package"]);
    assert((await page.getByTestId("calc-results").innerText()).includes("Carbohydrates"));
    await page.getByRole("button", { name: "Remove Mixed-basis Noodles" }).click();
    assert.equal(await page.getByTestId("calc-conflict").count(), 0);
    // Liquid recorded per 100 ml: explained and not addable.
    await page.waitForTimeout(3100);
    await lookUp("96385074");
    await preview.waitFor();
    assert((await preview.innerText()).includes("Can't be calculated yet"));
    assert(await page.getByRole("button", { name: "Add to calculator" }).isDisabled());
    // Lookups are spaced out by the client limiter; failures are reported once, never retried.
    await lookUp("00012345678905");
    await page.getByText(/wait \d+ s before the next lookup/).waitFor();
    assert.equal(offRequests.length, 3);
    await page.waitForTimeout(3100);
    await lookUp("00012345678905");
    await page.getByText("No product with barcode 00012345678905 was found on Open Food Facts.").waitFor();
    await page.waitForTimeout(3100);
    await lookUp("5901234123457");
    await page.getByText("Couldn't reach Open Food Facts. Check your connection and try again.").waitFor();
    await page.waitForTimeout(3100);
    await lookUp("4006381333931");
    // Retry-After isn't CORS-exposed by Open Food Facts, so browsers fall back to 60 s.
    await page.getByText(/Open Food Facts is limiting requests right now. Wait about 60 s/).waitFor();
    // After a rate limit, new barcodes wait (no request); cached ones still show without a request.
    await page.waitForTimeout(3100);
    await lookUp("5901234123457");
    await page.getByText(/wait \d+ s before the next lookup/).waitFor();
    await lookUp("0012345678905");
    await preview.waitFor();
    await page.getByRole("button", { name: "Cancel" }).click();
    assert.equal(offRequests.length, 6);
    assert.deepEqual(offRequests.map((r) => r.url.match(/product\/(\d+)/)[1]), ["0012345678905", "0810111890373", "96385074", "00012345678905", "5901234123457", "4006381333931"]);
    assert(offRequests.every((r) => /\/api\/v3\.5\/product\//.test(r.url)));
    await page.unroute("**/api/v3.5/product/**");
    // Removing the product row drops it; nothing was written to browser storage.
    await page.getByRole("button", { name: "Remove Test Granola" }).click();
    await page.getByRole("button", { name: "Remove Banana" }).click();
    assert.equal(await page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort())), storageBefore);
    // Mocked 404/429/aborted responses log expected "Failed to load resource" messages.
    const offErrors = errors.splice(errorsBeforeOff);
    assert(offErrors.every((e) => /Failed to load resource/.test(e)), offErrors.join(" | "));
    console.log("BROWSER ERRORS", errors);
    assert.deepEqual(errors, []);
    console.log(
      "PASS browser: mobile/desktop, mood, nutrient disclosure, preferences, grocery aggregation, history, publishing, EPUB/PDF imports, reloads, ingredient artwork",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
