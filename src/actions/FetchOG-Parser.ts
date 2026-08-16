import type { OGMeta } from "@/types/OpenGraph";

/** Extract the value of a named HTML attribute from a raw attribute string. */
export function attrValue(attrs: string, name: string): string | null {
	const re = new RegExp(`${name}=(?:"([^"]*)"|'([^']*)'|(\\S+))`, "i");
	const m = attrs.match(re);
	if (!m) return null;
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

/** Parse OG metadata from raw HTML text using regex */
export function parseHTML(html: string): OGMeta {
	const meta: OGMeta = {
		title: null,
		description: null,
		image: null,
		url: null,
		video: null,
	};

	const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
	const fallbackTitle = titleMatch ? titleMatch[1].trim() : null;

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

/** Parse OG metadata from a Response using HTMLRewriter (Cloudflare Workers) */
export async function parseWithHTMLRewriter(
	response: Response,
	initialMeta?: OGMeta,
): Promise<{ meta: OGMeta; titleBuffer: string }> {
	const meta: OGMeta = initialMeta ?? {
		title: null,
		description: null,
		image: null,
		url: null,
		video: null,
	};

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

	return { meta, titleBuffer };
}
