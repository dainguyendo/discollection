# Dig — Find Your Records

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   🔎 Search  ───▶  📍 Position  ───▶  ↔️ Neighbors │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Text Search

```bash
discollection locate ./my-collection.json "Kind of Blue"
```

## Voice Search

```bash
# Continuous mode (say "stop listening" to exit)
discollection locate ./my-collection.json

# Single query mode
discollection locate ./my-collection.json --once
```

## Reading the Result

```
Match: Miles Davis - Kind of Blue
Section: LP / Jazz
Position: 12/45 in LP > Jazz
Between: A Love Supreme | Brilliant Corners
         ↑                 ↑
      Before it        After it
```

**Translation:** Your record is in the LP section, Jazz genre, 12th of 45. Find it between "A Love Supreme" and "Brilliant Corners."

## Voice Options

| Option | What it does |
|--------|--------------|
| `--voice Samantha` | Change speaking voice |
| `--speech-rate 180` | Slower/faster speech |
| `--no-speak` | Text output only |
| `--once` | Exit after one query |

## Example

```bash
discollection locate ./my-collection.json --voice Daniel --speech-rate 200 --once
```
