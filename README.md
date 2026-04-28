# discollection monorepo

Discogs collection tooling monorepo:

- `discollection` CLI package for sync/seed/organize workflows.
- `discollection-db` shared SQLite + Drizzle data layer.

## 60-Second Onboarding

1. Install dependencies:

```bash
pnpm install
```

2. Build all packages:

```bash
pnpm build
```

3. Set required Discogs environment variables:

```bash
export DISCOGS_USER="your-discogs-username"
export DISCOGS_FOLDER_ID="0"
export DISCOGS_PERSONAL_ACCESS_TOKEN="your-token"
```

4. Optional DB location (default is `./discollection.db`):

```bash
export DISCOLLECTION_DB_PATH="./tmp/discollection.db"
```

5. Sync your collection:

```bash
pnpm --filter discollection dev sync
```

6. Seed config overrides:

```bash
pnpm --filter discollection dev seed --config /absolute/path/to/config.discollection.json
```

7. Generate organized output:

```bash
pnpm --filter discollection dev organize ./tmp/organized.json
```

## Typical Local Workflow

- `pnpm build`: Build all workspace packages.
- `pnpm build:watch`: Watch-mode build for all packages that support it.
- `pnpm format`: Check formatting across packages.
- `pnpm format:fix`: Auto-fix formatting.
- `pnpm dev:db:reset`: Delete the current sqlite DB file at `DISCOLLECTION_DB_PATH` (or `./discollection.db`).
- `pnpm dev:seed`: Seed via `DISCOLLECTION_CONFIG_PATH` env var.

Example for `dev:seed`:

```bash
export DISCOLLECTION_CONFIG_PATH="/absolute/path/to/config.discollection.json"
pnpm dev:seed
```

## Packages

- CLI docs: [discollection-cli/README.md](discollection-cli/README.md)
- DB docs: [discollection-db/README.md](discollection-db/README.md)

## Workspace Layout

- `discollection-cli/`: CLI commands and organize logic.
- `discollection-db/`: Drizzle schema, DB client, and sqlite utilities.
