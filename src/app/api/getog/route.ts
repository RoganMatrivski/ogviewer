import getOG from "@/actions/FetchOG";
import type createMetascraper from "metascraper";
import type { NextRequest } from "next/server";
import QuickLRU from "quick-lru";
import crypto from "crypto";

const lru = new QuickLRU<
	string,
	{ meta: createMetascraper.Metadata; etag: string }
>({
	maxSize: 1000,
	maxAge: 12 * 60 * 60 * 1000,
});

function generateETag(meta: createMetascraper.Metadata): string {
	const hash = crypto
		.createHash("sha1")
		.update(JSON.stringify(meta))
		.digest("hex");
	return `"${hash}"`;
}

export async function GET(req: NextRequest) {
	const url = req.nextUrl.searchParams.get("url");

	if (!url) {
		return new Response("Missing url", { status: 400 });
	}

	const ifNoneMatch = req.headers.get("if-none-match");
	const cached = lru.get(url);

	if (cached && ifNoneMatch === cached.etag) {
		return new Response(null, {
			status: 304,
		});
	}

	let meta: createMetascraper.Metadata;

	if (cached) {
		meta = cached.meta;
	} else {
		meta = await getOG(url);
		const etag = generateETag(meta);
		lru.set(url, { meta, etag });
	}

	const etag = generateETag(meta);

	return new Response(JSON.stringify(meta), {
		status: 200,
		headers: {
			"Content-Type": "application/json",
			ETag: etag,
		},
	});
}
