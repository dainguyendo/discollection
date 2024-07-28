import ky from "ky";
import { PrismaClient } from "@prisma/client";
import { Logger } from "tslog";
import { Command } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import chalkTable from "chalk-table";
import invariant from "invariant";

const logger = new Logger();
const db = new PrismaClient();
const program = new Command();

invariant(
  process.env["DISCOGS_PERSONAL_ACCESS_TOKEN"],
  "Missing Discogs access token. See https://www.discogs.com/settings/developers"
);
invariant(process.env["DISCOGS_USER"], "Missing Discogs user");
invariant(process.env["DISCOGS_FOLDER_ID"], "Missing folder ID");

const user = process.env["DISCOGS_USER"];
const folder = process.env["DISCOGS_FOLDER_ID"];
const userAgent = `${user}_${folder}_app`;

const api = ky.extend({
  hooks: {
    beforeRequest: [
      (request) => {
        const token = process.env["DISCOGS_PERSONAL_ACCESS_TOKEN"] || "";

        request.headers.set("User-Agent", userAgent);
        request.headers.set("Content-Type", "application/json");
        request.headers.set("Authorization", `Discogs token=${token}`);
      },
    ],
  },
});

async function sync() {
  let url = `https://api.discogs.com/users/${user}/collection/folders/${folder}/releases`;

  try {
    do {
      const response = await api.get(url);
      const data = await response.json<any>();
      const { pagination, releases } = data;

      logger.info("Fetched page of collection", { pagination });

      url = pagination?.urls?.next;

      await Promise.all(releases.map(formatRelease).map(syncRelease));
      await new Promise((r) => setTimeout(r, 750));

      logger.info("Processed page", { page: pagination.page });
    } while (url);
  } catch (error) {
    logger.error(error);
  }
}

interface SimplifiedRelease {
  id: number;
  title: string;
  artist: string | undefined;
  genres: string[];
  styles: string[];
}

function formatRelease(release: any): SimplifiedRelease {
  const information = release.basic_information;
  const artist = Array.isArray(information?.artists)
    ? information.artists[0]
    : undefined;
  return {
    id: release.id,
    title: information.title,
    artist: artist?.name,
    genres: information.genres,
    styles: information.styles,
  };
}

async function syncRelease(release: SimplifiedRelease) {
  await db.release.upsert({
    where: {
      id: release.id,
    },
    update: {
      title: release.title,
      artist: release.artist,
    },
    create: {
      id: release.id,
      title: release.title,
      artist: release.artist,
    },
  });

  await Promise.all([
    db.releaseGenre.deleteMany({
      where: {
        releaseId: release.id,
      },
    }),
    db.releaseStyle.deleteMany({
      where: {
        releaseId: release.id,
      },
    }),
  ]);

  await Promise.all([
    db.releaseGenre.createMany({
      data: release.genres.map((genre) => ({
        releaseId: release.id,
        genre,
      })),
    }),
    db.releaseStyle.createMany({
      data: release.styles.map((style) => ({
        releaseId: release.id,
        style,
      })),
    }),
  ]);
}

program
  .name("disc")
  .description("CLI to Dai's discog collection")
  .version("0.8.0");

program
  .command("sync")
  .description("Sync Discog collection")
  .action(async () => {
    try {
      await sync();
    } catch (error) {
      logger.error("Failed", error);
    } finally {
      logger.info("Exited");
    }
  });

program
  .command("genre")
  .description("Get releases by selected genre")
  .action(async () => {
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
          const genres = records.map((r) => r.genre);

          return genres;
        },
      },
    ] as any);

    const data = await db.releaseGenre.findMany({
      distinct: ["releaseId"],
      where: {
        genre: answer.genre,
      },
      include: {
        release: true,
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
      data.map((r) => ({
        title: r.release.title,
        artist: r.release.artist,
      }))
    );

    console.log(table);
  });

program
  .command("style")
  .description("Get releases by selected style")
  .action(async () => {
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
          const styles = records.map((r) => r.style);

          return styles;
        },
      },
    ] as any);

    const data = await db.releaseStyle.findMany({
      distinct: ["releaseId"],
      where: {
        style: answer.style,
      },
      include: {
        release: true,
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
      data.map((r) => ({
        title: r.release.title,
        artist: r.release.artist,
      }))
    );

    console.log(table);
  });

program.parse();
