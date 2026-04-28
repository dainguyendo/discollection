import { defineConfig } from "drizzle-kit";
import path from "path";
import { fileURLToPath } from "url";

const packageDir = path.dirname(fileURLToPath(import.meta.url));
const defaultDbPath = path.resolve(packageDir, "../discollection.db");

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env["DISCOLLECTION_DB_PATH"] ?? defaultDbPath,
  },
});
