# discollection-db

SQLite + Drizzle database package for the discollection monorepo.

This package is intended to be the single data-access boundary that other packages import.

## What this package exports

From package root:

- `createDb(options?)`
- `resolveDbPath(filePath?)`
- `ensureCoreSchema(db)`
- `schema`
- `CreateDbOptions`
- `DiscollectionDb`
- `Item`
- `NewItem`

From subpath export:

- `discollection-db/schema`

## Local development

From the monorepo root:

```bash
pnpm install
pnpm --filter discollection-db build
```

Watch mode while editing this package:

```bash
pnpm --filter discollection-db build:watch
```

## Environment

Database path is configured through `DISCOLLECTION_DB_PATH`.

If unset, the default path is:

- `./discollection.db`

Used in:

- `src/client.ts` runtime connection path resolution
- `drizzle.config.ts` drizzle-kit db credentials

Example:

```bash
export DISCOLLECTION_DB_PATH=./tmp/discollection.db
```

## Drizzle workflow

Schema source:

- `src/schema.ts`

Drizzle config:

- `drizzle.config.ts`

Generate migrations after schema changes:

```bash
pnpm --filter discollection-db drizzle:generate
```

Apply schema changes directly to the configured SQLite database:

```bash
pnpm --filter discollection-db drizzle:push
```

## Recommended schema update flow

1. Edit `src/schema.ts`.
2. Run `pnpm --filter discollection-db drizzle:generate`.
3. Run `pnpm --filter discollection-db drizzle:push`.
4. Run `pnpm --filter discollection-db build`.
5. Verify consuming packages still build.

## Consuming from another package

```ts
import { createDb, ensureCoreSchema, schema } from "discollection-db";

const db = createDb({ filePath: "./demo.db" });
ensureCoreSchema(db);

const rows = db.select().from(schema.items).all();
console.log(rows.length);
```

## Notes

- `createDb` creates parent directories for the sqlite file path when needed.
- `ensureCoreSchema` is a lightweight bootstrap helper for initial setup and local development.
- For real schema evolution, prefer the drizzle migration flow over manual SQL changes.
