"use client";

import { useCollectionStore } from "@/state/collection";
import { sanitizeKey } from "@/lib/layoutAlgorithms";
import { Collection, Release } from "@/lib/types";
import { getReleaseArtist, getReleaseLabel } from "@/lib/utils";
import * as Collapsible from "@radix-ui/react-collapsible";
import * as Separator from "@radix-ui/react-separator";
import * as Tooltip from "@radix-ui/react-tooltip";
import Fuse from "fuse.js";
import { ChevronLeft, ChevronRight, Upload, X } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import {
  ChangeEvent,
  useRef,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { cn } from "@/lib/utils";

// ─── Tree ────────────────────────────────────────────────────────────────────

interface TreeRowProps {
  label: string;
  nodeId: string;
  count?: number;
  depth?: number;
  onFocus: (id: string) => void;
}

function TreeRow({ label, nodeId, count, depth = 0, onFocus }: TreeRowProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-xs transition-colors",
        "text-white/50 hover:bg-white/[0.06] hover:text-white/80",
        depth === 0 && "font-semibold text-white/65",
      )}
      style={{ paddingLeft: `${8 + depth * 12}px` }}
      onClick={() => onFocus(nodeId)}
    >
      <span className="truncate flex-1">{label}</span>
      {count !== undefined && (
        <span className="ml-auto shrink-0 tabular-nums text-white/30">
          {count}
        </span>
      )}
    </button>
  );
}

interface TreeSectionProps {
  formatKey: string;
  formatData: Record<string, Release[] | Record<string, Release[]>>;
  onFocus: (id: string) => void;
}

