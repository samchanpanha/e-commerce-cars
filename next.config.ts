import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: "8mb" } },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
      { source: "/api/(.*)", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};
export default nextConfig;
