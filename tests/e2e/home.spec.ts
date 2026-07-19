import { expect, test } from "@playwright/test";

test("renders the complete rebranded homepage without failed local media", async ({
  page,
}) => {
  const failedResponses: string[] = [];
  const failedRequests: string[] = [];
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(response.url());
  });
  page.on("requestfailed", (request) => {
    failedRequests.push(
      `${request.url()} — ${request.failure()?.errorText ?? "request failed"}`,
    );
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await expect(page).toHaveTitle(/Tradel/);
  await expect(page.locator("main#top")).toBeVisible();
  await expect(page.locator(".home-hero")).toBeVisible();
  await expect(page.locator(".process-section")).toHaveCount(1);
  await expect(page.locator(".support-visual canvas")).toHaveCount(1);
  await expect(page.locator(".tradel-logo")).toHaveCount(3);

  const visibleCopy = await page.locator("body").innerText();
  expect(visibleCopy).not.toMatch(/\bwalbi\b/i);
  expect(failedResponses).toEqual([]);
  expect(failedRequests).toEqual([]);
});

test("keeps the page within the responsive viewport", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("education and SEO controls remain interactive", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");

  const toggles = page.locator(".blog-toggle__link");
  await expect(toggles).toHaveCount(2);
  await toggles.nth(1).click();
  await expect(toggles.nth(1)).toHaveClass(/active/);

  const showMore = page.locator(".seo-show-button").first();
  const seoWrapper = page.locator(".seo-wrapper").first();
  const collapsedHeight = await seoWrapper.evaluate(
    (element) => element.getBoundingClientRect().height,
  );
  await showMore.click();
  await page.waitForTimeout(600);
  const expandedHeight = await seoWrapper.evaluate(
    (element) => element.getBoundingClientRect().height,
  );
  expect(expandedHeight).toBeGreaterThan(collapsedHeight);
});

test("mobile menu opens and closes", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"));

  await page.goto("/");
  const menuButton = page.locator(".menu-btn");
  const menu = page.locator(".menu-w");

  await menuButton.click();
  await expect(menu).toHaveAttribute("aria-hidden", "false", {
    timeout: 2_000,
  });
  await expect(menu).toBeVisible();

  await menuButton.click();
  await expect(menu).toHaveAttribute("aria-hidden", "true", {
    timeout: 2_000,
  });
});

test("process story advances through all four visible states", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");

  const process = page.locator(".process-section");
  const texts = process.locator(".process-text");
  const counter = process.locator("[data-progress-nr]");
  const metrics = await process.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      viewport: window.innerHeight,
    };
  });
  const checkpoints = [
    {
      index: 0,
      label: /I SEE/,
      scroll: metrics.top + metrics.viewport * 1.1,
    },
    { index: 1, label: /I READ/, scroll: metrics.top + metrics.viewport * 1.8 },
    {
      index: 2,
      label: /I THINK/,
      scroll: metrics.top + metrics.viewport * 2.8,
    },
    { index: 3, label: /I ACT/, scroll: metrics.top + metrics.viewport * 3.8 },
  ];

  for (const checkpoint of checkpoints) {
    await page.evaluate(
      (scroll) => window.scrollTo(0, scroll),
      checkpoint.scroll,
    );
    await page.waitForTimeout(250);

    await expect(counter).toHaveText(`0${checkpoint.index + 1}`);
    await expect(texts.nth(checkpoint.index)).toHaveCSS("opacity", "1");
    await expect(texts.nth(checkpoint.index)).toHaveCSS(
      "visibility",
      "visible",
    );
    await expect(
      texts.nth(checkpoint.index).locator(".process-title .line").first(),
    ).toHaveCSS("opacity", "1");
    await expect(
      texts.nth(checkpoint.index).locator(".process-title .line").first(),
    ).toHaveCSS("visibility", "visible");
    await expect(texts.nth(checkpoint.index)).toContainText(checkpoint.label);
  }
});

test("support sequence animates in view and pauses out of view", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");

  const support = page.locator("#support");
  const canvas = support.locator("canvas");
  const checksum = () =>
    canvas.evaluate((element) => {
      const target = element as HTMLCanvasElement;
      const context = target.getContext("2d");
      if (!context) return 0;
      const pixels = context.getImageData(
        0,
        0,
        target.width,
        target.height,
      ).data;
      let hash = 2166136261;
      for (let index = 0; index < pixels.length; index += 401) {
        hash ^= pixels[index] ?? 0;
        hash = Math.imul(hash, 16777619);
      }
      return hash >>> 0;
    });

  await support.scrollIntoViewIfNeeded();
  await expect.poll(checksum).not.toBe(0);
  const movingStart = await checksum();
  await page.waitForTimeout(450);
  const movingEnd = await checksum();
  expect(movingEnd).not.toBe(movingStart);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  const pausedStart = await checksum();
  await page.waitForTimeout(450);
  const pausedEnd = await checksum();
  expect(pausedEnd).toBe(pausedStart);
});
