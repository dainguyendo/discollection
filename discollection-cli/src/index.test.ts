import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const command = vi.fn((_name: string) => {
    const chain = {
      option: vi.fn(() => chain),
      action: vi.fn(() => chain),
    };
    return chain;
  });

  const help = vi.fn();
  const cli = { command, help };
  const cac = vi.fn(() => cli);

  return { command, help, cli, cac };
});

vi.mock("cac", () => ({ cac: mocks.cac }));

describe("main", () => {
  it("registers all CLI commands", async () => {
    const { default: main } = await import("./index");
    const built = main();

    expect(mocks.cac).toHaveBeenCalledWith("discollection");
    expect(mocks.command).toHaveBeenCalledWith("organize <output>");
    expect(mocks.command).toHaveBeenCalledWith("seed");
    expect(mocks.command).toHaveBeenCalledWith("sync");
    expect(mocks.command).toHaveBeenCalledWith("release-override <releaseId> <overrideValue>");
    expect(mocks.help).toHaveBeenCalledTimes(1);
    expect(built).toBe(mocks.cli);
  });
});
