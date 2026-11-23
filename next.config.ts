import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Cache Components / Partial Prefetching are left off on purpose: OpenNext's
  // Cloudflare adapter doesn't fully support them yet, and pages 500 on Workers.
  // Revisit once https://github.com/opennextjs/opennextjs-cloudflare/pull/1318 lands.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

// Gives `next dev` access to Cloudflare bindings (env, KV, etc.) via wrangler.
initOpenNextCloudflareForDev();
