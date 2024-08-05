import { Release } from "@prisma/client";

export function toReleaseObject(release: Release) {
  return {
    title: release.title,
    artist: release.artist,
  };
}
