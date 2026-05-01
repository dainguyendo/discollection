import { spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

export type WhisperTranscriptionOptions = {
  modelPath: string;
  lang: string;
  durationSeconds?: number;
  whisperCliPath?: string;
};

const DEFAULT_WHISPER_MODEL_NAME = "ggml-base.en.bin";

function defaultModelCandidates(): string[] {
  const envPath = process.env.WHISPER_MODEL_PATH?.trim();

  return [
    envPath,
    path.join(os.homedir(), "Library", "Caches", "whisper", DEFAULT_WHISPER_MODEL_NAME),
    path.join(os.homedir(), ".cache", "whisper", DEFAULT_WHISPER_MODEL_NAME),
    path.join(process.cwd(), "models", DEFAULT_WHISPER_MODEL_NAME),
  ].filter((value): value is string => Boolean(value));
}

export function resolveDefaultWhisperModelPath(): {
  ok: boolean;
  modelPath?: string;
  reason?: string;
} {
  const candidates = defaultModelCandidates();

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return {
        ok: true,
        modelPath: candidate,
      };
    }
  }

  return {
    ok: false,
    reason:
      `Whisper model not found.\n\n` +
      `Install ${DEFAULT_WHISPER_MODEL_NAME} in a standard whisper cache location, ` +
      `or set WHISPER_MODEL_PATH to your model file.\n\n` +
      `Download it with:\n` +
      `  mkdir -p ~/Library/Caches/whisper\n` +
      `  curl -L https://huggingface.co/ggerganov/whisper.cpp/resolve/main/${DEFAULT_WHISPER_MODEL_NAME} -o ~/Library/Caches/whisper/${DEFAULT_WHISPER_MODEL_NAME}` +
      `\nThen rerun locate.`,
  };
}

function commandExists(command: string): boolean {
  const result = spawnSync("which", [command], { encoding: "utf-8" });
  return result.status === 0;
}

export function canUseWhisperVoiceMode(whisperCliPath = "whisper-cli"): {
  ok: boolean;
  reason?: string;
} {
  if (!commandExists("ffmpeg")) {
    return {
      ok: false,
      reason: "ffmpeg not found. Install it with: brew install ffmpeg",
    };
  }

  if (!commandExists(whisperCliPath)) {
    return {
      ok: false,
      reason:
        `whisper-cli not found. Install whisper.cpp with:\n` +
        `  brew install whisper-cpp\n` +
        `Then download a model:\n` +
        `  whisper-download-ggml-model base.en\n` +
        `  (model file will be in ~/Library/Caches/whisper)`,
    };
  }

  return { ok: true };
}

export function transcribeUtteranceWithWhisper(options: WhisperTranscriptionOptions): string {
  const { modelPath, lang, durationSeconds = 4, whisperCliPath = "whisper-cli" } = options;

  if (!fs.existsSync(modelPath)) {
    throw new Error(`Whisper model file not found at: ${modelPath}`);
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "discollection-whisper-"));
  const wavPath = path.join(tmpDir, "input.wav");
  const outBasePath = path.join(tmpDir, "transcript");

  try {
    const record = spawnSync(
      "ffmpeg",
      [
        "-y",
        "-f",
        "avfoundation",
        "-i",
        ":0",
        "-t",
        String(durationSeconds),
        "-ac",
        "1",
        "-ar",
        "16000",
        wavPath,
      ],
      { stdio: "ignore" },
    );

    if (record.status !== 0) {
      throw new Error("Failed recording from microphone with ffmpeg.");
    }

    const transcribe = spawnSync(
      whisperCliPath,
      ["-m", modelPath, "-f", wavPath, "-l", lang, "-nt", "-of", outBasePath, "-otxt"],
      { encoding: "utf-8" },
    );

    if (transcribe.status !== 0) {
      throw new Error(
        transcribe.stderr?.trim() ||
          transcribe.stdout?.trim() ||
          "whisper-cli transcription failed.",
      );
    }

    const txtPath = `${outBasePath}.txt`;

    if (!fs.existsSync(txtPath)) {
      throw new Error("whisper-cli did not produce a transcript text file.");
    }

    const raw = fs.readFileSync(txtPath, "utf-8").trim();

    // Whisper emits bracket/paren-wrapped tokens like [BLANK_AUDIO] or [MUSIC PLAYING]
    // when no intelligible speech is detected — treat all of them as empty.
    if (/^[[(].*[\])]$|^$/.test(raw)) {
      return "";
    }

    return raw;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
