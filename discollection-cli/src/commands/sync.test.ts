import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const collection = [{ id: 1 }, { id: 2 }];
  return {
    collection,
    list: vi.fn(async () => collection),
    persistCollectionToDb: vi.fn(),
  };
});

vi.mock("../api", () => ({ list: mocks.list }));
vi.mock("../utilities/persist-collection", () => ({
  persistCollectionToDb: mocks.persistCollectionToDb,
}));
vi.mock("../logger", () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("syncAction", () => {
  it("fetches collection and persists it", async () => {
    const { syncAction } = await import("./sync");
    await syncAction();

    expect(mocks.list).toHaveBeenCalledTimes(1);
    expect(mocks.persistCollectionToDb).toHaveBeenCalledWith(mocks.collection);
  });
});