function TreeSection({ formatKey, formatData, onFocus }: TreeSectionProps) {
  const [open, setOpen] = useState(true);

  const totalCount = useMemo(() => {
    let n = 0;
    for (const v of Object.values(formatData)) {
      if (Array.isArray(v)) n += v.length;
      else
        n += Object.values(v).reduce((s, r) => s + (r as unknown[]).length, 0);
    }
    return n;
  }, [formatData]);

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs font-semibold text-white/70 hover:bg-white/[0.06] hover:text-white/90 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <ChevronRight
            className={cn(
              "h-3 w-3 shrink-0 text-white/40 transition-transform duration-150",
              open && "rotate-90",
            )}
          />
          <span className="truncate flex-1">{formatKey}&quot;</span>
          <span className="ml-auto shrink-0 tabular-nums text-white/30">
            {totalCount}
          </span>
        </button>
      </Collapsible.Trigger>

      <Collapsible.Content className="overflow-hidden data-[state=open]:animate-none">
        <div className="pb-1">
          {Object.entries(formatData).map(([genre, genreValue]) => {
            const genreNodeId = `section-${sanitizeKey(formatKey)}-${sanitizeKey(genre)}`;

            if (Array.isArray(genreValue)) {
              return (
                <TreeRow
                  key={genre}
                  label={genre}
                  nodeId={genreNodeId}
                  count={genreValue.length}
                  depth={1}
                  onFocus={onFocus}
                />
              );
            }

            const styleEntries = Object.entries(genreValue);
            const total = styleEntries.reduce(
              (s, [, r]) => s + (r as unknown[]).length,
              0,
            );

            return (
              <div key={genre}>
                <TreeRow
                  label={genre}
                  nodeId={genreNodeId}
                  count={total}
                  depth={1}
                  onFocus={onFocus}
                />
                {styleEntries.map(([style, releases]) => {
                  const styleNodeId = `section-${sanitizeKey(formatKey)}-${sanitizeKey(genre)}-${sanitizeKey(style)}`;
                  return (
                    <TreeRow
                      key={style}
                      label={style}
                      nodeId={styleNodeId}
                      count={(releases as unknown[]).length}
                      depth={2}
                      onFocus={onFocus}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

// ─── Search ──────────────────────────────────────────────────────────────────

interface SearchableRelease {
  id: number;
  title: string;
  artist: string;
  labels: string;
  genres: string[];
  styles: string[];
  nodeId: string;
}

function buildSearchIndex(collection: Collection): SearchableRelease[] {
  return Object.entries(collection).flatMap(([formatKey, formatData]) =>
    Object.entries(formatData).flatMap(([genre, genreValue]) => {
      if (Array.isArray(genreValue)) {
        const sectionId = `section-${sanitizeKey(formatKey)}-${sanitizeKey(genre)}`;
        return genreValue.map((release: Release) => ({
          id: release.basic_information.id,
          title: release.basic_information.title,
          artist: getReleaseArtist(release),
          labels: getReleaseLabel(release),
          genres: release.basic_information.genres,
          styles: release.basic_information.styles,
          nodeId: `release-${release.basic_information.id}-${sectionId}`,
        }));
      }
      return Object.entries(genreValue).flatMap(([style, styleReleases]) => {
        const sectionId = `section-${sanitizeKey(formatKey)}-${sanitizeKey(genre)}-${sanitizeKey(style)}`;
        return (styleReleases as Release[]).map((release: Release) => ({
          id: release.basic_information.id,
          title: release.basic_information.title,
          artist: getReleaseArtist(release),
          labels: getReleaseLabel(release),
          genres: release.basic_information.genres,
          styles: release.basic_information.styles,
          nodeId: `release-${release.basic_information.id}-${sectionId}`,
        }));
      });
    }),
  );
}

// ─── Icon button ─────────────────────────────────────────────────────────────

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          onClick={onClick}
          className="flex h-8 w-8 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white/80"
        >
          {children}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="right"
          sideOffset={8}
          className="z-50 rounded-md bg-black/80 px-2 py-1 text-xs text-white/90 backdrop-blur-md"
        >
          {label}
          <Tooltip.Arrow className="fill-black/80" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

// ─── SidePanel ───────────────────────────────────────────────────────────────

interface SidePanelProps {
  collection: Collection;
  onUpload: (file: File) => Promise<void>;
}

export function SidePanel({ collection, onUpload }: SidePanelProps) {
  const { setFocusNodeId, setFiltered } = useCollectionStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [matchNodeIds, setMatchNodeIds] = useState<string[]>([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);

  useHotkeys(
    "meta+f",
    (event) => {
      event.preventDefault();
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    },
    { preventDefault: true },
  );

  const releases = useMemo(() => buildSearchIndex(collection), [collection]);

  const fuse = useMemo(
    () =>
      new Fuse(releases, {
        keys: ["title", "artist", "labels", "genres", "styles"],
        threshold: 0.3,
      }),
    [releases],
  );

  const handleSearch = useCallback(
    (value: string) => {
      if (!value.trim()) {
        setFiltered(null);
        setMatchNodeIds([]);
        setActiveMatchIndex(0);
        return;
      }

      const results = fuse.search(value);
      setFiltered(results.map((r) => r.item.id));

      const nextMatchNodeIds = results.map((result) => result.item.nodeId);
      setMatchNodeIds(nextMatchNodeIds);
      setActiveMatchIndex(0);

      const [firstNodeId] = nextMatchNodeIds;
      if (firstNodeId) setFocusNodeId(firstNodeId);
    },
    [fuse, setFiltered, setFocusNodeId],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      handleSearch(searchTerm);
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchTerm, handleSearch]);

  const focusMatchAt = useCallback(
    (targetIndex: number) => {
      if (!matchNodeIds.length) return;

      const normalizedIndex =
        ((targetIndex % matchNodeIds.length) + matchNodeIds.length) %
        matchNodeIds.length;

      setActiveMatchIndex(normalizedIndex);
      setFocusNodeId(matchNodeIds[normalizedIndex]);
    },
    [matchNodeIds, setFocusNodeId],
  );

  const clearSearch = () => {
    setSearchTerm("");
    setFiltered(null);
    setMatchNodeIds([]);
    setActiveMatchIndex(0);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUpload(file);
      e.target.value = "";
    }
  };

  const sortedFormats = useMemo(
    () => Object.entries(collection).sort(([a], [b]) => Number(b) - Number(a)),
    [collection],
  );

  return (
    <Tooltip.Provider delayDuration={400}>
      <aside className="relative z-10 flex h-screen w-56 flex-col border-r border-white/[0.08] bg-white/[0.04] backdrop-blur-md">
        {/* Header */}
        <div className="px-3 py-4">
          <p className="font-mono text-sm font-bold tracking-tight text-white/80">
            discollection
          </p>
        </div>

        <Separator.Root className="h-px bg-white/[0.07]" />

        {/* Search */}
        <div className="px-3 py-2">
          <div className="flex items-center gap-1 rounded-md border border-white/[0.1] bg-white/[0.04] px-2 focus-within:border-white/[0.2] focus-within:bg-white/[0.07] transition-colors">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search releases…"
              value={searchTerm}
              className="flex-1 bg-transparent py-1.5 text-xs text-white/80 placeholder-white/30 outline-none"
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") clearSearch();
                if (e.key === "Enter" && matchNodeIds.length > 1) {
                  e.preventDefault();
                  focusMatchAt(activeMatchIndex + 1);
                }
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          {searchTerm.trim() && (
            <div className="mt-1 flex items-center justify-between px-1 text-[10px] text-white/35">
              <span className="tabular-nums">
                {matchNodeIds.length === 0
                  ? "No matches"
                  : `${activeMatchIndex + 1} / ${matchNodeIds.length} matches`}
              </span>
              {matchNodeIds.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Previous match"
                    onClick={() => focusMatchAt(activeMatchIndex - 1)}
                    className="rounded p-0.5 text-white/45 transition-colors hover:bg-white/[0.08] hover:text-white/80"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next match"
                    onClick={() => focusMatchAt(activeMatchIndex + 1)}
                    className="rounded p-0.5 text-white/45 transition-colors hover:bg-white/[0.08] hover:text-white/80"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <Separator.Root className="h-px bg-white/[0.07]" />

        {/* Tree nav */}
        <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
          <p className="mb-1 px-2 text-[10px] font-medium uppercase tracking-widest text-white/25">
            Formats
          </p>
          {sortedFormats.map(([formatKey, formatData]) => (
            <TreeSection
              key={formatKey}
              formatKey={formatKey}
              formatData={
                formatData as Record<
                  string,
                  Release[] | Record<string, Release[]>
                >
              }
              onFocus={setFocusNodeId}
            />
          ))}
        </div>

        <Separator.Root className="h-px bg-white/[0.07]" />

        {/* Footer actions */}
        <div className="flex items-center gap-1 px-2 py-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={handleFileChange}
          />
          <IconButton
            label="Upload new collection"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
          </IconButton>
        </div>
      </aside>
    </Tooltip.Provider>
  );
}
