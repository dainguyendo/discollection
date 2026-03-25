import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    schema: "src/schema.ts",
  },
  outDir: "dist",
  format: ["esm"],
  target: "node20",
  platform: "node",
  clean: true,
  sourcemap: true,
  dts: true,
  splitting: false,
  minify: false,
  treeshake: true,
});
