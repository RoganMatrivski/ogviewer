"use server";

import type { OGMeta } from "@/types/OpenGraph";
import { getCookiesWithPuppeteer } from "./FetchCookies-Puppeteer";
import { getOGFast as fetchOGFast } from "./FetchOG-Fast";
import {
	type FetchOGPuppeteerOptions,
	getOGWithPuppeteer as fetchOGWithPuppeteer,
} from "./FetchOG-Puppeteer";

import flow from "./Flowpick";

export async function getOGFast(
	url: string,
	headers?: HeadersInit,
): Promise<OGMeta> {
	return fetchOGFast(url, headers);
}

export async function getOGWithPuppeteer(
	url: string,
	options?: FetchOGPuppeteerOptions,
): Promise<OGMeta> {
	return fetchOGWithPuppeteer(url, options);
}

/**
 * Main OpenGraph fetcher Server Action.
 * Tries fast HTTP fetch first; if title or image is missing, falls back to Puppeteer browser rendering.
 */
export async function getOG(url: string): Promise<OGMeta> {
	const host = new URL(url).hostname;

	let headers: HeadersInit = {};

	await flow(url, async (_url: string) => {
		const { cookieHeader, userAgent } = await getCookiesWithPuppeteer(
			`https://${host}`,
			{
				waitForSelector: ".page-home",
			},
		);

		headers = {
			Cookie: cookieHeader,
			"User-Agent": userAgent,
		};
	});

	console.log(`Fetching ${url} with ${JSON.stringify(headers)}`);
	return getOGFast(url, headers);
}

export default getOG;
