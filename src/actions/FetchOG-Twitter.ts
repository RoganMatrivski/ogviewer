import fetchRetry from "fetch-retry";

const fetch = fetchRetry(global.fetch);

export const twitterWithAltsDomains = [
	"fxtwitter.com",
	"fixupx.com",
	"vxtwitter.com",
	"fixvx.com",
	"xcancel.com",
	"nitter.net",
	"nitter.poast.org",
	"twiiit.com",
	"tweetpik.com",
	"unfurlx.com",
	"twstalker.com",
	"sotwe.com",
	"x.com",
];

export const twitterOpenGraphDomains = ["fxtwitter.com", "fixupx.com"];

export function isTwitterLink(url: string): boolean {
	return twitterWithAltsDomains.some((domain) => url.includes(domain));
}

/** Fetches Twitter/X metadata from open graph proxy mirror hosts */
export async function fetchTwitterResponse(
	url: string,
	headers?: HeadersInit,
): Promise<Response> {
	const defaultHeaders: Record<string, string> = {
		"User-Agent":
			"Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
		Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
		"Accept-Language": "en-US,en;q=0.9",
		Referer: "https://www.google.com/",
	};

	const mergedHeaders = new Headers(defaultHeaders);
	if (headers) {
		const customHeaders = new Headers(headers);
		customHeaders.forEach((value, key) => {
			mergedHeaders.set(key, value);
		});
	}

	const fetchJobs = twitterOpenGraphDomains.map(async (host) => {
		const parsedUrl = new URL(url);
		parsedUrl.hostname = host;

		console.log(`[fetchTwitterResponse] Trying host: ${host}`);

		const res = await fetch(parsedUrl, {
			headers: mergedHeaders,
		});

		if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
		console.log(`[fetchTwitterResponse] Success from host: ${host}`);
		return res;
	});

	return Promise.any(fetchJobs).catch((err: unknown) => {
		console.error(
			`[fetchTwitterResponse] All hosts failed for url: ${url}`,
			err,
		);
		throw err;
	});
}
