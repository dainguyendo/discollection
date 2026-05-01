import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// One row per collection release entry from Discogs list() response.
export const collectionReleases = sqliteTable(
  "collection_releases",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    discogsReleaseId: integer("discogs_release_id").notNull(),
    instanceId: integer("instance_id").notNull(),
    folderId: integer("folder_id").notNull(),
    rating: integer("rating").notNull().default(0),
    title: text("title").notNull(),
    year: integer("year"),
    resourceUrl: text("resource_url").notNull(),
    thumb: text("thumb"),
    coverImage: text("cover_image"),
    fetchedAt: text("fetched_at").notNull(),
    format: text("format", { enum: ["7", "10", "12"] }),
    artist: text("artist"),
  },
  (table) => ({
    instanceIdUnique: uniqueIndex("collection_releases_instance_id_unique").on(table.instanceId),
    folderIdIdx: index("collection_releases_folder_id_idx").on(table.folderId),
    releaseIdIdx: index("collection_releases_discogs_release_id_idx").on(table.discogsReleaseId),
  }),
);

export const releaseGenres = sqliteTable(
  "release_genres",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    releaseId: integer("release_id")
      .notNull()
      .references(() => collectionReleases.id, { onDelete: "cascade" }),
    genre: text("genre").notNull(),
  },
  (table) => ({
    releaseIdIdx: index("release_genres_release_id_idx").on(table.releaseId),
  }),
);

export const releaseStyles = sqliteTable(
  "release_styles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    releaseId: integer("release_id")
      .notNull()
      .references(() => collectionReleases.id, { onDelete: "cascade" }),
    style: text("style").notNull(),
  },
  (table) => ({
    releaseIdIdx: index("release_styles_release_id_idx").on(table.releaseId),
  }),
);

export const releaseOverrides = sqliteTable(
  "release_overrides",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    releaseId: integer("release_id").notNull(),
    overrideType: text("override_type", {
      enum: ["genre", "style"],
    }).notNull(),
    value: text("value").notNull(),
  },
  (table) => ({
    releaseIdIdx: index("release_overrides_release_id_idx").on(table.releaseId),
    releaseOverrideTypeUnique: uniqueIndex("release_overrides_release_id_type_unique").on(
      table.releaseId,
      table.overrideType,
    ),
  }),
);

export const configSubgroups = sqliteTable(
  "config_subgroups",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    genre: text("genre").notNull(),
  },
  (table) => ({
    genreUnique: uniqueIndex("config_subgroups_genre_unique").on(table.genre),
  }),
);

export const configConsolidations = sqliteTable(
  "config_consolidations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    style: text("style").notNull(),
    value: text("value").notNull(),
  },
  (table) => ({
    styleUnique: uniqueIndex("config_consolidations_style_unique").on(table.style),
  }),
);

export type CollectionRelease = typeof collectionReleases.$inferSelect;
export type NewCollectionRelease = typeof collectionReleases.$inferInsert;

export type ReleaseGenre = typeof releaseGenres.$inferSelect;
export type NewReleaseGenre = typeof releaseGenres.$inferInsert;

export type ReleaseStyle = typeof releaseStyles.$inferSelect;
export type NewReleaseStyle = typeof releaseStyles.$inferInsert;

export type ReleaseOverride = typeof releaseOverrides.$inferSelect;
export type NewReleaseOverride = typeof releaseOverrides.$inferInsert;

export type ConfigSubgroup = typeof configSubgroups.$inferSelect;
export type NewConfigSubgroup = typeof configSubgroups.$inferInsert;

export type ConfigConsolidation = typeof configConsolidations.$inferSelect;
export type NewConfigConsolidation = typeof configConsolidations.$inferInsert;
