import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.rate-my-therapist.com" }],
        destination: "https://rate-my-therapist.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
