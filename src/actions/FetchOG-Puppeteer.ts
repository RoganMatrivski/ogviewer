"use server";

import puppeteer, { type Browser } from "@cloudflare/puppeteer";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { OGMeta } from "@/types/OpenGraph";

/**
 * Fetches OpenGraph metadata using Cloudflare Workers Browser Rendering (Puppeteer binding).
 * Uses `getCloudflareContext()` to retrieve the `BROWSER` binding defined in `wrangler.toml`.
 */
export async function getOGWithPuppeteer(targetUrl: string): Promise<OGMeta> {
	let browser: Browser | null = null;

	try {
		// Retrieve Cloudflare environment bindings
		const { env } = getCloudflareContext();
		const browserBinding = (env as unknown as CloudflareEnv)?.BROWSER;

		if (!browserBinding) {
			throw new Error(
				"Cloudflare Workers Browser binding 'BROWSER' is not available in the current context.",
			);
		}

		// Launch a browser instance via Cloudflare Browser Rendering API
		browser = await puppeteer.launch(browserBinding);

		const page = await browser.newPage();

		// Configure viewport and User-Agent
		await page.setViewport({ width: 1280, height: 800 });
		await page.setUserAgent(
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
		);

		// Optimize loading speed by aborting unnecessary media/font requests
		await page.setRequestInterception(true);
		page.on(
			"request",
			(req: { resourceType(): string; abort(): void; continue(): void }) => {
				const resourceType = req.resourceType();
				if (["media", "font"].includes(resourceType)) {
					req.abort();
				} else {
					req.continue();
				}
			},
		);

		// Navigate to target URL
		await page.goto(targetUrl, {
			waitUntil: "domcontentloaded",
			timeout: 15000,
		});

		// Extract OpenGraph and meta tags inside browser context
		const meta = await page.evaluate(() => {
			const getMeta = (names: string[]): string | null => {
				for (const name of names) {
					// Query exact attribute or lowercased version
					const el = document.querySelector(
						`meta[property="${name}" i], meta[name="${name}" i]`,
					);
					if (el) {
						const content = el.getAttribute("content");
						if (content?.trim()) return content.trim();
					}
				}
				return null;
			};

			const getCanonical = (): string | null => {
				const link = document.querySelector('link[rel="canonical" i]');
				return link ? link.getAttribute("href") : null;
			};

			const title =
				getMeta(["og:title", "twitter:title"]) ||
				document.title ||
				getMeta(["title"]) ||
				null;

			const description =
				getMeta(["og:description", "twitter:description", "description"]) ||
				null;

			const image =
				getMeta([
					"og:image",
					"og:image:url",
					"og:image:secure_url",
					"twitter:image",
					"twitter:image:src",
				]) || null;

			const url =
				getMeta(["og:url"]) || getCanonical() || window.location.href || null;

			const video =
				getMeta([
					"og:video",
					"og:video:url",
					"og:video:secure_url",
					"twitter:player",
				]) || null;

			return { title, description, image, url, video };
		});

		if (!meta.url) {
			meta.url = targetUrl;
		}

		return meta;
	} finally {
		if (browser) {
			await browser.close().catch((err: unknown) => {
				console.warn("[FetchOG-Puppeteer] Error closing browser:", err);
			});
		}
	}
}

export default getOGWithPuppeteer;
