import fetchRetry from "fetch-retry";

import metascraper from "metascraper";

import meta_description from "metascraper-description";
import meta_image from "metascraper-image";
import meta_title from "metascraper-title";
import meta_url from "metascraper-url";
import meta_video from "metascraper-video";

// import meta_youtube from "metascraper-youtube"; // Broken

import fs from "node:fs";
import path from "node:path";

const fetch = fetchRetry(global.fetch);

async function getHtml(url: string) {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(
			`Failed to fetch: ${response.status} ${response.statusText}`,
		);
	}
	const html = await response.text();

	if (url.includes("hypnotube.com")) {
		const filename = url.split("/").at(-1);

		if (!filename) {
			return html;
		}

		const rootdir = process.cwd();
		fs.writeFileSync(path.join(rootdir, `tmp/${filename}`), html);
	}

	return html;
}

export default async function getOG(url: string) {
	const html = await getHtml(url);

	const meta = metascraper([
		meta_description(),
		meta_image(),
		meta_title(),
		meta_url(),
		meta_video(),
	]);

	return await meta({ url, html });
}
