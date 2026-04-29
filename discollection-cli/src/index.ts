import { cac } from "cac";
import { organizeAction } from "./commands/organize";
import { releaseOverrideAction } from "./commands/release-override";
import { seedAction } from "./commands/seed";
import { syncAction } from "./commands/sync";

function main() {
  const cli = cac("discollection");
  cli
    .command("organize <output>")
    .option("--config <path>", "Path to config file")
    .action(organizeAction);

  cli
    .command("seed")
    .option("--config <path>", "Path to config file")
    .action(seedAction);

  cli.command("sync").action(syncAction);

  cli
    .command("release-override <releaseId> <overrideValue>")
    .action(releaseOverrideAction);

  cli.help();

  return cli;
}

export default main;
