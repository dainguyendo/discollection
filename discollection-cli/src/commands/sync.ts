import { list } from "../api";
import logger from "../logger";
import { persistCollectionToDb } from "../utilities/persist-collection";

export const syncAction = async () => {
  logger.info("Syncing collection with database");
  const collection = await list();
  logger.info("Fetched collection", { total: collection.length });
  persistCollectionToDb(collection);
  logger.info("Finished syncing collection with database", {
    total: collection.length,
  });
};
