export function sortByArtist(a: any, b: any) {
  return a.artist?.localeCompare(b.artist);
}
