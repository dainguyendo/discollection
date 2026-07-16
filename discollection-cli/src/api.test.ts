import { beforeEach, describe, expect, it, vi } from "vitest";

const logger = {
  info: vi.fn(),
  error: vi.fn(),
};

const get = vi.fn();
const extend = vi.fn(() => ({ get }));

vi.mock("ky", () => ({
  default: {
    extend,
  },
}));

vi.mock("./logger", () => ({
  default: logger,
}));

describe("api.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.DISCOGS_USER = "user";
    process.env.DISCOGS_FOLDER_ID = "0";
    process.env.DISCOGS_PERSONAL_ACCESS_TOKEN = "token";
    vi.spyOn(global, "setTimeout").mockImplementation((handler: () => void) => {
      handler();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    });
  });

  it("iterates all pages and returns combined releases", async () => {
    get
      .mockResolvedValueOnce({
        json: async () => ({
          pagination: {
            page: 1,
            urls: { next: "https://api.discogs.com/next" },
          },
          releases: [{ id: 1 }],
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          pagination: { page: 2, urls: {} },
          releases: [{ id: 2 }],
        }),
      });

    const { list } = await import("./api");
    const result = await list();

    expect(extend).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledTimes(2);
    expect(get).toHaveBeenNthCalledWith(
      1,
      "https://api.discogs.com/users/user/collection/folders/0/releases?per_page=100",
    );
    expect(get).toHaveBeenNthCalledWith(2, "https://api.discogs.com/next?per_page=100");
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("returns empty list and logs when request fails", async () => {
    const failure = new Error("request failed");
    get.mockRejectedValueOnce(failure);

    const { list } = await import("./api");
    const result = await list();

    expect(result).toEqual([]);
    expect(logger.error).toHaveBeenCalledWith(failure);
  });
});
