import { cac } from "cac";
import { organizeAction } from "./commands/organize";
import { locateAction } from "./commands/locate";
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
    .command("locate <collectionPath> [query]")
    .option("--lang <code>", "Language code for whisper (default: en)")
    .option("--no-speak", "Disable spoken response output")
    .option("--voice <name>", "macOS say voice override (default: Samantha)")
    .option(
      "--speech-rate <wpm>",
      "macOS say speech rate in words/minute (default: 200)",
    )
    .option("--stop-phrase <text>", "Voice/text phrase used to end loop")
    .option("--once", "Run one listen/query cycle and exit")
    .action(locateAction);

  cli
    .command("release-override <releaseId> <overrideValue>")
    .action(releaseOverrideAction);

  cli.help();

  return cli;
}

export default main;
