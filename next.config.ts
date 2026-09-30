import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Sanity's CDN resizes and re-encodes on the fly — see the loader.
    loader: "custom",
    loaderFile: "./sanity/lib/imageLoader.ts",
  },
  webpack(config, { isServer }) {
    if (!isServer) {
      // Next.js 15 aliases react to its own canary build which lacks useEffectEvent.
      // Override to use the project's installed react@19.2.4 in client bundles.
      config.resolve.alias["react"] = path.resolve("./node_modules/react");
      config.resolve.alias["react-dom"] = path.resolve(
        "./node_modules/react-dom",
      );
    }
    return config;
  },
};

export default nextConfig;
