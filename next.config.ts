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
          // Allow the hosted preview iframe while keeping clickjacking protection
          // for arbitrary third-party origins. X-Frame-Options cannot express an
          // allow-list, so frame-ancestors is used instead.
          { key: "Content-Security-Policy", value: "frame-ancestors 'self' https://*.e2b.app" },
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
