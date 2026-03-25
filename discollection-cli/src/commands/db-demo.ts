import {
  createDb,
  ensureCoreSchema,
  resolveDbPath,
  schema,
} from "discollection-db";
import logger from "../logger";

type DbDemoOptions = {
  path?: string;
  key?: string;
  value?: string;
};

export function dbDemoAction(options: DbDemoOptions = {}) {
  const dbPath = resolveDbPath(options.path);
  const db = createDb({ filePath: dbPath });
  ensureCoreSchema(db);

  const key = options.key ?? "cli-healthcheck";
  const existing = db
    .select()
    .from(schema.items)
    .all()
    .find((item) => item.key === key);

  if (!existing) {
    const now = new Date().toISOString();
    db.insert(schema.items)
      .values({
        key,
        value: options.value ?? now,
        createdAt: now,
      })
      .run();

    logger.info("Inserted demo record", { key, dbPath });
  }

  const rows = db.select().from(schema.items).all();

  logger.info("DB demo completed", {
    dbPath,
    totalRows: rows.length,
    sample: rows[rows.length - 1] ?? null,
  });
}
