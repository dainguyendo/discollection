import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock("../logger", () => ({
  default: mocks.logger,
}));

function makeRelease(overrides: Record<string, unknown> = {}): any {
  return {
    id: 1,
    instance_id: 11,
    folder_id: 0,
    rating: 0,
    basic_information: {
      id: 1,
      title: "Album",
      year: 2000,
      resource_url: "url",
      thumb: "thumb",
      cover_image: "cover",
      formats: [{ qty: "1", descriptions: ["12"], name: "Vinyl" }],
      labels: [],
      artists: [{ name: "Artist" }],
      genres: ["Rock"],
      styles: ["Hard Rock"],
    },
    notes: [],
    ...overrides,
  };
}

describe("release utilities", () => {
  it("gets primary artist and title string", async () => {
    const { getReleasePrimaryArtist, getReleaseTitleAndArtist } = await import(
      "./release"
    );

    const release = makeRelease();

    expect(getReleasePrimaryArtist(release)).toBe("Artist");
    expect(getReleaseTitleAndArtist(release)).toBe("Artist - Album");
  });

  it("detects 12, 10, 7 formats", async () => {
    const { getReleaseFormat } = await import("./release");

    expect(getReleaseFormat(makeRelease())).toBe("12");

    const ten = makeRelease({
      basic_information: {
        ...makeRelease().basic_information,
        formats: [{ qty: "1", descriptions: ["10"], name: "Vinyl" }],
      },
    });
    expect(getReleaseFormat(ten)).toBe("10");

    const seven = makeRelease({
      basic_information: {
        ...makeRelease().basic_information,
        formats: [{ qty: "1", descriptions: ["7"], name: "Vinyl" }],
      },
    });
    expect(getReleaseFormat(seven)).toBe("7");
  });

  it("treats LP and Album descriptions as 12", async () => {
    const { getReleaseFormat } = await import("./release");

    const lp = makeRelease({
      basic_information: {
        ...makeRelease().basic_information,
        formats: [{ qty: "1", descriptions: ["LP"], name: "Vinyl" }],
      },
    });
    expect(getReleaseFormat(lp)).toBe("12");

    const album = makeRelease({
      basic_information: {
        ...makeRelease().basic_information,
        formats: [{ qty: "1", descriptions: ["Album"], name: "Vinyl" }],
      },
    });
    expect(getReleaseFormat(album)).toBe("12");
  });

  it("throws for unknown formats", async () => {
    const { getReleaseFormat } = await import("./release");

    const unknown = makeRelease({
      basic_information: {
        ...makeRelease().basic_information,
        formats: [{ qty: "1", descriptions: ["Cassette"], name: "Tape" }],
      },
    });

    expect(() => getReleaseFormat(unknown)).toThrowError("Unknown format");
    expect(mocks.logger.error).toHaveBeenCalled();
  });

  it("uses genre and style overrides", async () => {
    const { getReleaseGenre, getReleaseStyle } = await import("./release");

    const release = makeRelease();

    expect(
      getReleaseGenre(release, 0, {
        subgroup: [],
        genre: { 1: "Electronic" },
        style: {},
      }),
    ).toBe("Electronic");

    expect(
      getReleaseStyle(release, 0, {
        subgroup: [],
        genre: {},
        style: { 1: "Techno" },
      }),
    ).toBe("Techno");
  });

  it("applies style consolidation fallback", async () => {
    const { getReleaseStyle } = await import("./release");

    const release = makeRelease();

    expect(
      getReleaseStyle(release, 0, {
        subgroup: [],
        genre: {},
        style: {},
        consolidate: { "Hard Rock": "Rock" },
      }),
    ).toBe("Rock");
  });
});
