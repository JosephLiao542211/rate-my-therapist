import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Consolidate the www duplicate onto the apex domain so Google sees a
      // single canonical host (www currently serves a full 200 copy).
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
