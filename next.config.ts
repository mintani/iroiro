import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Images are read from user uploads as data URLs, so the optimizer is never used.
  // Keeping it off also removes the need for the Cloudflare Images binding.
  images: { unoptimized: true },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
