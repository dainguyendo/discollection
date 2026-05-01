# File — Organize Your Shelves

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   📀 Format  ▶  🎵 Genre  ▶  🎸 Style  ▶  🔤 A-Z   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Command

```bash
discollection organize ./my-collection.json
```

## Output Structure

```
LP/
├── Jazz/
│   ├── Miles Davis - Kind of Blue
│   └── John Coltrane - A Love Supreme
├── Rock/
│   ├── Hard Rock/
│   │   ├── AC/DC - Back in Black
│   │   └── Led Zeppelin - IV
│   └── Alternative Rock/
│       └── Radiohead - OK Computer
└── Electronic/
    └── Daft Punk - Random Access Memories
```

## Quick Fix: Wrong Category?

### Option 1: Web Interface (Recommended)

1. Open **discollection-web** and load your organized JSON
2. Find the release and click any **genre/style badge**
3. The override command is copied to your clipboard
4. Paste and run in terminal

### Option 2: CLI

```bash
# Move release 12345 to Rock genre
discollection release-override 12345 "Rock"

# Set release to Hard Rock style
discollection release-override 12345 "Hard Rock"
```

Then re-run `organize` to apply changes.

---

**Next:** **Dig** through your collection with `locate`.
