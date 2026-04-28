import logger from "../logger";
import { Configuration, Release } from "../types";

const lpRegex = /\bLP\b/;
const albumRegex = /\bAlbum\b/;

export type ReleaseFormat = "12" | "10" | "7";

export function getReleasePrimaryArtist(release: Release): string | undefined {
  return release.basic_information.artists?.[0]?.name;
}

export function getReleaseTitleAndArtist(release: Release): string {
  const { title } = release.basic_information;
  return `${getReleasePrimaryArtist(release)} - ${title}`;
}

export function getReleaseFormat(release: Release): ReleaseFormat {
  const descriptions =
    release.basic_information.formats?.[0]?.descriptions ?? [];

  const twelveRegex = /\b12\b/;
  const tenRegex = /\b10\b/;
  const sevenRegex = /\b7\b/;

  const twelve = descriptions.some(twelveRegex.test.bind(twelveRegex));
  const ten = descriptions.some(tenRegex.test.bind(tenRegex));
  const seven = descriptions.some(sevenRegex.test.bind(sevenRegex));

  const album = descriptions.some(albumRegex.test.bind(albumRegex));
  const lp = descriptions.some(lpRegex.test.bind(lpRegex));

  switch (true) {
    // Consider LPs and Albums as 12"
    case twelve:
    case album:
    case lp:
      return "12";
    case ten:
      return "10";
    case seven:
      return "7";
    default: {
      logger.error("Unknown format. Manually check the release.", {
        release: getReleaseTitleAndArtist(release),
      });

      throw new Error("Unknown format");
    }
  }
}

export function getReleaseGenre(
  release: Release,
  idx = 0,
  config?: Configuration,
): string | undefined {
  const { genres, id } = release.basic_information;

  if (config?.genre[id]) {
    return config.genre[id];
  }

  return genres[idx];
}

export function getReleaseStyle(
  release: Release,
  idx = 0,
  config?: Configuration,
): string | undefined {
  const { styles, id } = release.basic_information;

  if (config?.style[id]) {
    return config.style[id];
  }

  const style = styles[idx];
  const consolidationConfig = config?.consolidate || {};

  return style ? consolidationConfig[style] || style : undefined;
}
