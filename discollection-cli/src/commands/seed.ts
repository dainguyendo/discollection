import fs from "fs";

import { createDb, ensureCollectionSchema, schema } from "discollection-db";

import logger from "../logger";
import { Configuration } from "../types";

type SeedOptions = {
  config?: string;
};

export function seedAction(options: SeedOptions): void {
  const configPath = options.config;

  if (!configPath) {
    logger.error("No config file specified. Use --config <path>.");
    return;
  }

  logger.info("Seeding organize configuration", { configPath });

  const config = JSON.parse(fs.readFileSync(configPath, "utf-8")) as Configuration;

  const db = createDb();
  ensureCollectionSchema(db);

  const genreOverrides = config.genre ?? {};
  const styleOverrides = config.style ?? {};
  const subgroupValues = config.subgroup ?? [];
  const consolidations = config.consolidate ?? {};

  const overrideData: Array<{
    releaseId: number;
    overrideType: "genre" | "style";
    value: string;
  }> = [];

  for (const [releaseIdText, genre] of Object.entries(genreOverrides)) {
    overrideData.push({
      releaseId: Number(releaseIdText),
      overrideType: "genre",
      value: genre,
    });
  }

  for (const [releaseIdText, style] of Object.entries(styleOverrides)) {
    overrideData.push({
      releaseId: Number(releaseIdText),
      overrideType: "style",
      value: style,
    });
  }

  const subgroupData = subgroupValues.map((genre) => ({ genre }));
  const consolidationData = Object.entries(consolidations).map(([style, value]) => ({
    style,
    value,
  }));

  db.transaction((tx) => {
    tx.delete(schema.releaseOverrides).run();
    tx.delete(schema.configSubgroups).run();
    tx.delete(schema.configConsolidations).run();

    if (overrideData.length > 0) {
      tx.insert(schema.releaseOverrides).values(overrideData).run();
    }

    if (subgroupData.length > 0) {
      tx.insert(schema.configSubgroups).values(subgroupData).run();
    }

    if (consolidationData.length > 0) {
      tx.insert(schema.configConsolidations).values(consolidationData).run();
    }
  });

  logger.info("Seeded organize configuration", {
    releaseOverrides: overrideData.length,
    subgroups: subgroupData.length,
    consolidations: consolidationData.length,
  });
}
