// image-loader.ts
import type { ImageLoaderProps } from "next/image";

const normalizeSrc = (src: string) => {
	return src.startsWith("/") ? src.slice(1) : src;
};

export default function cloudflareLoader({
	src,
	width,
	quality,
}: ImageLoaderProps) {
	if (process.env.NODE_ENV === "development" && src.startsWith("/")) {
		return src;
	}
	const params = [`width=${width}`];
	if (quality) {
		params.push(`quality=${quality}`);
	}
	const paramsString = params.join(",");

	if (process.env.NODE_ENV === "development") {
		return `https://REDACTED/cdn-cgi/image/${paramsString}/${normalizeSrc(src)}`;
	} else {
		return `/cdn-cgi/image/${paramsString}/${normalizeSrc(src)}`;
	}
}
