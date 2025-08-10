import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Required configuration for react-konva to work with Next.js
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
      };
    }

    config.externals = config.externals || [];
    config.externals.push({
      canvas: 'canvas',
    });

    return config;
  },
};

export default nextConfig;
