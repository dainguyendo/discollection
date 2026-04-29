import { describe, expect, it } from "vitest";
import { sortByArtist, sortReleaseByArtist } from "./sort";

describe("sort utilities", () => {
  it("sortByArtist compares artist names", () => {
    const a = { artist: "ABBA" };
    const b = { artist: "Queen" };

    expect(sortByArtist(a, b)).toBeLessThan(0);
    expect(sortByArtist(b, a)).toBeGreaterThan(0);
  });

  it("sortReleaseByArtist compares release primary artist", () => {
    const a: any = { basic_information: { artists: [{ name: "ABBA" }] } };
    const b: any = { basic_information: { artists: [{ name: "Queen" }] } };

    expect(sortReleaseByArtist(a, b)).toBe(-1);
    expect(sortReleaseByArtist(b, a)).toBe(1);
    expect(sortReleaseByArtist(a, a)).toBe(0);
  });
});
