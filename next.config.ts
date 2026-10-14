import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-expect-error Next.js 16 deprecated eslint in NextConfig but Vercel configuration requires it
  eslint: {
    ignoreDuringBuilds: true,
  },
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
