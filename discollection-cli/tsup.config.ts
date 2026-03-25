import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/cli.ts",
  },
  outDir: "dist/bin",
  format: ["esm"],
  target: "node20",
  platform: "node",

  // CLI-specific
  banner: {
    js: "#!/usr/bin/env node",
  },

  // Clean & DX
  clean: true,
  sourcemap: true,
  dts: false, // usually not needed for CLI
  splitting: false, // important for CLI (single file output)

  // Optional but useful
  minify: false,
  treeshake: true,
});
