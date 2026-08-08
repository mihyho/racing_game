import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/racing_game",
  assetPrefix: "/racing_game/",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
