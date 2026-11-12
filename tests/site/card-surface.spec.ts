import { expect, type Locator, type Page, test } from "@playwright/test";

// Optional showcase pages are disabled in this checkout. Exercise its actual
// content and persistent shell instead of their 404 redirects.
const shellCards = [
	"#sidebar .m3-profile",
	'widget-layout[data-id="categories"] > .m3-card',
	'widget-layout[data-id="tags"] > .m3-card',
] as const;
const postCard = "#swup-container .m3-blog-postcard";
const articleCards = [".post-card", ".last-updated-notice"] as const;

async function waitForTheme(page: Page, dark: boolean) {
	await page.waitForFunction((expectedDark) => {
		const root = document.documentElement;
		return (
			root.classList.contains("dark") === expectedDark &&
			getComputedStyle(root).getPropertyValue("--mc-primary").trim() &&
			[...document.querySelectorAll<HTMLElement>(".onload-animation")].every(
				(element) =>
					element.offsetParent === null ||
					getComputedStyle(element).opacity === "1",
			)
		);
	}, dark);
}

async function surface(card: Locator) {
	return card.evaluate((element) => {
		const style = getComputedStyle(element);
		// Normalize rgb() and color(srgb ... / alpha) through the browser.
		const canvas = document.createElement("canvas");
		canvas.width = canvas.height = 1;
		const context = canvas.getContext("2d");
		if (!context) throw new Error("2D canvas is required for color assertions");
		context.fillStyle = style.backgroundColor;
		context.fillRect(0, 0, 1, 1);
		const color = [...context.getImageData(0, 0, 1, 1).data];
		context.clearRect(0, 0, 1, 1);
		context.fillStyle = style.color;
		context.fillRect(0, 0, 1, 1);
		return {
			color,
			textAlpha: context.getImageData(0, 0, 1, 1).data[3],
			opacity: style.opacity,
			shadow: style.boxShadow,
			filter: style.backdropFilter,
		};
	});
}

async function expectFlatCard(card: Locator) {
	await expect(card).toBeVisible();
	await expect.poll(async () => (await surface(card)).filter).toBe("none");
	await expect.poll(async () => (await surface(card)).shadow).toBe("none");
	await expect(card).toHaveCSS("opacity", "1");
	expect((await surface(card)).textAlpha, "card text remains opaque").toBe(255);
}

async function expectTranslucent(card: Locator, alpha = 191) {
	await expectFlatCard(card);
	await expect
		.poll(async () => Math.abs((await surface(card)).color[3] - alpha))
		.toBeLessThanOrEqual(1);
}

async function expectReadable(card: Locator) {
	const measurements = await card.evaluate((element) => {
		const canvas = document.createElement("canvas");
		canvas.width = canvas.height = 1;
		const context = canvas.getContext("2d");
		if (!context)
			throw new Error("2D canvas is required for contrast assertions");
		const pixels = (color: string) => {
			context.clearRect(0, 0, 1, 1);
			context.fillStyle = color;
			context.fillRect(0, 0, 1, 1);
			return [...context.getImageData(0, 0, 1, 1).data];
		};
		const composite = (front: number[], back: number[]) => {
			const alpha = front[3] / 255;
			return front
				.slice(0, 3)
				.map((value, i) => value * alpha + back[i] * (1 - alpha));
		};
		const luminance = (rgb: number[]) => {
			const linear = rgb.map((value) => {
				const channel = value / 255;
				return channel <= 0.04045
					? channel / 12.92
					: ((channel + 0.055) / 1.055) ** 2.4;
			});
			return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
		};
		const background = pixels(getComputedStyle(element).backgroundColor);
		const probe = document.createElement("span");
		element.append(probe);
		const results: { token: string; backdrop: string; ratio: number }[] = [];
		for (const token of ["--on-surface", "--on-surface-variant"]) {
			probe.style.color = `var(${token})`;
			const foreground = pixels(getComputedStyle(probe).color);
			// Called only for the opaque reduced-transparency fallback, whose
			// text contrast must remain independent of wallpaper content.
			for (const backdrop of [
				"#000000",
				"#ffffff",
				"#ff0000",
				"#00ff00",
				"#0000ff",
			]) {
				const displayedBackground = composite(background, pixels(backdrop));
				const displayedText = composite(foreground, displayedBackground);
				const a = luminance(displayedText);
				const b = luminance(displayedBackground);
				results.push({
					token,
					backdrop,
					ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
				});
			}
		}
		probe.remove();
		return results;
	});
	for (const { token, backdrop, ratio } of measurements) {
		expect(
			ratio,
			`${token} over card composited on ${backdrop}`,
		).toBeGreaterThanOrEqual(4.5);
	}
}

