import ky from "ky";

import logger from "./logger";
import { GetReleasesResponse, Release } from "./types";

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

function withPerPage(url: URL): string {
  url.searchParams.set("per_page", "100");
  return url.toString();
}

export async function list(): Promise<GetReleasesResponse["releases"]> {
  let releases: Array<Release> = [];

  let url: string | undefined = withPerPage(
    new URL(`https://api.discogs.com/users/${user}/collection/folders/${folder}/releases`),
  );

  try {
    do {
      const response = await api.get(url);
      const data: GetReleasesResponse = await response.json();
      const { pagination, releases: pageReleases } = data;

      logger.info("Fetched page of collection", { pagination });

      url = pagination?.urls?.next ? withPerPage(new URL(pagination.urls.next)) : undefined;

      releases.push(...pageReleases);

      await new Promise((r) => setTimeout(r, 750));

      logger.info("Processed page", { page: pagination.page });
    } while (url);

    logger.info("Finished processing", { total: releases.length });
  } catch (error) {
    logger.error(error);
  }

  return releases;
}
