import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // All images are self-hosted static assets in /public.
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
