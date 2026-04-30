import Fuse from "fuse.js";
import type { LocatedRelease } from "./locate";

type SearchDoc = {
  title: string;
  artist: string;
  titleArtist: string;
  genres: string;
  styles: string;
  labels: string;
  located: LocatedRelease;
};

export type LocateConfidence = "high" | "medium" | "low" | "requires-title";

export type LocateMatchResult = {
  confidence: LocateConfidence;
  top?: LocatedRelease;
  candidates: LocatedRelease[];
  reason: string;
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(value: string): Set<string> {
  return new Set(
    normalizeText(value)
      .split(" ")
      .map((token) => token.trim())
      .filter((token) => token.length > 0),
  );
}

function getTitleEvidenceMetrics(
  query: string,
  normalizedTitle: string,
): {
  overlap: number;
  titleCoverage: number;
  queryCoverage: number;
} {
  const queryTokens = tokenSet(query);
  const titleTokens = tokenSet(normalizedTitle);

  if (queryTokens.size === 0 || titleTokens.size === 0) {
    return {
      overlap: 0,
      titleCoverage: 0,
      queryCoverage: 0,
    };
  }

  let overlap = 0;
  for (const token of queryTokens) {
    if (titleTokens.has(token)) {
      overlap += 1;
    }
  }

  return {
    overlap,
    titleCoverage: overlap / titleTokens.size,
    queryCoverage: overlap / queryTokens.size,
  };
}

function hasTitleEvidence(query: string, normalizedTitle: string): boolean {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return false;
  }

  if (
    normalizedQuery === normalizedTitle ||
    normalizedQuery.includes(normalizedTitle) ||
    normalizedTitle.includes(normalizedQuery)
  ) {
    return true;
  }

  const queryTokens = tokenSet(normalizedQuery);

  if (queryTokens.size === 0) {
    return false;
  }

  const titleTokens = tokenSet(normalizedTitle);
  if (titleTokens.size === 0) {
    return false;
  }

  const { overlap, titleCoverage, queryCoverage } = getTitleEvidenceMetrics(
    normalizedQuery,
    normalizedTitle,
  );

  // Title coverage protects artist+title voice queries from being penalized.
  return overlap >= 1 && (titleCoverage >= 0.5 || queryCoverage >= 0.5);
}

export function createLocateSearcher(entries: LocatedRelease[]) {
  const docs: SearchDoc[] = entries.map((entry) => {
    const { release } = entry;
    const title = release.basic_information.title;
    const artist = release.basic_information.artists?.[0]?.name ?? "";

    return {
      title,
      artist,
      titleArtist: `${title} ${artist}`.trim(),
      genres: release.basic_information.genres.join(" "),
      styles: release.basic_information.styles.join(" "),
      labels: release.basic_information.labels
        .map((label) => label.name)
        .join(" "),
      located: entry,
    };
  });

  const strictFuse = new Fuse(docs, {
    includeScore: true,
    threshold: 0.4,
    keys: [
      { name: "title", weight: 0.55 },
      { name: "titleArtist", weight: 0.2 },
      { name: "artist", weight: 0.15 },
      { name: "styles", weight: 0.05 },
      { name: "genres", weight: 0.03 },
      { name: "labels", weight: 0.02 },
    ],
  });

  const looseFuse = new Fuse(docs, {
    includeScore: true,
    threshold: 0.65,
    keys: [
      { name: "title", weight: 0.55 },
      { name: "titleArtist", weight: 0.2 },
      { name: "artist", weight: 0.15 },
      { name: "styles", weight: 0.05 },
      { name: "genres", weight: 0.03 },
      { name: "labels", weight: 0.02 },
    ],
  });

  const byNormalizedTitle = new Map<string, LocatedRelease[]>();
  for (const entry of entries) {
    const current = byNormalizedTitle.get(entry.normalizedTitle) ?? [];
    current.push(entry);
    byNormalizedTitle.set(entry.normalizedTitle, current);
  }

  return {
    search(query: string): LocateMatchResult {
      const trimmed = query.trim();
      const normalizedQuery = normalizeText(trimmed);

      if (!trimmed) {
        return {
          confidence: "low",
          candidates: [],
          reason: "No query provided.",
        };
      }

      const exactTitleMatches = byNormalizedTitle.get(normalizedQuery) ?? [];
      if (exactTitleMatches.length === 1) {
        const exactMatch = exactTitleMatches[0] as LocatedRelease;
        return {
          confidence: "high",
          top: exactMatch,
          candidates: [exactMatch],
          reason: "Exact unique title match.",
        };
      }

      let ranked = strictFuse.search(trimmed, { limit: 5 });

      // Speech transcripts often include tiny distortions; loose pass catches
      // unique-but-near matches that strict threshold can miss.
      if (ranked.length === 0) {
        ranked = looseFuse.search(trimmed, { limit: 8 });
      }

      if (ranked.length === 0) {
        return {
          confidence: "low",
          candidates: [],
          reason: "No candidate releases matched.",
        };
      }

      const eligible = ranked.filter((candidate) =>
        hasTitleEvidence(trimmed, candidate.item.located.normalizedTitle),
      );

      if (eligible.length === 0) {
        return {
          confidence: "requires-title",
          candidates: ranked
            .slice(0, 3)
            .map((candidate) => candidate.item.located),
          reason: "Transcript did not include enough release-title evidence.",
        };
      }

      const top = eligible[0];
      if (!top) {
        return {
          confidence: "low",
          candidates: [],
          reason: "No eligible release candidates remained after filtering.",
        };
      }

      const second = eligible[1];
      const topScore = top.score ?? 1;
      const secondScore = second?.score ?? 1;
      const scoreGap = secondScore - topScore;
      const titleEvidence = getTitleEvidenceMetrics(
        normalizedQuery,
        top.item.located.normalizedTitle,
      );

      let confidence: LocateConfidence = "low";

      if (topScore <= 0.35 && scoreGap >= 0.05) {
        confidence = "high";
      } else if (topScore <= 0.5) {
        confidence = "medium";
      }

      if (confidence === "low" && titleEvidence.titleCoverage >= 0.75) {
        confidence = "medium";
      }

      if (
        confidence === "medium" &&
        titleEvidence.titleCoverage >= 0.9 &&
        scoreGap >= 0.03
      ) {
        confidence = "high";
      }

      return {
        confidence,
        top: top.item.located,
        candidates: eligible
          .slice(0, 3)
          .map((candidate) => candidate.item.located),
        reason:
          `Top score: ${topScore.toFixed(3)}, gap: ${scoreGap.toFixed(3)}, ` +
          `title coverage: ${titleEvidence.titleCoverage.toFixed(3)}`,
      };
    },
  };
}
