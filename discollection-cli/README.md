# discollection CLI

CLI for syncing a Discogs collection, storing data in SQLite, and generating an organized JSON library.

## What It Does

- `sync`: Fetch Discogs collection releases and store them in the local DB.
- `seed --config <path>`: Seed overrides and organize settings into the DB.
- `organize <output> [--config <path>]`: Build organized output JSON from DB data.

## Prerequisites

- Node.js + pnpm
- Discogs API token and account/folder information

Required environment variables:

- `DISCOGS_USER`
- `DISCOGS_FOLDER_ID`
- `DISCOGS_PERSONAL_ACCESS_TOKEN`

Optional environment variable:

- `DISCOLLECTION_DB_PATH` (defaults to `./discollection.db`)

## Install And Build

From monorepo root:

```bash
pnpm install
pnpm --filter discollection build
```

## Development Usage

Run commands through the TS entrypoint:

```bash
pnpm --filter discollection dev sync
pnpm --filter discollection dev seed --config /absolute/path/to/config.discollection.json
pnpm --filter discollection dev organize ./tmp/organized.json
```

Run built CLI:

```bash
pnpm --filter discollection start -- organize ./tmp/organized.json
```

## Recommended Workflow

1. Set environment variables (`DISCOGS_*`, optional `DISCOLLECTION_DB_PATH`).
2. Run `sync` to populate releases.
3. Run `seed --config <path>` to load overrides and organize config.
4. Run `organize <output>` to generate final JSON.

## Command Reference

`sync`

- Fetches all Discogs pages for the configured user/folder.
- Persists releases, genres, and styles to the local DB.

`seed --config <path>`

- Replaces all prior `release_overrides`, `config_subgroups`, and `config_consolidations` rows.
- Loads `genre` and `style` per-release overrides from config.
- Loads `subgroup` and `consolidate` organize settings into DB.

`organize <output> [--config <path>]`

- Reads releases and seeded overrides from DB.
- Uses `subgroup` and `consolidate` from `--config` if provided, otherwise DB values.
- Always uses per-release `genre`/`style` overrides from DB.
- Writes organized JSON to `<output>`.

## Config Schema

Used by `seed` (all fields) and `organize --config` (`subgroup`, `consolidate`):

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

- `genre` and `style` keys are Discogs release IDs (as strings in JSON).
- `subgroup` genres are grouped by style unless each style has only one release.