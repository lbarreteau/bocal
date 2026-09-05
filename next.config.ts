import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.hellofresh.com" },
      { protocol: "https", hostname: "d3hvwccx09j84u.cloudfront.net" },
      { protocol: "https", hostname: "www.hellofresh.fr" },
    ],
  },
};

export default nextConfig;
