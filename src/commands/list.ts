import chalk from "chalk";
import { Command } from "commander";
import { PrismaClient } from "@prisma/client";
import chalkTable from "chalk-table";
import _ from "lodash";

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
          if (!category) {
            const releases = await db.release.findMany();

            const headers = {
              leftPad: 2,
              columns: [
                { field: "artist", name: chalk.cyan("Artist") },
                { field: "release", name: chalk.cyan("Release") },
              ],
            };

            const formattedReleases = releases.map((r) => ({
              artist: r.artist,
              release: r.title,
            }));

            console.log(chalkTable(headers, formattedReleases));
          } else {
            console.log(chalk.red("Invalid category argument"));
          }
        }
      }
    });
};
