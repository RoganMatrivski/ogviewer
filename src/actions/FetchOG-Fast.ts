import fetchRetry from "fetch-retry";
import type { OGMeta } from "@/types/OpenGraph";
import { parseHTML, parseWithHTMLRewriter } from "./FetchOG-Parser";
import { fetchTwitterResponse, isTwitterLink } from "./FetchOG-Twitter";

const fetch = fetchRetry(global.fetch);

/** Fetch raw HTTP response for a URL (handling Twitter/X redirection if applicable) */
export async function fetchResponse(url: string): Promise<Response> {
	const response = isTwitterLink(url)
		? await fetchTwitterResponse(url)
		: await fetch(url, {
				headers: {
					"User-Agent":
						"Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
					Accept:
						"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
					"Accept-Language": "en-US,en;q=0.9",
					Referer: "https://www.google.com/",
				},
			});

	if (!response.ok) {
		throw new Error(
			`Failed to fetch: ${response.status} ${response.statusText}`,
		);
	}

	return response;
}

/** Fetches OpenGraph metadata using fast HTTP fetch + HTMLRewriter/regex parsing */
export async function getOGFast(url: string): Promise<OGMeta> {
	const response = await fetchResponse(url);

	const meta: OGMeta = {
		title: null,
		description: null,
		image: null,
		url: null,
		video: null,
	};

	if (typeof HTMLRewriter !== "undefined") {
		// Native path — Cloudflare Workers / workerd
		const { titleBuffer } = await parseWithHTMLRewriter(response, meta);
		if (!meta.title && titleBuffer) meta.title = titleBuffer.trim();
	} else {
		// Fallback path — Node.js / Bun / non-CF runtime
		const text = await response.text();
		const html = text.slice(0, 512 * 1024);
		Object.assign(meta, parseHTML(html));
	}

	if (!meta.url) meta.url = url;

	return meta;
}

export default getOGFast;
