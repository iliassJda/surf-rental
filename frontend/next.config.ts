import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	devIndicators: false,
	/**
	 * Enable static exports.
	 *
	 * @see https://nextjs.org/docs/app/building-your-application/deploying/static-exports
	 */
	output: "export",

	/**
	 * Disable server-based image optimization. Next.js does not support
	 * dynamic features with static exports.
	 *
	 * @see https://nextjs.org/docs/app/api-reference/components/image#unoptimized
	 */
	images: {
		unoptimized: true,
	},

	/**
	 * Set base path for GitHub Pages deployment.
	 * Change this to your repository name if deploying to a project page.
	 */
	basePath: process.env.NODE_ENV === "production" ? "/surf-rental" : "",
	assetPrefix: process.env.NODE_ENV === "production" ? "/surf-rental/" : "",
};

export default nextConfig;
