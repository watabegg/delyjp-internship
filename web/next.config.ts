import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "http",
				hostname: "localhost",
				port: "3001",
				pathname: "/rails/active_storage/**",
			},
			{
				protocol: "https",
				hostname: "video.kurashiru.com",
				pathname: "/**",
			},
			{
				protocol: "http",
				hostname: "video.kurashiru.com",
				pathname: "/**",
			},
		],
	},
	env: {
		OPENAI_API_KEY: process.env.OPENAI_API_KEY,
	},
};

export default nextConfig;
