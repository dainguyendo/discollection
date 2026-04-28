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

export function ensureCollectionSchema(db: DiscollectionDb): void {
  db.run(sql`
    CREATE TABLE IF NOT EXISTS collection_releases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discogs_release_id INTEGER NOT NULL,
      instance_id INTEGER NOT NULL,
      folder_id INTEGER NOT NULL,
      rating INTEGER NOT NULL DEFAULT 0,
      title TEXT NOT NULL,
      year INTEGER,
      resource_url TEXT NOT NULL,
      thumb TEXT,
      cover_image TEXT,
      fetched_at TEXT NOT NULL,
      format TEXT,
      artist TEXT
    )
  `);

  db.run(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS collection_releases_instance_id_unique
      ON collection_releases (instance_id)
  `);
  db.run(sql`
    CREATE INDEX IF NOT EXISTS collection_releases_folder_id_idx
      ON collection_releases (folder_id)
  `);
  db.run(sql`
    CREATE INDEX IF NOT EXISTS collection_releases_discogs_release_id_idx
      ON collection_releases (discogs_release_id)
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS release_genres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      release_id INTEGER NOT NULL,
      genre TEXT NOT NULL,
      FOREIGN KEY (release_id) REFERENCES collection_releases(id) ON DELETE CASCADE
    )
  `);

  db.run(sql`
    CREATE INDEX IF NOT EXISTS release_genres_release_id_idx
      ON release_genres (release_id)
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS release_styles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      release_id INTEGER NOT NULL,
      style TEXT NOT NULL,
      FOREIGN KEY (release_id) REFERENCES collection_releases(id) ON DELETE CASCADE
    )
  `);

  db.run(sql`
    CREATE INDEX IF NOT EXISTS release_styles_release_id_idx
      ON release_styles (release_id)
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS release_overrides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      release_id INTEGER NOT NULL,
      override_type TEXT NOT NULL,
      value TEXT NOT NULL
    )
  `);

  db.run(sql`
    CREATE INDEX IF NOT EXISTS release_overrides_release_id_idx
      ON release_overrides (release_id)
  `);
  db.run(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS release_overrides_release_id_type_unique
      ON release_overrides (release_id, override_type)
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS config_subgroups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      genre TEXT NOT NULL
    )
  `);

  db.run(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS config_subgroups_genre_unique
      ON config_subgroups (genre)
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS config_consolidations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      style TEXT NOT NULL,
      value TEXT NOT NULL
    )
  `);

  db.run(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS config_consolidations_style_unique
      ON config_consolidations (style)
  `);
}
