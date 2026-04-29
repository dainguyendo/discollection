import { describe, expect, it, vi } from "vitest";

const parse = vi.fn();
const main = vi.fn(() => ({ parse }));

vi.mock("./index", () => ({
  default: main,
}));

describe("cli entrypoint", () => {
  it("builds cli and parses argv", async () => {
    await import("./cli");

    expect(main).toHaveBeenCalledTimes(1);
    expect(parse).toHaveBeenCalledWith(process.argv);
  });
});
