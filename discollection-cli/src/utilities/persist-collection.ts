import { createDb, ensureCollectionSchema, resolveDbPath, schema } from "discollection-db";

import logger from "../logger";
import { GetReleasesResponse } from "../types";
import { getReleaseFormat, getReleasePrimaryArtist } from "./release";

type PersistCollectionOptions = {
  dbPath?: string;
};

export function persistCollectionToDb(
  collection: GetReleasesResponse["releases"],
  options: PersistCollectionOptions = {},
): void {
  const dbPath = resolveDbPath(options.dbPath);
  logger.info("Persisting collection snapshot to database", { dbPath });

  const db = createDb({ filePath: dbPath });
  ensureCollectionSchema(db);
  const fetchedAt = new Date().toISOString();

  db.transaction((tx) => {
    // Full refresh keeps DB contents aligned with latest collection snapshot.
    tx.delete(schema.releaseStyles).run();
    tx.delete(schema.releaseGenres).run();
    tx.delete(schema.collectionReleases).run();

    for (const release of collection) {
      const { basic_information } = release;
      const genres = basic_information.genres ?? [];
      const styles = basic_information.styles ?? [];

      tx.insert(schema.collectionReleases)
        .values({
          discogsReleaseId: basic_information.id,
          instanceId: release.instance_id,
          folderId: release.folder_id,
          rating: release.rating,
          title: basic_information.title,
          year: basic_information.year,
          resourceUrl: basic_information.resource_url,
          thumb: basic_information.thumb,
          coverImage: basic_information.cover_image,
          fetchedAt,
          format: getReleaseFormat(release),
          artist: getReleasePrimaryArtist(release),
        })
        .run();

      const persistedRelease = tx
        .select({
          id: schema.collectionReleases.id,
          instanceId: schema.collectionReleases.instanceId,
        })
        .from(schema.collectionReleases)
        .all()
        .find((item) => item.instanceId === release.instance_id);

      if (!persistedRelease) {
        throw new Error(`Failed to persist release instance ${release.instance_id}`);
      }

      const releaseId = persistedRelease.id;

      if (genres.length > 0) {
        tx.insert(schema.releaseGenres)
          .values(
            genres.map((genre) => ({
              releaseId,
              genre,
            })),
          )
          .run();
      }

      if (styles.length > 0) {
        tx.insert(schema.releaseStyles)
          .values(
            styles.map((style) => ({
              releaseId,
              style,
            })),
          )
          .run();
      }

      // const genreOverride = config?.genre[basic_information.id];
      // const styleOverride = config?.style[basic_information.id];

      // if (genreOverride) {
      //   tx.insert(schema.releaseOverrides)
      //     .values({
      //       releaseId,
      //       overrideType: "genre",
      //       value: genreOverride,
      //     })
      //     .run();
      // }

      // if (styleOverride) {
      //   tx.insert(schema.releaseOverrides)
      //     .values({
      //       releaseId,
      //       overrideType: "style",
      //       value: styleOverride,
      //     })
      //     .run();
      // }
    }
  });

  logger.info("Saved collection snapshot to database", {
    total: collection.length,
  });
}
