# discollection CLI

CLI to sync a Discogs collection into SQLite and generate organized JSON output.

## Commands

- `sync`: pull collection data from Discogs into local DB.
- `seed --config <path>`: store overrides and organize config in DB.
- `organize <output> [--config <path>]`: generate organized JSON from DB.
- `release-override <releaseId> <overrideValue>`: add/update one release override row in DB. Override type is inferred: values matching official Discogs genres are saved as `genre`, otherwise as `style`.

## Required Environment

```bash
export DISCOGS_USER="your-discogs-username"
export DISCOGS_FOLDER_ID="0"
export DISCOGS_PERSONAL_ACCESS_TOKEN="your-token"
```

Optional:

```bash
export DISCOLLECTION_DB_PATH="./tmp/discollection.db"
```

## Setup

From monorepo root:

```bash
pnpm install
pnpm --filter discollection build
```

## Typical Development Workflow

```bash
pnpm --filter discollection dev sync
pnpm --filter discollection dev seed --config /absolute/path/to/config.discollection.json
pnpm --filter discollection dev release-override 12345 Rock
pnpm --filter discollection dev release-override 12345 "Hard Rock"
pnpm --filter discollection dev organize ./tmp/organized.json
```

Run built CLI binary:

```bash
pnpm --filter discollection start -- organize ./tmp/organized.json
```

## Config File Schema

Used by `seed` (all keys) and `organize --config` (`subgroup`, `consolidate`):

```json
{
  "subgroup": ["Rock"],
  "consolidate": {
    "Hard Rock": "Rock"
  },
  "genre": {
    "12345": "Rock"
  },
  "style": {
    "12345": "Hard Rock"
  }
}
```

Notes:

- `genre` and `style` keys are Discogs release IDs as JSON strings.
- `seed` replaces existing override and config rows.
- `release-override` uses Discogs genre/style guidelines to infer type: https://support.discogs.com/hc/en-us/articles/360005055213-Database-Guidelines-9-Genres-Styles