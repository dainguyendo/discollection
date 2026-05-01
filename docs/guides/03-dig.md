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
# Using database (organizes fresh)
discollection locate "Kind of Blue"

# Using existing collection file
discollection locate "Kind of Blue" --collection ./my-collection.json
```

## Voice Search

```bash
# Continuous mode (say "stop listening" to exit)
discollection locate

# Single query mode
discollection locate --once

# With collection file
discollection locate --collection ./my-collection.json --once
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
| `--collection <path>` | Use existing organized JSON |
| `--voice Samantha` | Change speaking voice |
| `--speech-rate 180` | Slower/faster speech |
| `--no-speak` | Text output only |
| `--once` | Exit after one query |

## Example

```bash
discollection locate --voice Daniel --speech-rate 200 --once
```
