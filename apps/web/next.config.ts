import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Nest API for dev; override if API runs elsewhere. */
const apiUpstream =
  process.env.API_UPSTREAM?.replace(/\/$/, "") ?? "http://127.0.0.1:3001";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/domain", "@repo/theme"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
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
