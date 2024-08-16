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
    .command("style")
    .description("Get releases by selected style")
    .argument("[genre]", "filter by genre")
    .action(async (genre) => {
      const answer = await inquirer.prompt([
        {
          type: "list",
          name: "style",
          message: "Select style",
          choices: async () => {
            const records = await db.releaseStyle.findMany({
              distinct: ["style"],
              select: {
                style: true,
              },
            });
            const styles = records.map((r) => r.style).sort();

            return styles;
          },
        },
      ] as any);

      const releasesWithStyle = await db.releaseStyle.findMany({
        select: {
          releaseId: true,
        },
        where: {
          style: answer.style,
        },
      });

      const releasesWithGenre = genre
        ? await db.releaseGenre.findMany({
            select: {
              releaseId: true,
            },
            where: {
              genre,
            },
          })
        : null;

      const releaseIds = (
        releasesWithGenre
          ? intersectionBy(releasesWithStyle, releasesWithGenre, "releaseId")
          : releasesWithStyle
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
