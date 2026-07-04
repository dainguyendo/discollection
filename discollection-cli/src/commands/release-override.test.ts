import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const logger = {
    error: vi.fn(),
    info: vi.fn(),
  };

  const run = vi.fn();
  const onConflictDoUpdate = vi.fn(() => ({ run }));
  const values = vi.fn(() => ({ onConflictDoUpdate }));
  const insert = vi.fn(() => ({ values }));
  const db = { insert };

  const ensureCollectionSchema = vi.fn();
  const createDb = vi.fn(() => db);

  const releaseOverrides = {
    releaseId: "release_id_column",
    overrideType: "override_type_column",
  };

  return {
    logger,
    run,
    onConflictDoUpdate,
    values,
    insert,
    db,
    ensureCollectionSchema,
    createDb,
    releaseOverrides,
  };
});

vi.mock("../logger", () => ({
  default: mocks.logger,
}));

vi.mock("discollection-db", () => ({
  createDb: mocks.createDb,
  ensureCollectionSchema: mocks.ensureCollectionSchema,
  schema: {
    releaseOverrides: mocks.releaseOverrides,
  },
}));

describe("releaseOverrideAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs and exits for invalid release ID", async () => {
    const { releaseOverrideAction } = await import("./release-override");
    releaseOverrideAction("bad", "Rock");

    expect(mocks.logger.error).toHaveBeenCalledWith("Release ID must be a positive integer", {
      releaseIdText: "bad",
    });
    expect(mocks.createDb).not.toHaveBeenCalled();
  });

  it("logs and exits for empty override value", async () => {
    const { releaseOverrideAction } = await import("./release-override");
    releaseOverrideAction("123", "   ");

    expect(mocks.logger.error).toHaveBeenCalledWith("Override value cannot be empty");
    expect(mocks.createDb).not.toHaveBeenCalled();
  });

  it("infers genre override for official genres", async () => {
    const { releaseOverrideAction } = await import("./release-override");
    releaseOverrideAction("123", " Rock ");

    expect(mocks.createDb).toHaveBeenCalledTimes(1);
    expect(mocks.ensureCollectionSchema).toHaveBeenCalledWith(mocks.db);
    expect(mocks.insert).toHaveBeenCalledWith(mocks.releaseOverrides);
    expect(mocks.values).toHaveBeenCalledWith({
      releaseId: 123,
      overrideType: "genre",
      value: "Rock",
    });
    expect(mocks.onConflictDoUpdate).toHaveBeenCalledWith({
      target: [mocks.releaseOverrides.releaseId, mocks.releaseOverrides.overrideType],
      set: { value: "Rock" },
    });
    expect(mocks.run).toHaveBeenCalledTimes(1);
  });

  it("infers genre override for Discogs 'Hip Hop' genre", async () => {
    const { releaseOverrideAction } = await import("./release-override");
    releaseOverrideAction("789", "Hip Hop");

    expect(mocks.values).toHaveBeenCalledWith({
      releaseId: 789,
      overrideType: "genre",
      value: "Hip Hop",
    });
  });

  it("infers style override when value is not official genre", async () => {
    const { releaseOverrideAction } = await import("./release-override");
    releaseOverrideAction("456", "Hard Rock");

    expect(mocks.values).toHaveBeenCalledWith({
      releaseId: 456,
      overrideType: "style",
      value: "Hard Rock",
    });
    expect(mocks.logger.info).toHaveBeenCalledWith("Saved release override", {
      releaseId: 456,
      overrideType: "style",
      value: "Hard Rock",
      guideline:
        "https://support.discogs.com/hc/en-us/articles/360005055213-Database-Guidelines-9-Genres-Styles",
    });
  });
});
