# discollection monorepo

Monorepo for Discogs collection tooling and viewer apps.

## Packages

- `discollection` ([discollection-cli/README.md](discollection-cli/README.md)): CLI for `sync`, `seed`, and `organize`.
- `discollection-db` ([discollection-db/README.md](discollection-db/README.md)): SQLite + Drizzle schema/client package.
- `discollection-web` ([discollection-web/README.md](discollection-web/README.md)): Next.js viewer for organized JSON output.

## Quick Start

```bash
pnpm install
pnpm build
```

Set required Discogs env vars for CLI workflows:

```bash
export DISCOGS_USER="your-discogs-username"
export DISCOGS_FOLDER_ID="0"
export DISCOGS_PERSONAL_ACCESS_TOKEN="your-token"
```

Optional DB path (default: `./discollection.db`):

```bash
export DISCOLLECTION_DB_PATH="./tmp/discollection.db"
```

## CLI Workflow

```bash
pnpm --filter discollection dev sync
pnpm --filter discollection dev seed --config /absolute/path/to/config.discollection.json
pnpm --filter discollection dev organize ./tmp/organized.json
```

## Web Workflow

```bash
pnpm --filter discollection-web dev
pnpm --filter discollection-web build
pnpm --filter discollection-web lint
```

## Common Root Commands

- `pnpm build`: Build all packages.
- `pnpm build:watch`: Watch build for packages that support it.
- `pnpm format`: Check formatting in all packages.
- `pnpm format:fix`: Auto-fix formatting.
- `pnpm dev:db:reset`: Remove local sqlite DB at `DISCOLLECTION_DB_PATH` (or `./discollection.db`).
- `pnpm dev:seed`: Seed using `DISCOLLECTION_CONFIG_PATH`.

Example:

```bash
export DISCOLLECTION_CONFIG_PATH="/absolute/path/to/config.discollection.json"
pnpm dev:seed
```
