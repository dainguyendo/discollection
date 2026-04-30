import { describe, expect, it } from "vitest";
import type { Release } from "../types";
import { buildLocatedReleases } from "./locate";
import { createLocateSearcher } from "./locate-search";
import type { OrganizedLibrary } from "./organize";

function makeRelease(id: number, title: string, artist: string): Release {
  return {
    id,
    instance_id: id,
    folder_id: 0,
    rating: 0,
    basic_information: {
      id,
      title,
      year: 2000,
      resource_url: "url",
      thumb: "",
      cover_image: "",
      formats: [{ qty: "1", descriptions: ["12"], name: "Vinyl" }],
      labels: [],
      artists: [
        {
          id,
          name: artist,
          join: "",
          resource_url: "",
          anv: "",
          tracks: "",
          role: "",
        },
      ],
      genres: ["Rock"],
      styles: ["Hard Rock"],
    },
    notes: [],
  };
}

function makeSearcher() {
  const library: OrganizedLibrary = {
    "12": {
      Rock: [
        makeRelease(1, "Back in Black", "AC/DC"),
        makeRelease(2, "Paranoid", "Black Sabbath"),
      ],
    },
  };

  const located = buildLocatedReleases(library);
  return createLocateSearcher(located);
}

describe("createLocateSearcher", () => {
  it("returns high confidence for clear title query", () => {
    const searcher = makeSearcher();
    const result = searcher.search("back in black");

    expect(result.confidence).toBe("high");
    expect(result.top?.release.basic_information.title).toBe("Back in Black");
  });

  it("rejects artist-only query to enforce title evidence", () => {
    const searcher = makeSearcher();
    const result = searcher.search("acdc");

    expect(result.confidence).toBe("requires-title");
  });

  it("accepts artist + title spoken queries", () => {
    const searcher = makeSearcher();
    const result = searcher.search("ac dc back in black");

    expect(result.top?.release.basic_information.title).toBe("Back in Black");
    expect(["high", "medium"]).toContain(result.confidence);
  });

  it("returns exact unique title match reliably", () => {
    const searcher = makeSearcher();
    const result = searcher.search("paranoid");

    expect(result.top?.release.basic_information.title).toBe("Paranoid");
    expect(result.confidence).toBe("high");
    expect(result.reason).toContain("Exact unique title match");
  });
});
