import { Command } from "commander";
import invariant from "invariant";
import sync from "./commands/sync";
import list from "./commands/list";
import genre from "./commands/genre";
import style from "./commands/style";
import organize from "./commands/organize";

invariant(
  process.env["DISCOGS_PERSONAL_ACCESS_TOKEN"],
  "Missing Discogs access token. See https://www.discogs.com/settings/developers",
);
invariant(process.env["DISCOGS_USER"], "Missing Discogs user");
invariant(process.env["DISCOGS_FOLDER_ID"], "Missing folder ID");

function main() {
  const program = new Command();

  program
    .name("disc")
    .description("CLI to Dai's Discogs collection")
    .version("0.8.0");

  sync(program);
  list(program);
  genre(program);
  style(program);
  organize(program);

  return program;
}

export default main;
