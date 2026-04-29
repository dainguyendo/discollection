# discollection-db

Shared SQLite + Drizzle package for discollection.

## Purpose

- Provides DB client helpers and schema exports.
- Stores collection releases, genres/styles, overrides, and organize config.

## Public API

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

`DISCOLLECTION_DB_PATH` controls the sqlite file path.

- Default: `./discollection.db`

```bash
export DISCOLLECTION_DB_PATH=./tmp/discollection.db
```

## Drizzle Workflow

```bash
pnpm --filter discollection-db drizzle:generate
pnpm --filter discollection-db drizzle:push
pnpm --filter discollection-db db:studio
```

Schema update flow:

1. Edit `src/schema.ts`.
2. Run `drizzle:generate`.
3. Run `drizzle:push`.
4. Rebuild package.
5. Verify dependent packages still compile.

## Usage Example

```ts
import { createDb, ensureCollectionSchema, schema } from "discollection-db";

const db = createDb({ filePath: "./tmp/discollection.db" });
ensureCollectionSchema(db);

const rows = db.select().from(schema.collectionReleases).all();
console.log(rows.length);
```
