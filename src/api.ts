import ky from "ky";
import logger from "./logger";

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

type Release = any;

export async function list(): Promise<Array<Release>> {
    let list: Array<Release> = [];

    let url = `https://api.discogs.com/users/${user}/collection/folders/${folder}/releases`;

  try {
    do {
      const response = await api.get(url);
      const data = await response.json<any>();
      const { pagination, releases } = data;

      logger.info("Fetched page of collection", { pagination });

      url = pagination?.urls?.next;

      list.push(...releases);

      await new Promise((r) => setTimeout(r, 750));

      logger.info("Processed page", { page: pagination.page });
    } while (url);

    logger.info("Finished processing", { total: list.length });

    
  } catch (error) {
    logger.error(error);
  }
  
  return list;
}