import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the Next.js dev server to accept requests from ngrok tunnels.
  allowedDevOrigins: [
    "antsy-landmine-removable.ngrok-free.dev",
    "*.ngrok-free.dev",
    "*.ngrok-free.app",
  ],
};

export default nextConfig;
