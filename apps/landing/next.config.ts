import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const narrativeUrl = process.env.NARRATIVE_URL;
    const workspaceUrl = process.env.WORKSPACE_URL;
    const rewrites = [];

    if (narrativeUrl) {
      rewrites.push({
        source: "/narrative/:path*",
        destination: `${narrativeUrl.replace(/\/$/, "")}/narrative/:path*`,
      });
    }

    if (workspaceUrl) {
      rewrites.push({
        source: "/workspace/:path*",
        destination: `${workspaceUrl.replace(/\/$/, "")}/workspace/:path*`,
      });
    }

    return rewrites;
  },
};

export default nextConfig;
