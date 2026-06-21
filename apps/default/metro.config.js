const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

// Monorepo root — two levels up from apps/default/
const monorepoRoot = path.resolve(__dirname, "../..");

const config = getDefaultConfig(__dirname);

// 1. Watch the whole monorepo so Metro sees changes in packages/
config.watchFolders = [monorepoRoot];

// 2. Let Metro resolve modules from both the app's node_modules AND the root's
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// 3. Path aliases — mirrors the tsconfig paths
config.resolver.extraNodeModules = {
  "@/convex": path.resolve(monorepoRoot, "packages/backend/convex"),
  "@/shared": path.resolve(monorepoRoot, "packages/shared/src"),
};

// 4. Load env vars from the monorepo root .env file
require("@expo/env").load(monorepoRoot);

module.exports = config;
