"use server";

import puppeteer, { type Browser } from "@cloudflare/puppeteer";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Default cache duration in seconds for cookies: 1 hour (3,600s). Minimum Cloudflare KV TTL is 60s. */
const DEFAULT_COOKIE_CACHE_TTL = 60 * 60;

export interface CookieItem {
	name: string;
	value: string;
	domain?: string;
	path?: string;
	expires?: number;
	httpOnly?: boolean;
	secure?: boolean;
	sameSite?: string;
}

export interface FetchCookiesResult {
	/** Formatted cookie header string ready to be sent with HTTP fetch (e.g. "key1=val1; key2=val2") */
	cookieHeader: string;
	/** Raw list of cookie objects returned from Puppeteer */
	cookies: CookieItem[];
	/** User-Agent header string used by Puppeteer browser session */
	userAgent: string;
}

export interface FetchCookiesPuppeteerOptions {
	/** Custom cache TTL in seconds for KV caching. Defaults to 3600 (1h). Min 60s. */
	cacheTtlSeconds?: number;
	/** Force bypassing KV cache reading (will still store new result if KV is available). */
	bypassCache?: boolean;
	/** Custom User-Agent to set on the Puppeteer browser page. */
	userAgent?: string;

	// ─── Wait options ───
	/** Time to wait in milliseconds after page navigation before retrieving cookies. */
	waitForMs?: number;
	/** Time to wait in milliseconds after page navigation before retrieving cookies (alias for waitForMs). */
	waitMs?: number;
	/** Time to wait in seconds after page navigation before retrieving cookies. */
	waitForSeconds?: number;

	/** CSS selector to wait for before retrieving cookies (e.g. "#app" or "meta[property='og:title']"). */
	waitForSelector?: string;
	/** CSS selector to wait for before retrieving cookies (alias for waitForSelector). */
	waitSelector?: string;
	/** Maximum time in milliseconds to wait for the CSS selector. Defaults to 10000 (10s). */
	waitForSelectorTimeoutMs?: number;

	/** JavaScript function body or expression string to wait for in page context. */
	waitForFunction?: string;
	/** Maximum time in milliseconds to wait for the custom function. Defaults to 10000 (10s). */
	waitForFunctionTimeoutMs?: number;

	/** Wait until network becomes idle before retrieving cookies. */
	waitForNetworkIdle?: boolean | { idleTime?: number; timeout?: number };

	/** Wait until navigation event condition (e.g. 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2'). Defaults to 'domcontentloaded'. */
	waitUntil?: "load" | "domcontentloaded" | "networkidle0" | "networkidle2";
}

/**
 * Opens a domain using Cloudflare Workers Browser Rendering (Puppeteer binding),
 * waits for page conditions/selectors, and extracts session cookies formatted for fetch().
 */
