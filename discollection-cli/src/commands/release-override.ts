import { createDb, ensureCollectionSchema, schema } from "discollection-db";

import logger from "../logger";

const DISCOGS_GENRE_GUIDELINE_URL =
  "https://support.discogs.com/hc/en-us/articles/360005055213-Database-Guidelines-9-Genres-Styles";

// Implementation detail: official Discogs genres from the guideline above.
const OFFICIAL_DISCOGS_GENRES = new Set([
  "blues",
  "brass & military",
  "children's",
  "classical",
  "electronic",
  "folk, world, & country",
  "funk / soul",
  "hip-hop",
  "jazz",
  "latin",
  "non-music",
  "pop",
  "reggae",
  "rock",
  "stage & screen",
]);

type OverrideType = "genre" | "style";

function inferOverrideType(value: string): OverrideType {
  const normalized = value.trim().toLowerCase();
  return OFFICIAL_DISCOGS_GENRES.has(normalized) ? "genre" : "style";
}

export function releaseOverrideAction(releaseIdText: string, overrideValue: string): void {
  const releaseId = Number(releaseIdText);

  if (!Number.isInteger(releaseId) || releaseId <= 0) {
    logger.error("Release ID must be a positive integer", { releaseIdText });
    return;
  }

  const value = overrideValue.trim();
  if (!value) {
    logger.error("Override value cannot be empty");
    return;
  }

  const overrideType = inferOverrideType(value);

  const db = createDb();
  ensureCollectionSchema(db);

  db.insert(schema.releaseOverrides)
    .values({
      releaseId,
      overrideType,
      value,
    })
    .onConflictDoUpdate({
      target: [schema.releaseOverrides.releaseId, schema.releaseOverrides.overrideType],
      set: { value },
    })
    .run();

  logger.info("Saved release override", {
    releaseId,
    overrideType,
    value,
    guideline: DISCOGS_GENRE_GUIDELINE_URL,
  });
}
