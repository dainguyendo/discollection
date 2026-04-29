import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Release } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getReleaseArtist(release: Release): string {
  if (
    !release ||
    !release.basic_information ||
    !release.basic_information.artists
  ) {
    return "Unknown Artist";
  }

  return release.basic_information.artists
    .map((artist) => artist.name)
    .join(", ");
}

export function getReleaseLabel(release: Release): string {
  if (
    !release ||
    !release.basic_information ||
    !release.basic_information.labels
  ) {
    return "Unknown Label";
  }

  return release.basic_information.labels
    .map((label) => `${label.name} (${label.catno})`)
    .join(", ");
}
