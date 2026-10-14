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
    assert.equal(await page.getByText("1 entries").count(), 1);
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
    console.log("BROWSER ERRORS", errors);
    assert.deepEqual(errors, []);
    console.log(
      "PASS browser: mobile/desktop, mood, nutrient disclosure, preferences, grocery aggregation, history, publishing, EPUB/PDF imports, reloads",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
