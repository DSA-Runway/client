import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * The authored lesson content lives in Markdown under src/content and is read
   * at runtime with fs (see src/content/registry.ts). Next's tracer cannot see
   * those reads, so the files are listed here explicitly or they would be
   * missing from a production build.
   */
  outputFileTracingIncludes: {
    "/api/content/[id]": ["./src/content/**/*.md"],
  },
};

export default nextConfig;
