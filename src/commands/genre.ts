import chalk from "chalk";
import chalkTable from "chalk-table";
import { Command } from "commander";
import inquirer from "inquirer";
import _ from "lodash";
import db from "../db";
import { toReleaseObject } from "../utilities/formatter";
import { sortByArtist } from "../utilities/sort";

const intersectionBy = _.intersectionBy;

export default (program: Command) => {
  program
    .command("genre")
    .description("Get releases by selected genre")
    .argument("[style]", "filter by style")
    .action(async (style) => {
      const answer = await inquirer.prompt([
        {
          type: "list",
          name: "genre",
          message: "Select genre",
          choices: async () => {
            const records = await db.releaseGenre.findMany({
              distinct: ["genre"],
              select: {
                genre: true,
              },
            });
            const genres = records.map((r) => r.genre).sort();

            return genres;
          },
        },
      ] as any);

      const releasesWithStyle = style
        ? await db.releaseStyle.findMany({
            select: {
              releaseId: true,
            },
            where: {
              style,
            },
          })
        : null;

      const releasesWithGenre = await db.releaseGenre.findMany({
        where: {
          genre: answer.genre,
        },
      });

      const releaseIds = (
        releasesWithStyle
          ? intersectionBy(releasesWithStyle, releasesWithGenre, "releaseId")
          : releasesWithGenre
      ).map((r) => r.releaseId);

      const data = await db.release.findMany({
        where: {
          id: {
            in: releaseIds,
          },
        },
      });

      const options = {
        leftPad: 2,
        columns: [
          { field: "title", name: chalk.cyan("Release") },
          { field: "artist", name: chalk.magenta("Artist") },
        ],
      };

      const table = chalkTable(
        options,
        data.map(toReleaseObject).sort(sortByArtist),
      );

      console.log(table);
    });
};
