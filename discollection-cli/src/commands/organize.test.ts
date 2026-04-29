import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const logger = {
    error: vi.fn(),
    info: vi.fn(),
  };

  const readFileSync = vi.fn();
  const writeFileSync = vi.fn();

  const loadOrganizeDataFromDb = vi.fn(() => ({
    collection: [{ id: 1 }],
    overrides: { genre: { "1": "Rock" }, style: { "1": "Hard Rock" } },
    dbConfig: { subgroup: ["Rock"], consolidate: { "Hard Rock": "Rock" } },
  }));

  const buildOrganizedLibrary = vi.fn(() => ({ 12: { Rock: [] } }));

  return {
    logger,
    readFileSync,
    writeFileSync,
    loadOrganizeDataFromDb,
    buildOrganizedLibrary,
  };
});

vi.mock("fs", () => ({
  default: {
    readFileSync: mocks.readFileSync,
    writeFileSync: mocks.writeFileSync,
  },
}));

vi.mock("../logger", () => ({
  default: mocks.logger,
}));

vi.mock("../utilities/organize", () => ({
  loadOrganizeDataFromDb: mocks.loadOrganizeDataFromDb,
  buildOrganizedLibrary: mocks.buildOrganizedLibrary,
}));

describe("organizeAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("writes organized output using DB config by default", async () => {
    const { organizeAction } = await import("./organize");
    await organizeAction("./out.json", {});

    expect(mocks.loadOrganizeDataFromDb).toHaveBeenCalledTimes(1);
    expect(mocks.buildOrganizedLibrary).toHaveBeenCalledWith([{ id: 1 }], {
      subgroup: ["Rock"],
      consolidate: { "Hard Rock": "Rock" },
      genre: { "1": "Rock" },
      style: { "1": "Hard Rock" },
    });
    expect(mocks.writeFileSync).toHaveBeenCalledWith(
      "./out.json",
      JSON.stringify({ 12: { Rock: [] } }, null, 2),
    );
  });

  it("prefers subgroup/consolidate from file config when provided", async () => {
    const { organizeAction } = await import("./organize");

    mocks.readFileSync.mockReturnValueOnce(
      JSON.stringify({
        subgroup: ["Electronic"],
        consolidate: { Techno: "Electronic" },
      }),
    );

    await organizeAction("./out.json", { config: "./config.json" });

    expect(mocks.buildOrganizedLibrary).toHaveBeenCalledWith([{ id: 1 }], {
      subgroup: ["Electronic"],
      consolidate: { Techno: "Electronic" },
      genre: { "1": "Rock" },
      style: { "1": "Hard Rock" },
    });
  });

  it("returns early when output is missing", async () => {
    const { organizeAction } = await import("./organize");
    await organizeAction("", {});

    expect(mocks.logger.error).toHaveBeenCalledWith(
      "No output file specified. Exiting.",
    );
    expect(mocks.writeFileSync).not.toHaveBeenCalled();
  });
});
