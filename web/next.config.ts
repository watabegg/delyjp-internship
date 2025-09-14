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
        protocol: "http",
        hostname: "rails-app",
        port: "3001",
        pathname: "/rails/active_storage/**",
      },
    ],
  },
};

export default nextConfig;
