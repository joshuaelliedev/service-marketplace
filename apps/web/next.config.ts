import type { NextConfig } from "next";

/** Nest API for dev; override if API runs elsewhere. */
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
