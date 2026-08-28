"use server";

import type { OGMeta } from "@/types/OpenGraph";
import { getOGFast as fetchOGFast } from "./FetchOG-Fast";
import flow from "./Flowpick";

export async function getOGFast(
  url: string,
  headers?: HeadersInit,
): Promise<OGMeta> {
  return fetchOGFast(url, headers);
}


/**
 * Main OpenGraph fetcher Server Action.
 * Tries fast HTTP fetch first; if title or image is missing, falls back to Puppeteer browser rendering.
 */
export async function getOG(url: string): Promise<OGMeta> {
  const host = new URL(url).hostname;

  let headers: HeadersInit = {};

  await flow(url, async (_url: string) => {
    const res = await fetch(`https://${host}/age-gate`, {
      method: "POST",
    });

    type AgeGateResponse = {
      blocked: boolean,
      redirect: string,
    }

    const res_json = await res.json<AgeGateResponse>()

    if (res_json.blocked) {
      throw new Error("Age gate blocked this URL");
    }

    const cookies = res.headers.getSetCookie();

    const cookieHeader = cookies
      .map((c) => c.split(";")[0].trim())
      .filter(Boolean)
      .join("; ");

    headers = cookieHeader ? { Cookie: cookieHeader } : {};
  });

  console.log(`Fetching ${url} with ${JSON.stringify(headers)}`);
  return getOGFast(url, headers);
}

export default getOG;
