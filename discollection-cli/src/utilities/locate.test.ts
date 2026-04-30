import { describe, expect, it } from "vitest";
import type { Release } from "../types";
import { buildLocatedReleases } from "./locate";
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

describe("buildLocatedReleases", () => {
  it("creates positioned entries for genre-only sections", () => {
    const library: OrganizedLibrary = {
      "12": {
        Rock: [
          makeRelease(1, "Back in Black", "AC/DC"),
          makeRelease(2, "Paranoid", "Black Sabbath"),
        ],
      },
    };

    const located = buildLocatedReleases(library);

    expect(located).toHaveLength(2);
    expect(located[0].sectionLabel).toBe("12 > Rock");
    expect(located[0].sectionIndex).toBe(0);
    expect(located[0].sectionTotal).toBe(2);
    expect(located[0].previous).toBeUndefined();
    expect(located[0].next?.basic_information.title).toBe("Paranoid");

    expect(located[1].previous?.basic_information.title).toBe("Back in Black");
    expect(located[1].next).toBeUndefined();
  });

  it("creates positioned entries for style-subgrouped sections", () => {
    const library: OrganizedLibrary = {
      "12": {
        Rock: {
          "Hard Rock": [makeRelease(3, "Highway to Hell", "AC/DC")],
        },
      },
    };

    const located = buildLocatedReleases(library);

    expect(located).toHaveLength(1);
    expect(located[0].sectionLabel).toBe("12 > Rock > Hard Rock");
    expect(located[0].sectionTotal).toBe(1);
  });
});
