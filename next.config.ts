import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["puppeteer", "@prisma/client", ".prisma/client"],
};

export default nextConfig;
