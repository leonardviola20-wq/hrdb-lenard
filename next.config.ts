import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.1.220", "127.0.0.1", "localhost"],
  experimental: {
    agentUpgrade: "security",
    serverActions: {
      allowedOrigins: [
        "192.168.1.220:3000",
        "127.0.0.1:3000",
        "localhost:3000",
      ],
    },
  },
};

export default nextConfig;
