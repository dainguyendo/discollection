import { describe, expect, it } from "vitest";

import { Release } from "../types";
import { sortByArtist, sortReleaseByArtist } from "./sort";

describe("sort utilities", () => {
  it("sortByArtist compares artist names", () => {
    const a = { artist: "ABBA" };
    const b = { artist: "Queen" };

    expect(sortByArtist(a, b)).toBeLessThan(0);
    expect(sortByArtist(b, a)).toBeGreaterThan(0);
  });

  it("sortReleaseByArtist compares release primary artist", () => {
    const a = { basic_information: { artists: [{ name: "ABBA" }] } } as Release;
    const b = { basic_information: { artists: [{ name: "Queen" }] } } as Release;

    expect(sortReleaseByArtist(a, b)).toBe(-1);
    expect(sortReleaseByArtist(b, a)).toBe(1);
    expect(sortReleaseByArtist(a, a)).toBe(0);
  });
});
