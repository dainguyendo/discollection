# discollection-db

SQLite + Drizzle data layer for the discollection monorepo.

## Purpose

- Central DB client and schema package consumed by other workspace packages.
- Defines collection, genre/style, override, and organize-config tables.

## Public API

Root exports:

- `createDb(options?)`
- `resolveDbPath(filePath?)`
- `ensureCollectionSchema(db)`
- `schema`
- `CreateDbOptions`
- `DiscollectionDb`

Subpath export:

- `discollection-db/schema`

## Setup

From monorepo root:

```bash
pnpm install
pnpm --filter discollection-db build
```

Watch mode:

```bash
pnpm --filter discollection-db build:watch
```

## Environment

`DISCOLLECTION_DB_PATH` controls sqlite file location.

- Default: `./discollection.db`
- Used by runtime client and drizzle-kit config.

Example:

```bash
export DISCOLLECTION_DB_PATH=./tmp/discollection.db
```

## Drizzle Commands

- Generate migration files:

```bash
pnpm --filter discollection-db drizzle:generate
```

- Push schema to local SQLite DB:

```bash
pnpm --filter discollection-db drizzle:push
```

- Open DB Studio:

```bash
pnpm --filter discollection-db db:studio
```

## Schema Change Workflow

1. Update `src/schema.ts`.
2. Run `pnpm --filter discollection-db drizzle:generate`.
3. Run `pnpm --filter discollection-db drizzle:push`.
4. Run `pnpm --filter discollection-db build`.
5. Verify dependent packages still build.

## Example Usage

```ts
import { createDb, ensureCollectionSchema, schema } from "discollection-db";

const db = createDb({ filePath: "./tmp/discollection.db" });
ensureCollectionSchema(db);

const rows = db.select().from(schema.collectionReleases).all();
console.log(rows.length);
```

## Notes

- `createDb` auto-creates parent directories for DB file paths.
- `ensureCollectionSchema` is for local bootstrap and non-migration initialization.
- Prefer drizzle migration flow for schema evolution.
