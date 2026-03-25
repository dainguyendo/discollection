import { cac } from "cac";
import { organizeAction } from "./commands/organize";
import { dbDemoAction } from "./commands/db-demo";

function main() {
  const cli = cac("discollection");
  cli
    .command("organize <output>")
    .option("--cache", "Use cached collection data")
    .option("--config <path>", "Path to config file")
    .action(organizeAction);

  cli
    .command("db:demo")
    .option("--path <path>", "SQLite file path")
    .option("--key <key>", "Key to upsert/read in demo table")
    .option("--value <value>", "Value to insert when key does not exist")
    .action(dbDemoAction);

  cli.help();

  return cli;
}

export default main;
