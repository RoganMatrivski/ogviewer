import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
	images: {
		loader: "custom",
		loaderFile: "./image-loader.ts",
	},
	turbopack: {},
	cacheComponents: true,
	partialPrefetching: true,
	output: "standalone",
};

// if (process.env.NODE_ENV === "development") {
// 	nextConfig.outputFileTracingRoot = path.join(__dirname, "../../");
// }

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
