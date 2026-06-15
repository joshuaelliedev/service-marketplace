import type { NextConfig } from "next";

const apiUpstream =
  process.env.API_UPSTREAM?.replace(/\/$/, "") ?? "http://127.0.0.1:3001";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/domain", "@repo/theme"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUpstream}/:path*`,
      },
    ];
  },
};

export default nextConfig;