for (const theme of ["light", "dark"] as const) {
	test.describe(`translucent cards (${theme})`, () => {
		test.beforeEach(async ({ page }) => {
			await page.emulateMedia({ reducedMotion: "reduce" });
			await page.addInitScript(
				(mode) => localStorage.setItem("theme", mode),
				theme,
			);
			await page.route("https://api.github.com/**", (route) =>
				route.fulfill({ status: 503, body: "Unavailable" }),
			);
			await page.goto("/", { waitUntil: "domcontentloaded" });
			await waitForTheme(page, theme === "dark");
		});

		test("keeps content and persistent shell translucent on direct and Swup visits", async ({
			page,
		}) => {
			test.setTimeout(90_000);
			for (const selector of [postCard, ...shellCards]) {
				const card = page.locator(selector).first();
				await expect(card).toBeVisible();
				await expectTranslucent(card);
			}
			const href = await page
				.locator(`${postCard} .m3-blog-postcard__title`)
				.first()
				.getAttribute("href");
			expect(
				href,
				"a real article must exist in the configured content",
			).toBeTruthy();
			if (!href) throw new Error("No article href found");
			await page.goto(href, { waitUntil: "domcontentloaded" });
			const noticeAge = await page
				.locator("[data-last-updated-notice]")
				.evaluate((element) => ({
					date: element.getAttribute("data-last-updated-date"),
					minimumAgeDays: Number(element.getAttribute("data-minimum-age-days")),
				}));
			expect(noticeAge.date).toBeTruthy();
			expect(Number.isFinite(noticeAge.minimumAgeDays)).toBe(true);
			// SSR uses server time, while the runtime recalculates visibility on
			// initial load and Swup replacement. Fix Date beyond this article's
			// threshold, then reload to exercise that contract with a visible note.
			await page.clock.setFixedTime(
				new Date(
					Date.parse(noticeAge.date ?? "") +
						(noticeAge.minimumAgeDays + 1) * 86_400_000,
				),
			);
			await page.reload({ waitUntil: "domcontentloaded" });
			await expect(page.locator("[data-last-updated-notice]")).toBeVisible();
			await waitForTheme(page, theme === "dark");
			await expect(page.locator("#swup-container")).toHaveAttribute(
				"data-current-page",
				"post",
			);
			for (const selector of [...articleCards, ...shellCards])
				await expectTranslucent(page.locator(selector).first());
			for (const card of await page.locator(".post-card, .post-nav").all()) {
				await expectTranslucent(card);
				await card.hover();
				// Interactive Card retains its 4% tonal state layer on hover; its
				// default background alpha is asserted before entering that state.
				await expectFlatCard(card);
			}

			await page.waitForFunction(() => Boolean(window.swup));
			await page.evaluate(() => {
				document.documentElement.dataset.cardNavigation = "preserved";
			});
			const profile = await page
				.locator("#sidebar .m3-profile")
				.elementHandle();
			await page.locator('#top-row a[href="/"]').first().click();
			await expect(page.locator("#swup-container")).toHaveAttribute(
				"data-current-page",
				"home",
			);
			await waitForTheme(page, theme === "dark");
			await expect(page.locator("html")).toHaveAttribute(
				"data-card-navigation",
				"preserved",
			);
			expect(await profile?.evaluate((element) => element.isConnected)).toBe(
				true,
			);
			for (const selector of [postCard, ...shellCards])
				await expectTranslucent(page.locator(selector).first());

			await page
				.locator(`${postCard} .m3-blog-postcard__title`)
				.first()
				.click();
			await expect(page).toHaveURL(new URL(href, page.url()).href);
			await expect(page.locator("#swup-container")).toHaveAttribute(
				"data-current-page",
				"post",
			);
			await waitForTheme(page, theme === "dark");
			await expect(page.locator("html")).toHaveAttribute(
				"data-card-navigation",
				"preserved",
			);
			for (const selector of [...articleCards, ...shellCards])
				await expectTranslucent(page.locator(selector).first());
		});

		test("adjusts background opacity globally and responds to the live primary color", async ({
			page,
		}) => {
			const cards = [postCard, ...shellCards].map((selector) =>
				page.locator(selector).first(),
			);
			for (const card of cards) {
				await expectTranslucent(card);
				await card.hover();
				await expectFlatCard(card);
			}
			await page.mouse.move(0, 0);
			await page.evaluate(() => {
				document.documentElement.style.setProperty("--card-opacity", "50%");
			});
			for (const card of cards) await expectTranslucent(card, 128);
			await page.evaluate(() => {
				document.documentElement.style.setProperty("--card-opacity", "75%");
			});
			for (const card of cards) await expectTranslucent(card);
			await page.evaluate(() => {
				document.documentElement.style.setProperty(
					"--mc-primary",
					"rgb(220, 30, 90)",
				);
			});
			for (const card of cards) {
				await card.evaluate(async (element) => {
					getComputedStyle(element).backgroundColor;
					await Promise.all(
						element
							.getAnimations()
							.map((animation) => animation.finished.catch(() => {})),
					);
				});
			}
			const red = await Promise.all(cards.map(surface));
			await page.evaluate(() => {
				document.documentElement.style.setProperty(
					"--mc-primary",
					"rgb(30, 90, 220)",
				);
			});
			for (const [i, card] of cards.entries()) {
				await expect
					.poll(async () => (await surface(card)).color.slice(0, 3))
					.not.toEqual(red[i].color.slice(0, 3));
				await expectTranslucent(card);
			}
		});

		test("uses opaque unblurred surfaces when transparency is reduced", async ({
			page,
			context,
		}) => {
			const cdp = await context.newCDPSession(page);
			await cdp.send("Emulation.setEmulatedMedia", {
				features: [
					{ name: "prefers-reduced-transparency", value: "reduce" },
					{ name: "prefers-reduced-motion", value: "reduce" },
				],
			});
			await expect
				.poll(() =>
					page.evaluate(
						() => matchMedia("(prefers-reduced-transparency: reduce)").matches,
					),
				)
				.toBe(true);
			for (const selector of [postCard, ...shellCards]) {
				const card = page.locator(selector).first();
				await expectTranslucent(card, 255);
				await expect.poll(async () => (await surface(card)).color[3]).toBe(255);
				await expectReadable(card);
			}
			// Restore the preference without a reload to check live media updates.
			await cdp.send("Emulation.setEmulatedMedia", {
				features: [{ name: "prefers-reduced-motion", value: "reduce" }],
			});
			for (const selector of [postCard, ...shellCards])
				await expectTranslucent(page.locator(selector).first());
			await cdp.detach();
		});
	});
}
