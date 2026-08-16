import type { OGMeta } from "@/types/OpenGraph";
import { getOGFast } from "./FetchOG-Fast";
import { getOGWithPuppeteer } from "./FetchOG-Puppeteer";

export * from "./FetchOG-Fast";
export * from "./FetchOG-Parser";
export * from "./FetchOG-Puppeteer";
// Re-export discrete step modules for direct usage
export * from "./FetchOG-Twitter";

/**
 * Main OpenGraph fetcher.
 * Tries fast HTTP fetch first; if title or image is missing, falls back to Puppeteer browser rendering.
 */
export async function getOG(url: string): Promise<OGMeta> {
	try {
		const fastMeta = await getOGFast(url);

		// If fast fetch found title and image (or video), return immediately
		if (fastMeta.title && (fastMeta.image || fastMeta.video)) {
			return fastMeta;
		}

		// If fast fetch returned incomplete metadata, attempt Puppeteer browser rendering
		console.log(
			`[getOG] Incomplete metadata from fast fetch for ${url}. Trying Puppeteer browser rendering...`,
		);
		const puppeteerMeta = await getOGWithPuppeteer(url);
		return {
			title: puppeteerMeta.title || fastMeta.title,
			description: puppeteerMeta.description || fastMeta.description,
			image: puppeteerMeta.image || fastMeta.image,
			url: puppeteerMeta.url || fastMeta.url || url,
			video: puppeteerMeta.video || fastMeta.video,
		};
	} catch (fastErr) {
		console.warn(
			`[getOG] Fast fetch failed for ${url}:`,
			fastErr,
			`Attempting Puppeteer browser rendering...`,
		);
		try {
			return await getOGWithPuppeteer(url);
		} catch (puppeteerErr) {
			console.error(
				`[getOG] Puppeteer rendering also failed for ${url}:`,
				puppeteerErr,
			);
			throw fastErr;
		}
	}
}

export default getOG;
