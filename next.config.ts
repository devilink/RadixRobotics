import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  images: {
    // All images are self-hosted static assets in /public.
  },
  experimental: {
    serverActions: {
      // Spreadsheet imports upload files up to 5 MB (plus multipart overhead).
      bodySizeLimit: "6mb",
    },
  },
  // The lab routes read their HTML from docs/ at runtime.
  outputFileTracingIncludes: {
    "/kits/content": ["./docs/kits.html"],
    "/kits/arduino/content": ["./docs/arduino.html"],
    "/kits/esp/content": ["./docs/esp.html"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
