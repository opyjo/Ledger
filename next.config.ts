import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline",
  },
})({
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
});

export default nextConfig;
