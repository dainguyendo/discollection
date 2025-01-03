import { Command } from "commander";
import { list } from "../api";
import fs from "fs";
import logger from "../logger";

const lpRegex = /\bLP\b/;

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
      const library = {} as any;

      //   const data = await list();
      const collection = JSON.parse(
        fs.readFileSync("collection.json", "utf-8"),
      );

      const formatsInCollection = findDistinctFormats(collection);
      formatsInCollection.forEach((format) => {
        library[format] = {};
      });

      collection.forEach((release: any) => {
        const format = getReleaseFormat(release);
        const genre = getReleaseGenre(release);
        const style = getReleaseStyle(release);

        if (!library[format]) {
          library[format] = {};
        }

        switch (true) {
          case Boolean(genre): {
            if (!library[format][genre]) {
              library[format][genre] = [];
            }

            library[format][genre].push(release);
            break;
          }
          case Boolean(style): {
            if (!library[format][style]) {
              library[format][style] = [];
            }

            library[format][style].push(release);
            break;
          }
          default: {
            if (!library[format]["other"]) {
              library[format]["other"] = [];
            }

            library[format]["other"].push(release);
          }
        }
      });

      

      formatsInCollection.forEach((format) => {
        const genresOrStyles = Object.keys(library[format]);
        genresOrStyles.forEach((genreOrStyle) => {
          const releases = library[format][genreOrStyle];
          logger.info(`\n\n${format}, ${genreOrStyle}, ${releases.length}`);
        });
      });

      
      fs.writeFileSync(
        "organization.json",
        JSON.stringify(library, null, 2),
      );
    });
};

type Format = "12" | "10" | "7" | "other";

function findDistinctFormats(data: any) {
  const twelveRegex = /\b12\b/;
  const tenRegex = /\b10\b/;
  const sevenRegex = /\b7\b/;

  const formatSet = new Set<Format>();

  data.forEach((release: any) => {
    const { basic_information } = release;
    const { formats } = basic_information;
    const { descriptions } = formats[0];

    const twelve = descriptions.some(twelveRegex.test.bind(twelveRegex));
    const ten = descriptions.some(tenRegex.test.bind(tenRegex));
    const seven = descriptions.some(sevenRegex.test.bind(sevenRegex));

    switch (true) {
      case twelve:
        formatSet.add("12");
        break;
      case ten:
        formatSet.add("10");
        break;
      case seven:
        formatSet.add("7");
        break;
      default:
        formatSet.add("other");
        break;
    }
  });

  return Array.from(formatSet);
}

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

  switch (true) {
    case twelve:
      return "12";
    case ten:
      return "10";
    case seven:
      return "7";
    default:
      return "other";
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

