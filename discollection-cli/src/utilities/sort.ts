import { Release } from "../types";

interface HasArtist {
  artist?: string;
}

export function sortByArtist(a: HasArtist, b: HasArtist) {
  return a.artist?.localeCompare(b.artist ?? "") ?? 0;
}

export function sortReleaseByArtist(a: Release, b: Release) {
  const artistA = a?.basic_information.artists?.[0]?.name;
  const artistB = b?.basic_information.artists?.[0]?.name;

  // @ts-ignore
  if (artistA < artistB) {
    return -1;
  }

  // @ts-ignore
  if (artistA > artistB) {
    return 1;
  }

  return 0;
}
