import { Collection, Release } from "./types";

export interface CanvasNode {
  id: string;
  type?: "release" | "container";
  parentNode?: string;
  extent?: "parent";
  draggable?: boolean;
  selectable?: boolean;
  connectable?: boolean;
  style?: {
    width?: number;
    height?: number;
    [key: string]: unknown;
  };
  data: {
    label: string;
    release?: Release;
    type: "release" | "group";
    level?: "format" | "section";
    groupPath: string[];
  };
  position: { x: number; y: number };
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
}

const RELEASE_WIDTH = 320;
const RELEASE_HEIGHT = 320;
const RELEASE_GAP_X = 20;
const RELEASE_GAP_Y = 20;
const SECTION_PADDING = 16;
const SECTION_HEADER_HEIGHT = 46;
const SECTION_GAP_Y = 36;
const FORMAT_GAP_Y = 72;
const ROOT_X = 64;
const ROOT_Y = 48;
const MAX_RELEASES_PER_ROW = 8;

interface BuildResult {
  nodes: CanvasNode[];
  width: number;
  height: number;
}

export function sanitizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function buildReleaseShelf(
  releases: Release[],
  parentId: string,
  path: string[],
): BuildResult {
  const columns = Math.max(1, Math.min(MAX_RELEASES_PER_ROW, releases.length));
  const rows = Math.max(1, Math.ceil(releases.length / columns));

  const contentWidth =
    columns * RELEASE_WIDTH + Math.max(0, columns - 1) * RELEASE_GAP_X;
  const contentHeight =
    rows * RELEASE_HEIGHT + Math.max(0, rows - 1) * RELEASE_GAP_Y;

  const width = SECTION_PADDING * 2 + contentWidth;
  const height = SECTION_HEADER_HEIGHT + SECTION_PADDING * 2 + contentHeight;

  const nodes: CanvasNode[] = releases.map((release, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    const id = `release-${release.basic_information.id}-${parentId}`;

    return {
      id,
      type: "release",
      parentNode: parentId,
      extent: "parent",
      draggable: false,
      connectable: false,
      data: {
        label: release.basic_information.title,
        release,
        type: "release",
        groupPath: path,
      },
      position: {
        x: SECTION_PADDING + col * (RELEASE_WIDTH + RELEASE_GAP_X),
        y:
          SECTION_HEADER_HEIGHT +
          SECTION_PADDING +
          row * (RELEASE_HEIGHT + RELEASE_GAP_Y),
      },
    };
  });

  return { nodes, width, height };
}

function buildSectionNode(
  label: string,
  value: Array<Release> | Record<string, unknown>,
  parentId: string | null,
  path: string[],
  level: "format" | "section",
): BuildResult {
  const sectionId = `${level}-${path.map(sanitizeKey).join("-")}`;

  let childrenResult: BuildResult;

  if (Array.isArray(value)) {
    childrenResult = buildReleaseShelf(value, sectionId, path);
  } else {
    const childEntries = Object.entries(value);
    const childNodes: CanvasNode[] = [];
    let currentY = SECTION_HEADER_HEIGHT + SECTION_PADDING;
    let maxChildWidth = 0;

    childEntries.forEach(([childLabel, childValue]) => {
      const result = buildSectionNode(
        childLabel,
        childValue as Array<Release> | Record<string, unknown>,
        sectionId,
        [...path, childLabel],
        "section",
      );

      maxChildWidth = Math.max(maxChildWidth, result.width);

      result.nodes.forEach((childNode) => {
        // Root node of this child section gets repositioned in the parent stack.
        if (
          childNode.id ===
          `section-${[...path, childLabel].map(sanitizeKey).join("-")}`
        ) {
          childNode.position = {
            x: SECTION_PADDING,
            y: currentY,
          };
        }
      });

      childNodes.push(...result.nodes);
      currentY += result.height + SECTION_GAP_Y;
    });

    const contentHeight =
      childEntries.length === 0
        ? RELEASE_HEIGHT
        : currentY - (SECTION_HEADER_HEIGHT + SECTION_PADDING) - SECTION_GAP_Y;

    const width = SECTION_PADDING * 2 + maxChildWidth;
    const height = SECTION_HEADER_HEIGHT + SECTION_PADDING * 2 + contentHeight;

    childrenResult = { nodes: childNodes, width, height };
  }

  const sectionNode: CanvasNode = {
    id: sectionId,
    type: "container",
    parentNode: parentId ?? undefined,
    extent: parentId ? "parent" : undefined,
    draggable: false,
    connectable: false,
    selectable: false,
    data: {
      label,
      type: "group",
      level,
      groupPath: path,
    },
    position: { x: 0, y: 0 },
    style: {
      width: childrenResult.width,
      height: childrenResult.height,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "hsl(var(--border))",
      background: "hsl(var(--card) / 0.45)",
    },
  };

  return {
    nodes: [sectionNode, ...childrenResult.nodes],
    width: childrenResult.width,
    height: childrenResult.height,
  };
}

/**
 * Builds a nested React Flow graph:
 * format containers stacked vertically (12 at top, 7 at bottom),
 * recursive genre/style sections inside each format,
 * and release cards laid out in row-oriented shelf rows.
 */
export function buildCanvasGraph(collection: Collection): {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
} {
  const formatKeys = Object.keys(collection).sort(
    (a, b) => Number(b) - Number(a),
  );
  const allNodes: CanvasNode[] = [];
  let currentY = ROOT_Y;

  formatKeys.forEach((formatKey) => {
    const formatData = collection[formatKey];
    const result = buildSectionNode(
      `${formatKey}\" Records`,
      formatData as Record<string, unknown>,
      null,
      [formatKey],
      "format",
    );

    result.nodes.forEach((node) => {
      if (node.id === `format-${sanitizeKey(formatKey)}`) {
        node.position = { x: ROOT_X, y: currentY };
      }
    });

    currentY += result.height + FORMAT_GAP_Y;
    allNodes.push(...result.nodes);
  });

  return {
    nodes: allNodes,
    edges: [],
  };
}
