import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["puppeteer", "@prisma/client", ".prisma/client"],
  outputFileTracingIncludes: {
    "/api/quotes/[id]/pdf": ["./src/lib/pdf/fonts/**/*"],
  },
};

export default nextConfig;
