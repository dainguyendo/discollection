import { Command } from "commander";
import { list } from "../api";
import fs from "fs";
import logger from "../logger";

import groupBy from "lodash/groupBy";

const lpRegex = /\bLP\b/;
const albumRegex = /\bAlbum\b/;

export default (program: Command) => {
  program
    .command("organize")
    .description("(opinionated) Organize the collection")
    .action(async () => {
      /**
       * This command will organize the collection in an opinionated way.
       * First, it sort by into vinyl record sizes (12", 10", or 7").
       * Then, within each size,
       *    if the release is an LP, organize under the first Genre.
       *    if the release is not an LP, organize under the first Style.
       * Then within each Genre or Style, sort by Artist. And then by Title.
       */

      let library = {} as any;

      // const data = await list();
      // fs.writeFileSync("collection.json", JSON.stringify(data, null, 2));

      const collection = JSON.parse(
        fs.readFileSync("collection.json", "utf-8"),
      );

      const formatGrouping = groupBy(collection, getReleaseFormat);

      Object.entries(formatGrouping).forEach(([format, releases]) => {
        const genreGrouping = groupBy(releases, getReleaseGenre);

        Object.entries(genreGrouping).forEach(([genre, releases]) => {
          if (releases.length > 15) {
            // group into style
            const styleGrouping = groupBy(releases, getReleaseStyle);
            // sort by artist then title
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

      console.log({ library });
      fs.writeFileSync("organization.json", JSON.stringify(library, null, 2));
    });
};

function sortReleaseByArtist(a, b) {
  const artistA = a.basic_information.artists[0].name;
  const artistB = b.basic_information.artists[0].name;

  if (artistA < artistB) {
    return -1;
  }

  if (artistA > artistB) {
    return 1;
  }

  return 0;
}

type Format = "12" | "10" | "7";

// function findDistinctFormats(data: any) {
//   const twelveRegex = /\b12\b/;
//   const tenRegex = /\b10\b/;
//   const sevenRegex = /\b7\b/;

//   const formatSet = new Set<Format>();

//   data.forEach((release: any) => {
//     const { basic_information } = release;
//     const { formats } = basic_information;
//     const { descriptions } = formats[0];

//     const twelve = descriptions.some(twelveRegex.test.bind(twelveRegex));
//     const ten = descriptions.some(tenRegex.test.bind(tenRegex));
//     const seven = descriptions.some(sevenRegex.test.bind(sevenRegex));

//     switch (true) {
//       case twelve:
//         formatSet.add("12");
//         break;
//       case ten:
//         formatSet.add("10");
//         break;
//       case seven:
//         formatSet.add("7");
//         break;
//       default:
//         formatSet.add("other");
//         break;
//     }
//   });

//   return Array.from(formatSet);
// }

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

function getReleaseGenre(release: any) {
  const { basic_information } = release;
  const { genres } = basic_information;

  return genres[0];
}

function getReleaseStyle(release: any) {
  const { basic_information } = release;
  const { styles } = basic_information;

  return styles[0];
}

function getReleaseTitleAndArtist(release: any) {
  const { basic_information } = release;
  const { title, artists } = basic_information;

  return `${artists[0].name} - ${title}`;
}
