import { OGMeta } from "@/types/OpenGraph";
import fetchRetry from "fetch-retry";

const fetch = fetchRetry(global.fetch);

export default async function getOG(url: string): Promise<OGMeta> {
  const response = await fetch(url);
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

  let titleBuffer = "";
  let inTitle = false;

  await new HTMLRewriter()
    .on("title", {
      text(chunk) {
        titleBuffer += chunk.text;
        if (chunk.lastInTextNode) inTitle = false;
      },
    })
    .on("meta", {
      element(el) {
        const prop = el.getAttribute("property") ?? el.getAttribute("name");
        const content = el.getAttribute("content");
        if (!prop || !content) return;

        switch (prop) {
          // Title: og > twitter > <title>
          case "og:title":
          case "twitter:title":
            if (!meta.title) meta.title = content;
            break;

          // Description: og > twitter > meta[name=description]
          case "og:description":
          case "twitter:description":
            if (!meta.description) meta.description = content;
            break;
          case "description":
            if (!meta.description) meta.description = content;
            break;

          // Image: og > twitter
          case "og:image":
          case "og:image:secure_url":
          case "twitter:image":
            if (!meta.image) meta.image = content;
            break;

          // URL
          case "og:url":
            if (!meta.url) meta.url = content;
            break;

          // Video: og > twitter
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
    .arrayBuffer(); // must consume the body

  // Fall back <title> tag if og:title / twitter:title not found
  if (!meta.title && titleBuffer) meta.title = titleBuffer.trim();

  // Fall back to the original URL if nothing found
  if (!meta.url) meta.url = url;

  return meta;
}
