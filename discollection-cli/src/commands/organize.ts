import { list } from "../api";
import fs from "fs";
import logger from "../logger";

import groupBy from "lodash/groupBy";
import { Configuration, GetReleasesResponse, Release } from "../types";
import { sortReleaseByArtist } from "../utilities/sort";

const lpRegex = /\bLP\b/;
const albumRegex = /\bAlbum\b/;

export const organizeAction = async (
  output: string,
  options: { cache: boolean; config?: string },
) => {
  logger.info("Organizing collection", { options });

  let library = {} as any;
  let config: Configuration | undefined;

  let collection: GetReleasesResponse["releases"];
  if (options.cache) {
    collection = JSON.parse(
      fs.readFileSync("cache.json", "utf-8"),
    ) as GetReleasesResponse["releases"];
  } else {
    collection = await list();

    fs.writeFileSync("cache.json", JSON.stringify(collection, null, 2));

    logger.info("Fetched collection", { total: collection.length });
    logger.info("Saved collection to cache");
  }

  if (options.config) {
    logger.info("Using config file", { path: options.config });
    config = JSON.parse(fs.readFileSync(options.config, "utf-8"));
  }

  const formatGrouping = groupBy(collection, getReleaseFormat);

  Object.entries(formatGrouping).forEach(([format, releases]) => {
    const genreGrouping = groupBy(releases, (release) =>
      getReleaseGenre(release, 0, config),
    );

    Object.entries(genreGrouping).forEach(([genre, releases]) => {
      if (config?.subgroup.includes(genre)) {
        const styleGrouping = groupBy(releases, (release) =>
          getReleaseStyle(release, 0, config),
        );

        // If all styles have 1 release, regroup under the genre
        if (Object.values(styleGrouping).every((r) => r.length === 1)) {
          library[format] = {
            ...library[format],
            [genre]: releases.sort(sortReleaseByArtist),
          };

          return;
        }

        const sorted = Object.entries(styleGrouping).reduce(
          (acc, [style, releases]) => {
            acc[style] = releases.sort(sortReleaseByArtist);
            return acc;
          },
          {} as any,
        );

        // then attach to library
        library[format] = {
          ...library[format],
          [genre]: sorted,
        };
      } else {
        // sort by artist then title
        const sorted = releases.sort(sortReleaseByArtist);
        // then attach to library
        library[format] = {
          ...library[format],
          [genre]: sorted,
        };
      }
    });
  });

  logger.info("Finished organizing collection", {
    total: collection.length,
  });

  if (!output) {
    logger.error("No output file specified. Exiting.");
  }

  fs.writeFileSync(output, JSON.stringify(library, null, 2));
  logger.info("Saved organized collection", { output });
};

type Format = "12" | "10" | "7";

function getReleaseFormat(release: any): Format {
  const { basic_information } = release;
  const { formats } = basic_information;
  const { descriptions } = formats[0];

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

function getReleaseGenre(release: Release, idx = 0, config?: Configuration) {
  const { basic_information } = release;
  const { genres, id } = basic_information;

  if (config?.genre[id]) {
    return config.genre[id];
  }

  return genres[idx];
}

function getReleaseStyle(release: Release, idx = 0, config?: Configuration) {
  const { basic_information } = release;
  const { styles, id } = basic_information;

  if (config?.style[id]) {
    return config.style[id];
  }

  const style = styles[idx];

  const consolidationConfig = config?.consolidate || {};

  return style ? consolidationConfig[style] || style : undefined;
}

function getReleaseTitleAndArtist(release: Release) {
  const { basic_information } = release;
  const { title, artists } = basic_information;

  return `${artists[0]?.name} - ${title}`;
}
