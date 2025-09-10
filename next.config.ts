import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  basePath: '/photos',
  assetPrefix: '/photos',
  trailingSlash: true,
  /* config options here */
};

export default nextConfig;
