import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native module, must not be bundled by webpack
  serverExternalPackages: ["better-sqlite3"],
  // Bundle SQLite DB with serverless functions that read it
  outputFileTracingIncludes: {
    "/api/plan/route": ["./data/sehatin.db"],
    "/api/workout/route": ["./data/sehatin.db"],
    "/api/analyze/route": ["./data/sehatin.db"],
  },
};

export default nextConfig;
