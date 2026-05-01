import fs from "fs";

import logger from "../logger";
import type { Configuration } from "../types";
import { buildOrganizedLibrary, loadOrganizeDataFromDb } from "../utilities/organize";

export const organizeAction = async (output: string, options: { config?: string }) => {
  logger.info("Organizing collection", { options });

  let fileSubgroup: Configuration["subgroup"] | undefined;
  let fileConsolidate: Configuration["consolidate"] | undefined;

  if (options.config) {
    logger.info("Using config file", { path: options.config });
    const fileConfig = JSON.parse(fs.readFileSync(options.config, "utf-8")) as Configuration;
    fileSubgroup = fileConfig.subgroup;
    fileConsolidate = fileConfig.consolidate;
  }

  const { collection, overrides, dbConfig } = loadOrganizeDataFromDb();
  logger.info("Loaded collection from database", { total: collection.length });

  const organizeConfig: Configuration = {
    // subgroup and consolidate: prefer --config file value, fall back to DB
    subgroup: fileSubgroup ?? dbConfig.subgroup,
    consolidate: fileConsolidate ?? dbConfig.consolidate,
    // release overrides always sourced from the database
    genre: overrides.genre,
    style: overrides.style,
  };

  const library = buildOrganizedLibrary(collection, organizeConfig);

  logger.info("Finished organizing collection", {
    total: collection.length,
  });

  if (!output) {
    logger.error("No output file specified. Exiting.");
    return;
  }

  fs.writeFileSync(output, JSON.stringify(library, null, 2));
  logger.info("Saved organized collection", { output });
};
