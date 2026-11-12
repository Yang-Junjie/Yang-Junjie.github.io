import { expect, type Page, test } from "@playwright/test";

async function ready(page: Page) {
	await page.waitForFunction(
		() =>
			getComputedStyle(document.documentElement)
				.getPropertyValue("--mc-primary")
				.trim() &&
			[...document.querySelectorAll<HTMLElement>(".onload-animation")].every(
				(element) =>
					element.offsetParent === null ||
					getComputedStyle(element).opacity === "1",
			),
	);
}

async function expectBackground(page: Page) {
	const layer = page.locator("#page-background");
	await expect(layer).toHaveCount(1);
	await expect(layer).toHaveAttribute("aria-hidden", "true");
	await expect(layer).toHaveCSS("position", "fixed");
	await expect(layer).toHaveCSS("pointer-events", "none");
	expect(
		await layer.evaluate((element) => Number(getComputedStyle(element).zIndex)),
	).toBeLessThan(0);
	for (const edge of ["top", "right", "bottom", "left"] as const) {
		await expect(layer).toHaveCSS(edge, "0px");
	}
	const image = layer.locator("img");
	await expect(image).toHaveAttribute(
		"src",
		"/images/backgrounds/academy.webp",
	);
	await expect(image).toHaveAttribute("alt", "");
	await expect(image).toHaveCSS("object-fit", "cover");
	await expect(image).toHaveCSS("object-position", "65% 50%");
	await expect
		.poll(() =>
			image.evaluate(
				(element: HTMLImageElement) =>
					element.complete && element.naturalWidth > 0,
			),
		)
		.toBe(true);
	const bounds = await layer.evaluate((element) => {
		const rect = element.getBoundingClientRect();
		const imageRect = element.querySelector("img")?.getBoundingClientRect();
		return {
			x: rect.x,
			y: rect.y,
			width: rect.width,
			height: rect.height,
			imageWidth: imageRect?.width,
			imageHeight: imageRect?.height,
			viewportWidth: window.innerWidth,
			viewportHeight: window.innerHeight,
		};
	});
	expect(bounds.x).toBe(0);
	expect(bounds.y).toBe(0);
	expect(bounds.width).toBeGreaterThanOrEqual(bounds.viewportWidth);
	expect(bounds.height).toBe(bounds.viewportHeight);
	expect(bounds.imageWidth).toBe(bounds.width);
	expect(bounds.imageHeight).toBe(bounds.height);
	await expect(page.locator("#m3e-texture-canvas")).toHaveCount(0);
	await expect(
		page.locator(
			"[data-texture-preset], [data-texture-opacity], [data-texture-enabled]",
		),
	).toHaveCount(0);
	await expect(
		page.getByRole("radiogroup", { name: "背景纹理", includeHidden: true }),
	).toHaveCount(0);
	await expect(
		page.getByRole("radiogroup", { name: "页面背景", includeHidden: true }),
	).toHaveCount(0);
}

async function firstArticle(page: Page) {
	const href = await page
		.locator(".m3-blog-postcard__title")
		.first()
		.getAttribute("href");
	if (!href) throw new Error("The configured content must provide an article");
	return href;
}

test.beforeEach(async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.route("https://api.github.com/**", (route) =>
		route.fulfill({ status: 503, body: "Unavailable" }),
	);
});

test("fixed background survives direct articles, scrolling, and Swup in light and dark", async ({
	page,
}) => {
	test.setTimeout(90_000);
	for (const theme of ["light", "dark"]) {
		await page.goto("/", { waitUntil: "domcontentloaded" });
		await page.evaluate((mode) => localStorage.setItem("theme", mode), theme);
		await page.reload({ waitUntil: "domcontentloaded" });
		await ready(page);
		await expect(page.locator("html")).toHaveClass(
			theme === "dark" ? /\bdark\b/ : /^(?!.*\bdark\b)/,
		);
		await expectBackground(page);
		const href = await firstArticle(page);
		await page.goto(href, { waitUntil: "domcontentloaded" });
		await ready(page);
		await expect(page.locator("#swup-container")).toHaveAttribute(
			"data-current-page",
			"post",
		);
		await expectBackground(page);
		const layer = await page.locator("#page-background").elementHandle();
		await page.evaluate(() =>
			window.scrollTo(0, document.documentElement.scrollHeight),
		);
		await expect
			.poll(() => page.evaluate(() => window.scrollY))
			.toBeGreaterThan(0);
		await expectBackground(page);
		await page.waitForFunction(() => Boolean(window.swup));
		await page.locator('#top-row a[href="/"]').first().click();
		await expect(page.locator("#swup-container")).toHaveAttribute(
			"data-current-page",
			"home",
		);
		await ready(page);
		expect(await layer?.evaluate((element) => element.isConnected)).toBe(true);
		await page.locator(".m3-blog-postcard__title").first().click();
		await expect(page).toHaveURL(new URL(href, page.url()).href);
		await expect(page.locator("#swup-container")).toHaveAttribute(
			"data-current-page",
			"post",
		);
		await ready(page);
		expect(await layer?.evaluate((element) => element.isConnected)).toBe(true);
		await expectBackground(page);
	}
});

test("background covers mobile viewport without horizontal overflow", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.addInitScript(() => localStorage.setItem("theme", "dark"));
	await page.goto("/", { waitUntil: "domcontentloaded" });
	await ready(page);
	await expectBackground(page);
	await page.evaluate(() => window.scrollTo(0, 600));
	await expect
		.poll(() => page.evaluate(() => window.scrollY))
		.toBeGreaterThan(0);
	await expectBackground(page);
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth - window.innerWidth,
		),
	).toBeLessThanOrEqual(1);
});

test.describe("without JavaScript", () => {
	test.use({ javaScriptEnabled: false });
	test("renders the decorative background on home and a real article", async ({
		page,
	}) => {
		await page.goto("/", { waitUntil: "domcontentloaded" });
		await ready(page);
		await expectBackground(page);
		const href = await firstArticle(page);
		await page.goto(href, { waitUntil: "domcontentloaded" });
		await ready(page);
		await expect(page.locator("#swup-container")).toHaveAttribute(
			"data-current-page",
			"post",
		);
		await expectBackground(page);
	});
});
