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
  const normalized = normalizeSrc(src);

  if (process.env.NODE_ENV === "development") {
    // In dev, no Cloudflare proxy — return src directly or use absolute URL
    if (src.startsWith("/")) return src;
    const base = process.env.NEXT_PUBLIC_IMAGE_DOMAIN ?? "";
    return `${base}/cdn-cgi/image/${paramsString}/${normalized}`;
  }

  // In production, relative path works since Cloudflare is on your domain
  return `/cdn-cgi/image/${paramsString}/${normalized}`;
}
