import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const logger = {
    info: vi.fn(),
  };

  const resolveDbPath = vi.fn(() => "./tmp/test.db");
  const ensureCollectionSchema = vi.fn();

  const schema = {
    collectionReleases: { table: "collection_releases" },
    releaseGenres: { table: "release_genres" },
    releaseStyles: { table: "release_styles" },
  };

  const getReleaseFormat = vi.fn(() => "12");
  const getReleasePrimaryArtist = vi.fn(() => "Artist");

  const insertedReleases: Array<{ id: number; instanceId: number }> = [];

  const tx = {
    delete: vi.fn(() => ({ run: vi.fn() })),
    insert: vi.fn((table) => ({
      values: vi.fn((payload) => ({
        run: vi.fn(() => {
          if (table === schema.collectionReleases) {
            insertedReleases.push({
              id: insertedReleases.length + 1,
              instanceId: payload.instanceId,
            });
          }
        }),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({ all: vi.fn(() => insertedReleases) })),
    })),
  };

  const db = {
    transaction: vi.fn((callback: (value: typeof tx) => void) => callback(tx)),
  };

  const createDb = vi.fn(() => db);

  return {
    logger,
    resolveDbPath,
    ensureCollectionSchema,
    schema,
    getReleaseFormat,
    getReleasePrimaryArtist,
    insertedReleases,
    tx,
    db,
    createDb,
  };
});

vi.mock("../logger", () => ({ default: mocks.logger }));

vi.mock("discollection-db", () => ({
  createDb: mocks.createDb,
  ensureCollectionSchema: mocks.ensureCollectionSchema,
  resolveDbPath: mocks.resolveDbPath,
  schema: mocks.schema,
}));

vi.mock("./release", () => ({
  getReleaseFormat: mocks.getReleaseFormat,
  getReleasePrimaryArtist: mocks.getReleasePrimaryArtist,
}));

function makeRelease(id: number): any {
  return {
    id,
    instance_id: id,
    folder_id: 0,
    rating: 0,
    basic_information: {
      id,
      title: `Release ${id}`,
      year: 2020,
      resource_url: "url",
      thumb: "",
      cover_image: "",
      formats: [],
      labels: [],
      artists: [{ name: "Artist" }],
      genres: ["Rock"],
      styles: ["Hard Rock"],
    },
    notes: [],
  };
}

describe("persistCollectionToDb", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.insertedReleases.length = 0;
  });

  it("persists collection releases and related genres/styles", async () => {
    const { persistCollectionToDb } = await import("./persist-collection");

    persistCollectionToDb([makeRelease(1), makeRelease(2)], {
      dbPath: "./custom.db",
    });

    expect(mocks.resolveDbPath).toHaveBeenCalledWith("./custom.db");
    expect(mocks.createDb).toHaveBeenCalledWith({ filePath: "./tmp/test.db" });
    expect(mocks.ensureCollectionSchema).toHaveBeenCalledWith(mocks.db);

    expect(mocks.tx.delete).toHaveBeenCalledWith(mocks.schema.releaseStyles);
    expect(mocks.tx.delete).toHaveBeenCalledWith(mocks.schema.releaseGenres);
    expect(mocks.tx.delete).toHaveBeenCalledWith(
      mocks.schema.collectionReleases,
    );

    expect(mocks.insertedReleases).toHaveLength(2);
    expect(mocks.getReleaseFormat).toHaveBeenCalledTimes(2);
    expect(mocks.getReleasePrimaryArtist).toHaveBeenCalledTimes(2);

    expect(mocks.logger.info).toHaveBeenCalledWith(
      "Saved collection snapshot to database",
      {
        total: 2,
      },
    );
  });
});
