import Database from "better-sqlite3";
import {
  drizzle,
  type BetterSQLite3Database,
} from "drizzle-orm/better-sqlite3";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import * as schema from "./schema";

export type DiscollectionDb = BetterSQLite3Database<typeof schema>;

export type CreateDbOptions = {
  filePath?: string;
  sqlite?: Database.Database;
};

export function resolveDbPath(filePath?: string): string {
  return (
    filePath ?? process.env["DISCOLLECTION_DB_PATH"] ?? "./discollection.db"
  );
}

export function createDb(options: CreateDbOptions = {}): DiscollectionDb {
  const dbPath = resolveDbPath(options.filePath);

  if (!options.sqlite) {
    const directory = path.dirname(dbPath);
    if (directory && directory !== ".") {
      fs.mkdirSync(directory, { recursive: true });
    }
  }

  const sqlite = options.sqlite ?? new Database(dbPath);
  return drizzle(sqlite, { schema });
}

export function ensureCoreSchema(db: DiscollectionDb): void {
  db.run(sql`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
}
