import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdns7.shopdisney.disney.co.jp",
        pathname: "/is/image/**",
      },
    ],
  },
};

export default nextConfig;
