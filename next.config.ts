import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. Without it, Turbopack walks up and
  // finds an unrelated lockfile in the home directory and warns about it.
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: ['10.26.241.244'],
};

export default nextConfig;
