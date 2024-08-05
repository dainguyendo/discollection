import { Command } from "commander";
import ky from "ky";
import db from "../db";
import logger from "../logger";

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
    ? information.artists.join(", ")
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

export default (program: Command) => {
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
};
