import chalk from "chalk";
import { Command } from "commander";
import { PrismaClient } from "@prisma/client";
import chalkTable from "chalk-table";
import _ from "lodash";
import { toReleaseObject } from "../utilities/formatter";
import { sortByArtist } from "../utilities/sort";

export default (program: Command) => {
  program
    .command("list")
    .argument("[category]", "either genre or style")
    .action(async (category) => {
      const db = new PrismaClient();

      const options = {
        leftPad: 2,
        columns: [{ field: category, name: chalk.cyan(category) }],
      };

      switch (category) {
        case "genre": {
          const records = await db.releaseGenre.findMany({
            distinct: ["genre"],
            select: {
              genre: true,
            },
          });
          const genres = records.map((r) => ({ [category]: r.genre }));

          console.log(chalkTable(options, genres));
          break;
        }
        case "style": {
          const records = await db.releaseStyle.findMany({
            distinct: ["style"],
            select: {
              style: true,
            },
          });
          const styles = records.map((r) => ({ [category]: r.style }));

          console.log(chalkTable(options, styles));
          break;
        }
        default: {
          const options = {
            leftPad: 2,
            columns: [
              { field: "title", name: chalk.cyan("Release") },
              { field: "artist", name: chalk.magenta("Artist") },
            ],
          };

          const data = await db.release.findMany();
          const releases = data.map(toReleaseObject).sort(sortByArtist);
          console.log(chalkTable(options, releases));
        }
      }
    });
};