export async function getCookiesWithPuppeteer(
	targetUrl: string,
	options?: FetchCookiesPuppeteerOptions,
): Promise<FetchCookiesResult> {
	const ttlSeconds =
		options?.cacheTtlSeconds ??
		(process.env.OG_COOKIE_CACHE_TTL_SECONDS
			? Number.parseInt(process.env.OG_COOKIE_CACHE_TTL_SECONDS, 10)
			: DEFAULT_COOKIE_CACHE_TTL);

	// Safe retrieval of Cloudflare env bindings
	let cfEnv: CloudflareEnv | undefined;
	try {
		cfEnv = getCloudflareContext().env as unknown as CloudflareEnv;
	} catch {
		// Environment bindings not available (e.g. non-Workers runtime)
	}

	const kv = cfEnv?.OG_CACHE;
	const parsedUrl = new URL(targetUrl);
	const cacheKey = `og:cookies:${parsedUrl.hostname}`;

	// ─── 1. KV Cache Read ───────────────────────────────────────────────────
	if (kv && !options?.bypassCache) {
		try {
			const cached = await kv.get<FetchCookiesResult>(cacheKey, "json");
			if (cached) {
				console.log(
					`[FetchCookies-Puppeteer] KV cache hit for ${parsedUrl.hostname}`,
				);
				return cached;
			}
		} catch (kvReadErr) {
			console.warn(
				`[FetchCookies-Puppeteer] Failed to read KV cache for ${parsedUrl.hostname}:`,
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

		browser = await puppeteer.launch(browserBinding);
		const page = await browser.newPage();

		const defaultUserAgent =
			options?.userAgent ??
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

		await page.setViewport({ width: 1280, height: 800 });
		await page.setUserAgent(defaultUserAgent);

		// Navigate to target URL
		await page.goto(targetUrl, {
			waitUntil: options?.waitUntil ?? "domcontentloaded",
			timeout: 15000,
		});

		// ─── Optional Waits ───
		// 1. Wait for CSS selector if specified
		const selector = options?.waitForSelector ?? options?.waitSelector;
		if (selector) {
			const selectorTimeout = options?.waitForSelectorTimeoutMs ?? 10000;
			try {
				await page.waitForSelector(selector, { timeout: selectorTimeout });
			} catch (selectorErr) {
				console.warn(
					`[FetchCookies-Puppeteer] Timeout waiting for selector "${selector}" on ${targetUrl}:`,
					selectorErr,
				);
			}
		}

		// 2. Wait for custom JS function if specified
		if (options?.waitForFunction) {
			const fnTimeout = options?.waitForFunctionTimeoutMs ?? 10000;
			try {
				await page.waitForFunction(options.waitForFunction, {
					timeout: fnTimeout,
				});
			} catch (fnErr) {
				console.warn(
					`[FetchCookies-Puppeteer] Timeout waiting for function on ${targetUrl}:`,
					fnErr,
				);
			}
		}

		// 3. Wait for network idle if requested
		if (options?.waitForNetworkIdle) {
			try {
				const idleOptions =
					typeof options.waitForNetworkIdle === "object"
						? options.waitForNetworkIdle
						: { idleTime: 500, timeout: 10000 };
				await page.waitForNetworkIdle(idleOptions);
			} catch (netErr) {
				console.warn(
					`[FetchCookies-Puppeteer] Timeout waiting for network idle on ${targetUrl}:`,
					netErr,
				);
			}
		}

		// 4. Optional delay (in milliseconds or seconds) before retrieving cookies
		const waitMs =
			options?.waitForMs ??
			options?.waitMs ??
			(options?.waitForSeconds !== undefined
				? options.waitForSeconds * 1000
				: 0);

		if (waitMs > 0) {
			await new Promise((resolve) => setTimeout(resolve, waitMs));
		}

		// Retrieve all cookies for the loaded domain
		const rawCookies = await page.cookies();
		const formattedCookies: CookieItem[] = rawCookies.map((c) => ({
			name: c.name,
			value: c.value,
			domain: c.domain,
			path: c.path,
			expires: c.expires,
			httpOnly: c.httpOnly,
			secure: c.secure,
			sameSite: c.sameSite,
		}));

		const cookieHeader = formattedCookies
			.map((c) => `${c.name}=${c.value}`)
			.join("; ");

		const userAgent = await page
			.evaluate(() => navigator.userAgent)
			.catch(() => defaultUserAgent);

		const result: FetchCookiesResult = {
			cookieHeader,
			cookies: formattedCookies,
			userAgent,
		};

		// ─── 3. KV Cache Write ──────────────────────────────────────────────
		if (kv && formattedCookies.length > 0) {
			try {
				const effectiveTtl = Math.max(60, ttlSeconds);
				await kv.put(cacheKey, JSON.stringify(result), {
					expirationTtl: effectiveTtl,
				});
				console.log(
					`[FetchCookies-Puppeteer] Cached cookies in KV for ${parsedUrl.hostname} (TTL: ${effectiveTtl}s)`,
				);
			} catch (kvWriteErr) {
				console.warn(
					`[FetchCookies-Puppeteer] Failed to write KV cache for ${parsedUrl.hostname}:`,
					kvWriteErr,
				);
			}
		}

		return result;
	} finally {
		if (browser) {
			await browser.close().catch((err: unknown) => {
				console.warn("[FetchCookies-Puppeteer] Error closing browser:", err);
			});
		}
	}
}

/**
 * Helper that obtains domain cookies via Puppeteer, then performs an HTTP fetch() using those cookies.
 */
export async function fetchWithPuppeteerCookies(
	targetUrl: string,
	fetchOptions?: RequestInit,
	puppeteerOptions?: FetchCookiesPuppeteerOptions,
): Promise<Response> {
	const { cookieHeader, userAgent } = await getCookiesWithPuppeteer(
		targetUrl,
		puppeteerOptions,
	);

	const headers = new Headers(fetchOptions?.headers);
	if (cookieHeader && !headers.has("Cookie")) {
		headers.set("Cookie", cookieHeader);
	}
	if (userAgent && !headers.has("User-Agent")) {
		headers.set("User-Agent", userAgent);
	}

	return fetch(targetUrl, {
		...fetchOptions,
		headers,
	});
}

export default getCookiesWithPuppeteer;
