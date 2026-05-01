import type { Release } from "../types";
import type { OrganizedLibrary } from "./organize";
import { getReleasePrimaryArtist } from "./release";

export type LocatedRelease = {
  release: Release;
  format: string;
  genre: string;
  style?: string;
  sectionLabel: string;
  sectionIndex: number;
  sectionTotal: number;
  previous?: Release;
  next?: Release;
  normalizedTitle: string;
  normalizedArtist: string;
};

function normalizeText(value: string | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSectionEntries(
  releases: Release[],
  format: string,
  genre: string,
  style?: string,
): LocatedRelease[] {
  const sectionLabel = style ? `${format} > ${genre} > ${style}` : `${format} > ${genre}`;

  return releases.map((release, index) => ({
    release,
    format,
    genre,
    style,
    sectionLabel,
    sectionIndex: index,
    sectionTotal: releases.length,
    previous: index > 0 ? releases[index - 1] : undefined,
    next: index < releases.length - 1 ? releases[index + 1] : undefined,
    normalizedTitle: normalizeText(release.basic_information.title),
    normalizedArtist: normalizeText(getReleasePrimaryArtist(release)),
  }));
}

export function buildLocatedReleases(library: OrganizedLibrary): LocatedRelease[] {
  const located: LocatedRelease[] = [];

  for (const [format, genreGrouping] of Object.entries(library)) {
    for (const [genre, grouped] of Object.entries(genreGrouping)) {
      if (Array.isArray(grouped)) {
        located.push(...buildSectionEntries(grouped, format, genre));
        continue;
      }

      for (const [style, styleReleases] of Object.entries(grouped)) {
        located.push(...buildSectionEntries(styleReleases, format, genre, style));
      }
    }
  }

  return located;
}
