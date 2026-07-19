import { expect, test } from "@playwright/test";

test("hero visual remains stable", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => window.scrollTo(0, 0));

  await expect(page).toHaveScreenshot("hero.png", {
    animations: "disabled",
    fullPage: false,
  });
});

test("section geometry matches the frozen homepage composition", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  await page.evaluate(() => document.fonts.ready);

  const geometry = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll("main > section"));
    const measure = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        height: rect.height,
        top: rect.top + window.scrollY,
      };
    };

    return {
      bodyHeight: document.body.getBoundingClientRect().height,
      landmarks: {
        agent: measure("#agent"),
        community: measure("#community"),
        education: measure("#education"),
        footer: measure("footer"),
        hero: measure("main > section:first-of-type"),
        intro: measure("#ai"),
        outro: measure("#process-end"),
        process: measure("#process"),
        support: measure("#support"),
      },
      sections: sections.map((section) => ({
        height: section.getBoundingClientRect().height,
        top: section.getBoundingClientRect().top + window.scrollY,
      })),
    };
  });

  expect(geometry.sections.length).toBeGreaterThanOrEqual(14);

  const expected = testInfo.project.name.includes("desktop")
    ? {
        bodyHeight: 17_211,
        landmarks: {
          agent: { height: 2_817, top: 2_633 },
          community: { height: 1_021, top: 9_950 },
          education: { height: 1_195, top: 10_971 },
          footer: { height: 725, top: 16_486 },
          hero: { height: 900, top: 81 },
          intro: { height: 534, top: 885 },
          outro: { height: 900, top: 9_050 },
          process: { height: 4_500, top: 4_550 },
          support: { height: 983, top: 13_195 },
        },
      }
    : testInfo.project.name.includes("mobile")
      ? {
          bodyHeight: 17_912,
          landmarks: {
            agent: { height: 2_790, top: 2_669 },
            community: { height: 835, top: 9_679 },
            education: { height: 2_200, top: 10_514 },
            footer: { height: 1_053, top: 16_859 },
            hero: { height: 844, top: 63 },
            intro: { height: 570, top: 758 },
            outro: { height: 844, top: 8_835 },
            process: { height: 4_220, top: 4_615 },
            support: { height: 1_074, top: 13_597 },
          },
        }
      : null;

  if (expected) {
    expect(Math.abs(geometry.bodyHeight - expected.bodyHeight)).toBeLessThan(8);

    for (const [name, expectedRect] of Object.entries(expected.landmarks)) {
      const actualRect =
        geometry.landmarks[name as keyof typeof geometry.landmarks];
      expect(actualRect, `${name} should exist`).not.toBeNull();
      expect(
        Math.abs(actualRect!.top - expectedRect.top),
        `${name} top`,
      ).toBeLessThan(2);
      expect(
        Math.abs(actualRect!.height - expectedRect.height),
        `${name} height`,
      ).toBeLessThan(2);
    }
  }
});
