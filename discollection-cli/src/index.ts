import { cac } from "cac";
import invariant from "invariant";
import { organizeAction } from "./commands/organize";

invariant(
  process.env["DISCOGS_PERSONAL_ACCESS_TOKEN"],
  "Missing Discogs access token. See https://www.discogs.com/settings/developers",
);
invariant(process.env["DISCOGS_USER"], "Missing Discogs user");
invariant(process.env["DISCOGS_FOLDER_ID"], "Missing folder ID");

function main() {
  const cli = cac("discollection");
  cli
    .command("organize <output>")
    .option("--cache", "Use cached collection data")
    .option("--config <path>", "Path to config file")
    .action(organizeAction);

  cli.help();

  return cli;
}

export default main;
