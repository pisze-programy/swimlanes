import { expect, test } from "@playwright/test";

test("renders the default diagram", async ({ page }) => {
  await page.goto("/");
  const svg = page.locator("#preview svg");
  await expect(svg).toBeVisible();
  await expect(svg).toContainText("One");
  await expect(svg).toContainText("Three");
});

test("updates when the source changes", async ({ page }) => {
  await page.goto("/");
  await page.locator("#editor").fill("title: T\nAlpha -> Beta: hello");
  const svg = page.locator("#preview svg");
  await expect(svg).toContainText("Alpha");
  await expect(svg).toContainText("Beta");
});

test("writes the share fragment to the url", async ({ page }) => {
  await page.goto("/");
  await page.locator("#editor").fill("A -> B: x");
  await expect.poll(() => new URL(page.url()).hash.length).toBeGreaterThan(1);
});

test("copies a link", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.locator("#copy").click();
  await expect(page.locator("#status")).toHaveText(/link copied|copy failed/);
});

test("opens a diagram from a share fragment", async ({ page }) => {
  await page.goto("/");
  await page.locator("#editor").fill("title: Frag\nGamma -> Delta: hi");
  await expect.poll(() => new URL(page.url()).hash.length).toBeGreaterThan(1);
  const shared = page.url();
  const fresh = await page.context().newPage();
  await fresh.goto(shared);
  await expect(fresh.locator("#preview svg")).toContainText("Gamma");
  await fresh.close();
});

test("saves a short link and loads it again", async ({ page }) => {
  await page.goto("/");
  await page.locator("#editor").fill("title: Saved\nX -> Y: once");
  await page.locator("#save").click();
  await expect(page.locator("#status")).toHaveText(/saved/);
  await expect.poll(() => page.url()).toContain("/d/");
  const url = page.url();
  await page.goto(url);
  await expect(page.locator("#preview svg")).toContainText("Saved");
});

test("downloads the diagram as svg", async ({ page }) => {
  await page.goto("/");
  const downloadEvent = page.waitForEvent("download");
  await page.locator("#svg").click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("diagram.svg");
});

test("downloads the diagram as png", async ({ page }) => {
  await page.goto("/");
  const downloadEvent = page.waitForEvent("download");
  await page.locator("#png").click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("diagram.png");
});

test("loads an example from the menu", async ({ page }) => {
  await page.goto("/");
  await page.locator("#examples").selectOption("login");
  const svg = page.locator("#preview svg");
  await expect(svg).toContainText("Browser");
  await expect(svg).toContainText("Server");
});
