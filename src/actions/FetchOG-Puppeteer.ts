"use server";

import puppeteer, { type Browser } from "@cloudflare/puppeteer";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { OGMeta } from "@/types/OpenGraph";

/** Default cache duration in seconds: 24 hours (86,400s). Minimum Cloudflare KV TTL is 60s. */
const DEFAULT_OG_PUPPETEER_CACHE_TTL = 86400;

export interface FetchOGPuppeteerOptions {
	/** Custom cache TTL in seconds for KV caching. Defaults to 86400 (24h). Min 60s. */
	cacheTtlSeconds?: number;
	/** Force bypassing KV cache reading (will still store new result if KV is available). */
	bypassCache?: boolean;
}

/**
 * Fetches OpenGraph metadata using Cloudflare Workers Browser Rendering (Puppeteer binding).
 * Caches results in the Cloudflare KV namespace `OG_CACHE` if available.
 */
export async function getOGWithPuppeteer(
	targetUrl: string,
	options?: FetchOGPuppeteerOptions,
): Promise<OGMeta> {
	const ttlSeconds =
		options?.cacheTtlSeconds ??
		(process.env.OG_CACHE_TTL_SECONDS
			? Number.parseInt(process.env.OG_CACHE_TTL_SECONDS, 10)
			: DEFAULT_OG_PUPPETEER_CACHE_TTL);

	// Safe retrieval of Cloudflare env bindings
	let cfEnv: CloudflareEnv | undefined;
	try {
		cfEnv = getCloudflareContext().env as unknown as CloudflareEnv;
	} catch {
		// Environment bindings not available (e.g. non-Workers runtime)
	}

	const kv = cfEnv?.OG_CACHE;
	const cacheKey = `og:puppeteer:${targetUrl}`;

	// ─── 1. KV Cache Read ───────────────────────────────────────────────────
	if (kv && !options?.bypassCache) {
		try {
			const cached = await kv.get<OGMeta>(cacheKey, "json");
			if (cached) {
				console.log(`[FetchOG-Puppeteer] KV cache hit for ${targetUrl}`);
				return cached;
			}
		} catch (kvReadErr) {
			console.warn(
				`[FetchOG-Puppeteer] Failed to read KV cache for ${targetUrl}:`,
				kvReadErr,
			);
		}
	}

	// ─── 2. Puppeteer Execution ─────────────────────────────────────────────
	let browser: Browser | null = null;

	try {
		const browserBinding = cfEnv?.BROWSER;

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

		// ─── 3. KV Cache Write ──────────────────────────────────────────────
		if (kv && meta && (meta.title || meta.image)) {
			try {
				// Cloudflare KV requires minimum expirationTtl of 60 seconds
				const effectiveTtl = Math.max(60, ttlSeconds);
				await kv.put(cacheKey, JSON.stringify(meta), {
					expirationTtl: effectiveTtl,
				});
				console.log(
					`[FetchOG-Puppeteer] Cached result in KV for ${targetUrl} (TTL: ${effectiveTtl}s)`,
				);
			} catch (kvWriteErr) {
				console.warn(
					`[FetchOG-Puppeteer] Failed to write KV cache for ${targetUrl}:`,
					kvWriteErr,
				);
			}
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
