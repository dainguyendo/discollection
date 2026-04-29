import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL("https://i.discogs.com/**"),
      new URL("https://img.discogs.com/**"),
    ],
  },
};

export default nextConfig;
