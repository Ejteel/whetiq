import type { NextConfig } from "next";

type WorkspaceWebpackConfig = {
  resolve?: {
    extensionAlias?: Record<string, string[]>;
  };
};

function withWorkspaceExtensionAliases(nextConfig: NextConfig): NextConfig {
  return {
    ...nextConfig,
    webpack(config: WorkspaceWebpackConfig): WorkspaceWebpackConfig {
      const resolve = config.resolve ?? {};
      resolve.extensionAlias = {
        ...(resolve.extensionAlias ?? {}),
        ".js": [".ts", ".tsx", ".js"],
        ".mjs": [".mts", ".mjs"],
        ".cjs": [".cts", ".cjs"],
      };
      config.resolve = resolve;

      return config;
    },
  };
}

const nextConfig = withWorkspaceExtensionAliases({
  basePath: "/narrative",
  experimental: {
    externalDir: true,
  },
  transpilePackages: [
    "@mvp/adapters",
    "@mvp/api",
    "@mvp/core",
    "@mvp/storage",
    "@whetiq/auth",
  ],
  typedRoutes: true,
});

export default nextConfig;
