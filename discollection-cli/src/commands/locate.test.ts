import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const logger = {
    info: vi.fn(),
  };

  const existsSync = vi.fn(() => true);
  const readFileSync = vi.fn(() => "{}");
  const write = vi.fn();
  const canUseWhisperVoiceMode = vi.fn(() => ({ ok: true }));
  const resolveDefaultWhisperModelPath = vi.fn(() => ({
    ok: true,
    modelPath: "/tmp/model.bin",
  }));
  const transcribeUtteranceWithWhisper = vi.fn();
  const speakWithMacosSay = vi.fn();
  const buildLocatedReleases = vi.fn(() => []);
  const search = vi.fn(() => ({
    confidence: "high",
    reason: "Exact unique title match.",
    top: {
      release: {
        basic_information: {
          title: "Kind of Blue",
          artists: [{ name: "Miles Davis" }],
        },
      },
      format: "LP",
      genre: "Jazz",
      sectionIndex: 0,
      sectionTotal: 1,
      sectionLabel: "LP > Jazz",
    },
  }));
  const createLocateSearcher = vi.fn(() => ({ search }));

  return {
    logger,
    existsSync,
    readFileSync,
    write,
    canUseWhisperVoiceMode,
    resolveDefaultWhisperModelPath,
    transcribeUtteranceWithWhisper,
    speakWithMacosSay,
    buildLocatedReleases,
    createLocateSearcher,
    search,
  };
});

vi.mock("fs", () => ({
  default: {
    existsSync: mocks.existsSync,
    readFileSync: mocks.readFileSync,
  },
}));

vi.mock("node:process", () => ({
  stdout: {
    write: mocks.write,
  },
}));

vi.mock("../logger", () => ({
  default: mocks.logger,
}));

vi.mock("../utilities/locate", () => ({
  buildLocatedReleases: mocks.buildLocatedReleases,
}));

vi.mock("../utilities/locate-search", () => ({
  createLocateSearcher: mocks.createLocateSearcher,
}));

vi.mock("../utilities/release", () => ({
  getReleasePrimaryArtist: (release: { basic_information: { artists?: Array<{ name: string }> } }) =>
    release.basic_information.artists?.[0]?.name,
}));

vi.mock("../speech/whisper", () => ({
  canUseWhisperVoiceMode: mocks.canUseWhisperVoiceMode,
  resolveDefaultWhisperModelPath: mocks.resolveDefaultWhisperModelPath,
  transcribeUtteranceWithWhisper: mocks.transcribeUtteranceWithWhisper,
}));

vi.mock("../speech/macos-say", () => ({
  speakWithMacosSay: mocks.speakWithMacosSay,
}));

describe("locateAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs text queries without requiring whisper dependencies", async () => {
    const { locateAction } = await import("./locate");

    await locateAction("./organized.json", "kind of blue", { speak: false });

    expect(mocks.canUseWhisperVoiceMode).not.toHaveBeenCalled();
    expect(mocks.resolveDefaultWhisperModelPath).not.toHaveBeenCalled();
    expect(mocks.search).toHaveBeenCalledWith("kind of blue");
    expect(mocks.write).toHaveBeenCalledWith(
      expect.stringContaining("Match: Miles Davis - Kind of Blue"),
    );
  });
});