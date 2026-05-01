import main from "./index";

const cli = main();

try {
  cli.parse(process.argv);
} catch (err) {
  process.stderr.write(`Error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
}

// Catch unhandled async rejections from cac action handlers
process.on("unhandledRejection", (reason) => {
  process.stderr.write(`Error: ${reason instanceof Error ? reason.message : String(reason)}\n`);
  process.exit(1);
});
