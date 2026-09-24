import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ✅ Force HTTPS for all routes
  async redirects() {
    return [
      {
        source: "/(.*)",
        destination: "https://hrdb-lenard.vercel.app/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
