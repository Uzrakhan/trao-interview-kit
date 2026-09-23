import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          "https://trao-interview-kit.onrender.com/api/:path*",
      },
    ];
  },
};

export default nextConfig;