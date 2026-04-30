import { spawnSync } from "child_process";

const DEFAULT_TTS_VOICE =
  process.env.DISCOLLECTION_TTS_VOICE?.trim() || "Samantha";
const DEFAULT_TTS_RATE_WPM = 200;

function clampSpeechRate(rate?: number): number {
  if (!rate || Number.isNaN(rate)) {
    return DEFAULT_TTS_RATE_WPM;
  }

  return Math.max(120, Math.min(260, Math.round(rate)));
}

export function speakWithMacosSay(
  text: string,
  voice?: string,
  rateWpm?: number,
): void {
  const resolvedVoice = voice?.trim() || DEFAULT_TTS_VOICE;
  const resolvedRate = clampSpeechRate(rateWpm);

  const args = ["-v", resolvedVoice, "-r", String(resolvedRate), text];
  spawnSync("say", args, { stdio: "ignore" });
}
