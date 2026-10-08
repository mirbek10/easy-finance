import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: { root: __dirname },
  devIndicators: false,
  async rewrites() {
    const backend = (process.env.API_URL || "https://easy-finance-server.onrender.com").replace(
      /\/+$/,
      "",
    );
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/health/:path*", destination: `${backend}/health/:path*` },
      { source: "/ws", destination: `${backend}/ws` },
    ];
  },
};

export default nextConfig;
