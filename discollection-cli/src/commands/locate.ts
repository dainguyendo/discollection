import fs from "fs";
import { stdout as output } from "node:process";

import logger from "../logger";
import { speakWithMacosSay } from "../speech/macos-say";
import {
  canUseWhisperVoiceMode,
  resolveDefaultWhisperModelPath,
  transcribeUtteranceWithWhisper,
} from "../speech/whisper";
import type { Release } from "../types";
import { buildLocatedReleases, type LocatedRelease } from "../utilities/locate";
import { createLocateSearcher } from "../utilities/locate-search";
import {
  buildOrganizedLibrary,
  loadOrganizeDataFromDb,
  type OrganizedLibrary,
} from "../utilities/organize";
import { getReleasePrimaryArtist } from "../utilities/release";

type LocateOptions = {
  collection?: string;
  lang?: string;
  speak?: boolean;
  voice?: string;
  speechRate?: string | number;
  stopPhrase?: string;
  once?: boolean;
};

function loadOrganizedCollectionFromFile(collectionPath: string): OrganizedLibrary {
  if (!fs.existsSync(collectionPath)) {
    throw new Error(`Collection file not found at: ${collectionPath}`);
  }

  const parsed = JSON.parse(fs.readFileSync(collectionPath, "utf-8")) as OrganizedLibrary;

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Collection file must contain an organized library JSON object.");
  }

  return parsed;
}

function loadOrganizedCollectionFromDb(): OrganizedLibrary {
  const { collection, overrides, dbConfig } = loadOrganizeDataFromDb();

  logger.info("Organizing collection from database", { total: collection.length });

  return buildOrganizedLibrary(collection, {
    subgroup: dbConfig.subgroup,
    consolidate: dbConfig.consolidate,
    genre: overrides.genre,
    style: overrides.style,
  });
}

function releaseLabel(release: Release): string {
  const artist = getReleasePrimaryArtist(release) || "Unknown Artist";
  return `${artist} - ${release.basic_information.title}`;
}

function formatMatchResponse(match: LocatedRelease): string {
  const details = [match.format, match.genre, match.style].filter(Boolean).join(" / ");

  const previous = match.previous ? releaseLabel(match.previous) : "start of section";
  const next = match.next ? releaseLabel(match.next) : "end of section";

  return [
    `Match: ${releaseLabel(match.release)}`,
    `Section: ${details}`,
    `Position: ${match.sectionIndex + 1}/${match.sectionTotal} in ${match.sectionLabel}`,
    `Between: ${previous} | ${next}`,
  ].join("\n");
}

function spokenBetweenContext(match: LocatedRelease): string {
  if (!match.previous && !match.next) {
    return "It is both the first and last record in this section.";
  }

  if (!match.previous && match.next) {
    return `It is first in this section, before ${releaseLabel(match.next)}.`;
  }

  if (match.previous && !match.next) {
    return `It is last in this section, after ${releaseLabel(match.previous)}.`;
  }

  return `It is between ${releaseLabel(match.previous as Release)} and ${releaseLabel(match.next as Release)}.`;
}

function maybeSpeak(message: string, options: LocateOptions): void {
  if (options.speak === false) {
    return;
  }

  const speechRate =
    typeof options.speechRate === "number"
      ? options.speechRate
      : options.speechRate
        ? Number.parseInt(options.speechRate, 10)
        : undefined;

  speakWithMacosSay(message, options.voice, speechRate);
}

async function getQueryFromVoice(modelPath: string, options: LocateOptions): Promise<string> {
  const availability = canUseWhisperVoiceMode();

  if (!availability.ok) {
    throw new Error(`Voice mode cannot start:\n${availability.reason}`);
  }

  output.write("\uD83C\uDFA4 Listening... (speak your release name)\n");

  const transcript = transcribeUtteranceWithWhisper({
    modelPath,
    lang: options.lang ?? "en",
    durationSeconds: 4,
  });

  if (!transcript) {
    output.write("(Nothing heard — please try again)\n");
    return "";
  }

  output.write(`\uD83D\uDDE3\uFE0F  Heard: "${transcript}"\n`);
  return transcript;
}

export const locateAction = async (queryArg: string | undefined, options: LocateOptions) => {
  logger.info("Starting locate session", { collection: options.collection, options });

  const organized = options.collection
    ? loadOrganizedCollectionFromFile(options.collection)
    : loadOrganizedCollectionFromDb();
  const located = buildLocatedReleases(organized);
  const searcher = createLocateSearcher(located);
  const stopPhrase = (options.stopPhrase ?? "stop listening").toLowerCase();

  const runTurn = async (query: string) => {
    const result = searcher.search(query);

    if (result.confidence === "requires-title") {
      const message = "Please say the release name so I can confidently match it.";
      logger.info(message, { query, reason: result.reason });
      maybeSpeak(message, options);
      return;
    }

    if (!result.top) {
      const message = "No reliable match found. Please repeat the release name.";
      logger.info(message, { query, reason: result.reason });
      maybeSpeak(message, options);
      return;
    }

    const response = formatMatchResponse(result.top);
    logger.info("Locate match", {
      query,
      confidence: result.confidence,
      reason: result.reason,
    });

    if (result.confidence === "medium") {
      output.write(`Best guess:\n${response}\n`);
      maybeSpeak(
        `Best guess: ${releaseLabel(result.top.release)}. ${result.top.format}, ${result.top.genre}${result.top.style ? `, ${result.top.style}` : ""}. ${spokenBetweenContext(result.top)}`,
        options,
      );
      return;
    }

    if (result.confidence === "low") {
      output.write(`Uncertain match — did you mean:\n${response}\n`);
      maybeSpeak(
        `Did you mean ${releaseLabel(result.top.release)}? ${spokenBetweenContext(result.top)}`,
        options,
      );
      return;
    }

    output.write(`${response}\n`);
    maybeSpeak(
      `${releaseLabel(result.top.release)}. ${result.top.format}, ${result.top.genre}${result.top.style ? `, ${result.top.style}` : ""}. ${spokenBetweenContext(result.top)}`,
      options,
    );
  };

  if (queryArg) {
    await runTurn(queryArg);
    return;
  }

  // Voice-first locate mode: dependencies and default model are required.
  const availability = canUseWhisperVoiceMode();
  if (!availability.ok) {
    output.write(`\u274C Voice mode error:\n${availability.reason}\n`);
    process.exit(1);
  }

  const modelResolution = resolveDefaultWhisperModelPath();
  if (!modelResolution.ok || !modelResolution.modelPath) {
    output.write(`\u274C Voice mode error:\n${modelResolution.reason}\n`);
    process.exit(1);
  }

  const modelPath = modelResolution.modelPath;

  output.write(
    `\uD83C\uDFA4 Voice mode active — model: ${modelPath}\n` +
      `Say the release name, or say "${options.stopPhrase ?? "stop listening"}" to exit.\n\n`,
  );

  if (options.once) {
    const onceQuery = await getQueryFromVoice(modelPath, options);
    if (onceQuery && onceQuery.toLowerCase() !== stopPhrase) {
      await runTurn(onceQuery);
    }
    return;
  }

  // Continuous loop mode.
  while (true) {
    const query = await getQueryFromVoice(modelPath, options);
    const normalized = query.toLowerCase();

    if (!query) {
      continue;
    }

    if (normalized === stopPhrase) {
      logger.info("Stop phrase received. Ending locate session.");
      return;
    }

    await runTurn(query);
  }
};
