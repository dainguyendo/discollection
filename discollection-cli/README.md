# discollection CLI

CLI to sync a Discogs collection into SQLite and generate organized JSON output.

## Commands

- `sync`: pull collection data from Discogs into local DB.
- `seed --config <path>`: store overrides and organize config in DB.
- `organize <output> [--config <path>]`: generate organized JSON from DB.
- `locate <collectionPath> [query]`: locate a release in an organized collection JSON using the current voice-first workflow.
- `release-override <releaseId> <overrideValue>`: add/update one release override row in DB. Override type is inferred: values matching official Discogs genres are saved as `genre`, otherwise as `style`.

### `locate` options

- `--lang <code>`: Whisper language code. Default: `en`.
- `--no-speak`: print results without reading them aloud through macOS `say`.
- `--voice <name>`: macOS `say` voice override. Default: `Samantha`.
- `--speech-rate <wpm>`: macOS `say` words per minute. Default: `200`.
- `--stop-phrase <text>`: phrase that exits the voice loop. Default: `stop listening`.
- `--once`: capture one utterance, answer once, and exit.

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

## Voice Locate Requirements

Voice capture mode requires local voice dependencies. Text queries can run without Whisper.

Install runtime dependencies on macOS:

```bash
brew install ffmpeg whisper-cpp
whisper-download-ggml-model base.en
```

The CLI looks for the Whisper model in these locations, in order:

- `WHISPER_MODEL_PATH`
- `~/Library/Caches/whisper/ggml-base.en.bin`
- `~/.cache/whisper/ggml-base.en.bin`
- `./models/ggml-base.en.bin`

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
pnpm --filter discollection dev locate ./tmp/organized.json --once --voice Daniel --speech-rate 200
```

Run a single text lookup against an existing organized export:

```bash
pnpm --filter discollection dev locate ./tmp/organized.json "Kind of Blue"
```

Run the continuous voice loop and say `stop listening` to exit:

```bash
pnpm --filter discollection dev locate ./tmp/organized.json --voice Daniel --speech-rate 200
```

Run built CLI binary:

```bash
pnpm --filter discollection start -- organize ./tmp/organized.json
pnpm --filter discollection start -- locate ./tmp/organized.json --once
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