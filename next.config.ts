import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  images: {
    // All images are self-hosted static assets in /public.
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
