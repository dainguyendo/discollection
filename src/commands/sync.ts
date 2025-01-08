import { Command } from "commander";
import db from "../db";
import logger from "../logger";
import { list } from "../api";

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
    ? information.artists.map((a: any) => a.name).join(", ")
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
  try {
    const releases = await list();
    await Promise.all(releases.map(formatRelease).map(syncRelease));

    logger.info("Finished syncing", { total: releases.length });
  } catch (error) {
    logger.error(error);
  }
}

export default (program: Command) => {
  program
    .command("sync")
    .description("Sync Discogs collection")
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
