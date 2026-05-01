import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const logger = {
    error: vi.fn(),
    info: vi.fn(),
  };

  const readFileSync = vi.fn();

  const deleteRun = vi.fn();
  const insertRun = vi.fn();
  const insertValues = vi.fn(() => ({ run: insertRun }));
  const tx = {
    delete: vi.fn(() => ({ run: deleteRun })),
    insert: vi.fn(() => ({ values: insertValues })),
  };

  const db = {
    transaction: vi.fn((callback: (value: typeof tx) => void) => callback(tx)),
  };

  const createDb = vi.fn(() => db);
  const ensureCollectionSchema = vi.fn();

  const schema = {
    releaseOverrides: { table: "release_overrides" },
    configSubgroups: { table: "config_subgroups" },
    configConsolidations: { table: "config_consolidations" },
  };

  return {
    logger,
    readFileSync,
    insertValues,
    tx,
    db,
    createDb,
    ensureCollectionSchema,
    schema,
  };
});

vi.mock("fs", () => ({
  default: {
    readFileSync: mocks.readFileSync,
  },
}));

vi.mock("../logger", () => ({
  default: mocks.logger,
}));

vi.mock("discollection-db", () => ({
  createDb: mocks.createDb,
  ensureCollectionSchema: mocks.ensureCollectionSchema,
  schema: mocks.schema,
}));

describe("seedAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires --config path", async () => {
    const { seedAction } = await import("./seed");
    seedAction({});

    expect(mocks.logger.error).toHaveBeenCalledWith(
      "No config file specified. Use --config <path>.",
    );
    expect(mocks.createDb).not.toHaveBeenCalled();
  });

  it("seeds overrides and organize config rows", async () => {
    const { seedAction } = await import("./seed");

    mocks.readFileSync.mockReturnValueOnce(
      JSON.stringify({
        subgroup: ["Rock"],
        consolidate: { "Hard Rock": "Rock" },
        genre: { "100": "Rock" },
        style: { "200": "Hard Rock" },
      }),
    );

    seedAction({ config: "./config.json" });

    expect(mocks.createDb).toHaveBeenCalledTimes(1);
    expect(mocks.ensureCollectionSchema).toHaveBeenCalledWith(mocks.db);

    expect(mocks.tx.delete).toHaveBeenCalledWith(mocks.schema.releaseOverrides);
    expect(mocks.tx.delete).toHaveBeenCalledWith(mocks.schema.configSubgroups);
    expect(mocks.tx.delete).toHaveBeenCalledWith(mocks.schema.configConsolidations);

    expect(mocks.tx.insert).toHaveBeenCalledWith(mocks.schema.releaseOverrides);
    expect(mocks.insertValues).toHaveBeenCalledWith([
      { releaseId: 100, overrideType: "genre", value: "Rock" },
      { releaseId: 200, overrideType: "style", value: "Hard Rock" },
    ]);

    expect(mocks.tx.insert).toHaveBeenCalledWith(mocks.schema.configSubgroups);
    expect(mocks.insertValues).toHaveBeenCalledWith([{ genre: "Rock" }]);

    expect(mocks.tx.insert).toHaveBeenCalledWith(mocks.schema.configConsolidations);
    expect(mocks.insertValues).toHaveBeenCalledWith([{ style: "Hard Rock", value: "Rock" }]);

    expect(mocks.logger.info).toHaveBeenCalledWith("Seeded organize configuration", {
      releaseOverrides: 2,
      subgroups: 1,
      consolidations: 1,
    });
  });
});
