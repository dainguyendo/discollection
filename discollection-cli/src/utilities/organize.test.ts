import { beforeEach, describe, expect, it, vi } from "vitest";

import { Release } from "../types";

const mocks = vi.hoisted(() => {
  const ensureCollectionSchema = vi.fn();

  const schema = {
    collectionReleases: { table: "collection_releases" },
    releaseGenres: { table: "release_genres" },
    releaseStyles: { table: "release_styles" },
    releaseOverrides: { table: "release_overrides" },
    configSubgroups: { table: "config_subgroups" },
    configConsolidations: { table: "config_consolidations" },
  };

  const rowsByTable = new Map<object, unknown[]>();
  const db = {
    select: vi.fn(() => ({
      from: vi.fn((table) => ({
        all: vi.fn(() => rowsByTable.get(table) ?? []),
      })),
    })),
  };

  const createDb = vi.fn(() => db);

  return {
    ensureCollectionSchema,
    schema,
    rowsByTable,
    db,
    createDb,
  };
});

vi.mock("discollection-db", () => ({
  createDb: mocks.createDb,
  ensureCollectionSchema: mocks.ensureCollectionSchema,
  schema: mocks.schema,
}));

function makeRelease(id: number, genre: string, style: string, artist: string): Release {
  return {
    id,
    instance_id: id,
    folder_id: 0,
    rating: 0,
    basic_information: {
      id,
      title: `Title ${id}`,
      year: 2000,
      resource_url: "url",
      thumb: "",
      cover_image: "",
      formats: [{ qty: "1", descriptions: ["12"], name: "Vinyl" }],
      labels: [],
      artists: [{ name: artist }],
      genres: [genre],
      styles: [style],
    },
    notes: [],
  };
}

describe("organize utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rowsByTable.clear();
  });

  it("loads collection and maps overrides/config from DB", async () => {
    const { loadOrganizeDataFromDb } = await import("./organize");

    mocks.rowsByTable.set(mocks.schema.collectionReleases, [
      {
        id: 1,
        discogsReleaseId: 100,
        instanceId: 10,
        folderId: 0,
        rating: 4,
        title: "A",
        year: 2020,
        resourceUrl: "url",
        thumb: "",
        coverImage: "",
        fetchedAt: "now",
        format: "12",
        artist: "Artist",
      },
    ]);
    mocks.rowsByTable.set(mocks.schema.releaseGenres, [{ id: 1, releaseId: 1, genre: "Rock" }]);
    mocks.rowsByTable.set(mocks.schema.releaseStyles, [
      { id: 1, releaseId: 1, style: "Hard Rock" },
    ]);
    mocks.rowsByTable.set(mocks.schema.releaseOverrides, [
      { id: 1, releaseId: 1, overrideType: "genre", value: "Electronic" },
      { id: 2, releaseId: 100, overrideType: "style", value: "Techno" },
    ]);
    mocks.rowsByTable.set(mocks.schema.configSubgroups, [{ id: 1, genre: "Rock" }]);
    mocks.rowsByTable.set(mocks.schema.configConsolidations, [
      { id: 1, style: "Hard Rock", value: "Rock" },
    ]);

    const data = loadOrganizeDataFromDb();

    expect(mocks.createDb).toHaveBeenCalledTimes(1);
    expect(mocks.ensureCollectionSchema).toHaveBeenCalledWith(mocks.db);
    expect(data.collection).toHaveLength(1);
    expect(data.overrides).toEqual({
      genre: { "100": "Electronic" },
      style: { "100": "Techno" },
    });
    expect(data.dbConfig).toEqual({
      subgroup: ["Rock"],
      consolidate: { "Hard Rock": "Rock" },
    });
  });

  it("builds subgroup with style splits when style groups have multiple releases", async () => {
    const { buildOrganizedLibrary } = await import("./organize");

    const collection = [
      makeRelease(1, "Rock", "Hard Rock", "ZZ Top"),
      makeRelease(2, "Rock", "Hard Rock", "AC/DC"),
      makeRelease(3, "Rock", "Psychedelic Rock", "Pink Floyd"),
    ];

    const library = buildOrganizedLibrary(collection, {
      subgroup: ["Rock"],
      genre: {},
      style: {},
    });

    expect(library["12"]).toBeDefined();
    const rockGrouping = library["12"]?.Rock;
    expect(rockGrouping).toMatchObject({
      "Hard Rock": expect.any(Array),
      "Psychedelic Rock": expect.any(Array),
    });
  });

  it("regroups subgroup to genre when each style has one release", async () => {
    const { buildOrganizedLibrary } = await import("./organize");

    const collection = [
      makeRelease(1, "Rock", "Hard Rock", "AC/DC"),
      makeRelease(2, "Rock", "Psychedelic Rock", "Pink Floyd"),
    ];

    const library = buildOrganizedLibrary(collection, {
      subgroup: ["Rock"],
      genre: {},
      style: {},
    });

    expect(Array.isArray(library["12"]?.Rock)).toBe(true);
  });
});
