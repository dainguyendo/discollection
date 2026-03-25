### `organize` command

Arguments:
- `<output>`: Output destination for organized collection in JSON format.

Options:
- `--cache`: Cache the collection for faster access
- `--config [path]`: Path to configuration file

**Configuration file schema**:

```json
{
  // Genres defined here while be broken down into the release's style.
  // E.g. "Rock" genre will be broken down into "Rock", "Hard Rock", "Soft Rock", etc.
  "subgroup": [],

  // Keys of release ID and genre override.
  // You can get the release ID from the Discogs release view.
  // E.g. https://www.discogs.com/release/22556-foo-bar
  // The release ID is the number after release/ in the URL. (e.g. 22556)
  "genre": {},

  // Keys of release ID and style override.
  // This will override the style of the release. Styles are evaluated if genre is configured to be broken down which is done by the subgroup configuration.
  "style": {},
}
```