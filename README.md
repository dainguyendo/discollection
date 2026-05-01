# discollection monorepo

Monorepo for Discogs collection tooling: a CLI for syncing, organizing, and locating releases, a shared SQLite/Drizzle data layer, and a Next.js web viewer for organized exports.

## Packages

- `discollection` ([discollection-cli/README.md](discollection-cli/README.md)): CLI for `sync`, `seed`, `organize`, `locate`, and `release-override`.
- `discollection-db` ([discollection-db/README.md](discollection-db/README.md)): SQLite + Drizzle schema/client package used by the CLI.
- `discollection-web` ([discollection-web/README.md](discollection-web/README.md)): Next.js viewer for organized JSON exports with search and graph navigation.

## User Guides

Workflow guides for managing your physical vinyl collection: **Crate → File → Dig**

- [Full User Guide](docs/USER_GUIDE.md) — Complete walkthrough with diagrams
- [Crate](docs/guides/01-crate.md) — Sync new records from Discogs
- [File](docs/guides/02-file.md) — Organize your shelves
- [Dig](docs/guides/03-dig.md) — Find where records belong

## Quick Start

### Prerequisites

Install [mise](https://mise.jdx.dev/) to manage tool versions:

```bash
curl https://mise.run | sh
mise install
```

This installs Node.js, pnpm, and voice dependencies (ffmpeg, whisper-cpp) at the pinned versions.

### Build

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
pnpm --filter discollection dev locate --collection ./tmp/organized.json --once --voice Daniel --speech-rate 200
```

Voice capture mode for `locate` requires `ffmpeg`, `whisper-cli`, and a local Whisper model. Text queries can run without those dependencies. See the CLI README for setup details.

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
