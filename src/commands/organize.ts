import { Command } from "commander";
import { list } from "../api";
import fs from "fs";
import logger from "../logger";

import groupBy from "lodash/groupBy";
import { GetReleasesResponse, Release } from "../types";
import { sortReleaseByArtist } from "../utilities/sort";

const lpRegex = /\bLP\b/;
const albumRegex = /\bAlbum\b/;

export default (program: Command) => {
  program
    .command("organize")
    .argument("<output>", "Out file destination")
    .option("--cache", "Use cache", false)
    .option(
      "--style-grouping-minimum [number]",
      "Minimum number of releases to group by style",
      "15",
    )
    .description("(opinionated) Organize the collection")
    .action(async (output, options) => {
      logger.info("Organizing collection", { options });

      const styleGroupingMinimum = parseInt(options.styleGroupingMinimum, 10);

      let library = {} as any;

      let collection: GetReleasesResponse["releases"];

      if (options.cache) {
        collection = JSON.parse(
          fs.readFileSync("collection.json", "utf-8"),
        ) as GetReleasesResponse["releases"];
      } else {
        collection = await list();

        fs.writeFileSync(
          "collection.json",
          JSON.stringify(collection, null, 2),
        );

        logger.info("Fetched collection", { total: collection.length });
        logger.info("Saved collection to cache");
      }

      const formatGrouping = groupBy(collection, getReleaseFormat);

      Object.entries(formatGrouping).forEach(([format, releases]) => {
        const genreGrouping = groupBy(releases, getReleaseGenre);

        Object.entries(genreGrouping).forEach(([genre, releases]) => {
          if (releases.length > styleGroupingMinimum) {
            const styleGrouping = groupBy(releases, getReleaseStyle);

            /**
             * Once broken down by stlye, for styles with less than 2 releases,
             * regroup by selecting the second style list if it exists.
             */
            Object.entries(styleGrouping).forEach(([_style, releases]) => {
              if (releases.length < 3) {
                releases.forEach((release) => {
                  const firstStyle = getReleaseStyle(release, 0) || "";
                  const secondStyle = getReleaseStyle(release, 1);

                  if (secondStyle && firstStyle !== secondStyle) {
                    if (styleGrouping[secondStyle]) {
                      styleGrouping[secondStyle] = [
                        ...styleGrouping[secondStyle],
                        release,
                      ];
                    } else {
                      styleGrouping[secondStyle] = [release];
                    }

                    delete styleGrouping[firstStyle];
                  }
                });
              }
            });

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
    });
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

function getReleaseGenre(release: Release, idx = 0) {
  const { basic_information } = release;
  const { genres } = basic_information;

  return genres[idx];
}

function getReleaseStyle(release: Release, idx = 0) {
  const { basic_information } = release;
  const { styles } = basic_information;

  return styles[idx];
}

function getReleaseTitleAndArtist(release: Release) {
  const { basic_information } = release;
  const { title, artists } = basic_information;

  return `${artists[0]?.name} - ${title}`;
}
