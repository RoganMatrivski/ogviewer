import fetchRetry from "fetch-retry";
import type { OGMeta } from "@/types/OpenGraph";

const fetch = fetchRetry(global.fetch);

// ─── Regex-based fallback parser ────────────────────────────────────────────
// Used in runtimes that don't have native HTMLRewriter (e.g. Next.js Node SSR).
// Only needs to handle <title>, <meta>, and <link rel="canonical"> — no full DOM.

function parseOGFromHTML(html: string): OGMeta {
	const meta: OGMeta = {
		title: null,
		description: null,
		image: null,
		url: null,
		video: null,
	};

	// <title>...</title>
	const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
	const fallbackTitle = titleMatch ? titleMatch[1].trim() : null;

	// <meta property="..." content="..."> or <meta name="..." content="...">
	// Handles any attribute order and single/double quotes.
	for (const m of html.matchAll(/<meta\s+([^>]+?)(?:\s*\/)?>/gi)) {
		const attrs = m[1];
		const prop = attrValue(attrs, "property") ?? attrValue(attrs, "name");
		const content = attrValue(attrs, "content");
		if (!prop || !content) continue;

		switch (prop.toLowerCase()) {
			case "og:title":
			case "twitter:title":
				if (!meta.title) meta.title = content;
				break;
			case "og:description":
			case "twitter:description":
			case "description":
				if (!meta.description) meta.description = content;
				break;
			case "og:image":
			case "og:image:url":
			case "og:image:secure_url":
			case "twitter:image":
			case "twitter:image:src":
				if (!meta.image) meta.image = content;
				break;
			case "og:url":
				if (!meta.url) meta.url = content;
				break;
			case "og:video":
			case "og:video:url":
			case "og:video:secure_url":
			case "twitter:player":
				if (!meta.video) meta.video = content;
				break;
		}
	}

	// <link rel="canonical" href="...">
	if (!meta.url) {
		for (const m of html.matchAll(/<link\s+([^>]+?)(?:\s*\/)?>/gi)) {
			const attrs = m[1];
			if (/rel=["']canonical["']/i.test(attrs)) {
				meta.url = attrValue(attrs, "href");
				break;
			}
		}
	}

	if (!meta.title && fallbackTitle) meta.title = fallbackTitle;

	return meta;
}

/** Extract the value of a named HTML attribute from a raw attribute string. */
function attrValue(attrs: string, name: string): string | null {
	const re = new RegExp(`${name}=(?:"([^"]*)"|'([^']*)'|(\\S+))`, "i");
	const m = attrs.match(re);
	if (!m) return null;
	// Handle HTML entities in attributes (simplistic)
	let val = (m[1] ?? m[2] ?? m[3] ?? "").trim();
	if (val.includes("&")) {
		val = val
			.replace(/&amp;/g, "&")
			.replace(/&quot;/g, '"')
			.replace(/&apos;/g, "'")
			.replace(/&lt;/g, "<")
			.replace(/&gt;/g, ">");
	}
	return val || null;
}

// ─── HTMLRewriter-based path (Cloudflare Workers / workerd) ─────────────────

async function parseOGWithRewriter(
	response: Response,
	meta: OGMeta,
): Promise<string> {
	let titleBuffer = "";

	await new HTMLRewriter()
		.on("title", {
			text(chunk) {
				titleBuffer += chunk.text;
			},
		})
		.on("meta", {
			element(el) {
				const prop = el.getAttribute("property") ?? el.getAttribute("name");
				const content = el.getAttribute("content");
				if (!prop || !content) return;

				switch (prop.toLowerCase()) {
					case "og:title":
					case "twitter:title":
						if (!meta.title) meta.title = content;
						break;
					case "og:description":
					case "twitter:description":
					case "description":
						if (!meta.description) meta.description = content;
						break;
					case "og:image":
					case "og:image:url":
					case "og:image:secure_url":
					case "twitter:image":
					case "twitter:image:src":
						if (!meta.image) meta.image = content;
						break;
					case "og:url":
						if (!meta.url) meta.url = content;
						break;
					case "og:video":
					case "og:video:url":
					case "og:video:secure_url":
					case "twitter:player":
						if (!meta.video) meta.video = content;
						break;
				}
			},
		})
		.on("link[rel='canonical']", {
			element(el) {
				if (!meta.url) meta.url = el.getAttribute("href");
			},
		})
		.transform(response)
		.arrayBuffer();

	return titleBuffer;
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default async function getOG(url: string): Promise<OGMeta> {
	const response = await fetch(url, {
		headers: {
			"User-Agent":
				"Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
			Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
			"Accept-Language": "en-US,en;q=0.9",
			Referer: "https://www.google.com/",
		},
	});

	if (!response.ok) {
		throw new Error(
			`Failed to fetch: ${response.status} ${response.statusText}`,
		);
	}

	const meta: OGMeta = {
		title: null,
		description: null,
		image: null,
		url: null,
		video: null,
	};

	if (typeof HTMLRewriter !== "undefined") {
		// Native path — Cloudflare Workers / workerd
		const titleBuffer = await parseOGWithRewriter(response, meta);
		if (!meta.title && titleBuffer) meta.title = titleBuffer.trim();
	} else {
		// Fallback path — Node.js / Bun / any non-CF runtime
		// Read body as text and parse with regex — no WASM, no extra deps.
		// Limit processing to the first 500KB to avoid regex performance issues on huge files.
		const text = await response.text();
		const html = text.slice(0, 512 * 1024);
		Object.assign(meta, parseOGFromHTML(html));
	}

	// Final fallbacks for missing title
	if (!meta.url) meta.url = url;

	return meta;
}
