import groupBy from "lodash/groupBy.js";
import { createDb, ensureCollectionSchema, schema } from "discollection-db";
import { Configuration, GetReleasesResponse, Release } from "../types";
import { sortReleaseByArtist } from "./sort";
import { getReleaseFormat, getReleaseGenre, getReleaseStyle } from "./release";

export type OrganizedLibrary = Record<
  string,
  Record<string, Release[] | Record<string, Release[]>>
>;

type OrganizeDbData = {
  collection: GetReleasesResponse["releases"];
  overrides: Pick<Configuration, "genre" | "style">;
  dbConfig: Pick<Configuration, "subgroup" | "consolidate">;
};

export function loadOrganizeDataFromDb(): OrganizeDbData {
  const db = createDb();
  ensureCollectionSchema(db);

  const releases = db.select().from(schema.collectionReleases).all();
  const genres = db.select().from(schema.releaseGenres).all();
  const styles = db.select().from(schema.releaseStyles).all();
  const overrides = db.select().from(schema.releaseOverrides).all();
  const subgroupRows = db.select().from(schema.configSubgroups).all();
  const consolidationRows = db.select().from(schema.configConsolidations).all();

  const releasesByLocalId = new Map(
    releases.map((release) => [release.id, release]),
  );
  const releasesByDiscogsId = new Map(
    releases.map((release) => [release.discogsReleaseId, release]),
  );

  const genresByReleaseId = groupBy(genres, "releaseId");
  const stylesByReleaseId = groupBy(styles, "releaseId");

  const genreOverrides: Record<string, string> = {};
  const styleOverrides: Record<string, string> = {};

  for (const override of overrides) {
    const release =
      releasesByLocalId.get(override.releaseId) ??
      releasesByDiscogsId.get(override.releaseId);

    if (!release) {
      continue;
    }

    const target =
      override.overrideType === "genre" ? genreOverrides : styleOverrides;

    target[release.discogsReleaseId] = override.value;
  }

  return {
    overrides: {
      genre: genreOverrides,
      style: styleOverrides,
    },
    dbConfig: {
      subgroup: subgroupRows.map(({ genre }) => genre),
      consolidate: Object.fromEntries(
        consolidationRows.map(({ style, value }) => [style, value]),
      ),
    },
    collection: releases.map((release) => ({
      id: release.discogsReleaseId,
      instance_id: release.instanceId,
      folder_id: release.folderId,
      rating: release.rating,
      basic_information: {
        id: release.discogsReleaseId,
        title: release.title,
        year: release.year ?? 0,
        resource_url: release.resourceUrl,
        thumb: release.thumb ?? "",
        cover_image: release.coverImage ?? "",
        formats: release.format
          ? [
              {
                qty: "1",
                descriptions: [release.format],
                name: "Vinyl",
              },
            ]
          : [],
        labels: [],
        artists: release.artist
          ? [
              {
                id: 0,
                name: release.artist,
                join: "",
                resource_url: "",
                anv: "",
                tracks: "",
                role: "",
              },
            ]
          : [],
        genres: (genresByReleaseId[release.id] ?? [])
          .sort((left, right) => left.id - right.id)
          .map(({ genre }) => genre),
        styles: (stylesByReleaseId[release.id] ?? [])
          .sort((left, right) => left.id - right.id)
          .map(({ style }) => style),
      },
      notes: [],
    })),
  };
}

export function buildOrganizedLibrary(
  collection: GetReleasesResponse["releases"],
  config?: Configuration,
): OrganizedLibrary {
  const library: OrganizedLibrary = {};
  const formatGrouping = groupBy(collection, getReleaseFormat);

  Object.entries(formatGrouping).forEach(([format, releases]) => {
    const genreGrouping = groupBy(releases, (release) =>
      getReleaseGenre(release, 0, config),
    );

    Object.entries(genreGrouping).forEach(([genre, groupedReleases]) => {
      if (config?.subgroup.includes(genre)) {
        const styleGrouping = groupBy(groupedReleases, (release) =>
          getReleaseStyle(release, 0, config),
        );

        // If all styles have 1 release, regroup under the genre
        if (Object.values(styleGrouping).every((r) => r.length === 1)) {
          library[format] = {
            ...library[format],
            [genre]: groupedReleases.sort(sortReleaseByArtist),
          };

          return;
        }

        const sorted = Object.entries(styleGrouping).reduce(
          (acc, [style, releasesForStyle]) => {
            acc[style] = releasesForStyle.sort(sortReleaseByArtist);
            return acc;
          },
          {} as Record<string, Release[]>,
        );

        // then attach to library
        library[format] = {
          ...library[format],
          [genre]: sorted,
        };
      } else {
        // sort by artist then title
        const sorted = groupedReleases.sort(sortReleaseByArtist);

        // then attach to library
        library[format] = {
          ...library[format],
          [genre]: sorted,
        };
      }
    });
  });

  return library;
}
