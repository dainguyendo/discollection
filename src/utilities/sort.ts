import { Release } from "../types";

export function sortByArtist(a: any, b: any) {
  return a.artist?.localeCompare(b.artist);
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
