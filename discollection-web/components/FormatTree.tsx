"use client";

import { Collection } from "@/lib/types";
import { sanitizeKey } from "@/lib/layoutAlgorithms";
import { useCollectionStore } from "@/state/collection";
import { cn } from "@/lib/utils";

interface Props {
  data: Collection;
}

function TreeItem({
  label,
  nodeId,
  count,
  depth,
  children,
  onFocus,
}: {
  label: string;
  nodeId: string;
  count?: number;
  depth: number;
  children?: React.ReactNode;
  onFocus: (id: string) => void;
}) {
  const hasChildren = Boolean(children);

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-accent cursor-pointer select-none",
          depth === 0 && "font-semibold",
        )}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        onClick={() => onFocus(nodeId)}
      >
        <span className="w-3 shrink-0" />
        <span className="truncate">{label}</span>
        {count !== undefined && (
          <span className="ml-auto pl-2 text-xs text-muted-foreground shrink-0">
            {count}
          </span>
        )}
      </div>
      {hasChildren && <div>{children}</div>}
    </div>
  );
}

export const FormatTree = ({ data }: Props) => {
  const { setFocusNodeId } = useCollectionStore();

  return (
    <div className="max-h-96 min-w-48 overflow-y-auto py-1">
      {Object.entries(data)
        .sort(([a], [b]) => Number(b) - Number(a))
        .map(([formatKey, formatData]) => {
        const formatNodeId = `format-${sanitizeKey(formatKey)}`;

        return (
          <TreeItem
            key={formatKey}
            label={`${formatKey}"`}
            nodeId={formatNodeId}
            depth={0}
            onFocus={setFocusNodeId}
          >
            {Object.entries(formatData).map(([genre, genreValue]) => {
              const genreNodeId = `section-${sanitizeKey(formatKey)}-${sanitizeKey(genre)}`;

              if (Array.isArray(genreValue)) {
                return (
                  <TreeItem
                    key={genre}
                    label={genre}
                    nodeId={genreNodeId}
                    count={genreValue.length}
                    depth={1}
                    onFocus={setFocusNodeId}
                  />
                );
              }

              const styleEntries = Object.entries(genreValue);
              const totalCount = styleEntries.reduce(
                (sum, [, releases]) => sum + (releases as unknown[]).length,
                0,
              );

              return (
                <TreeItem
                  key={genre}
                  label={genre}
                  nodeId={genreNodeId}
                  count={totalCount}
                  depth={1}
                  onFocus={setFocusNodeId}
                >
                  {styleEntries.map(([style, releases]) => {
                    const styleNodeId = `section-${sanitizeKey(formatKey)}-${sanitizeKey(genre)}-${sanitizeKey(style)}`;
                    return (
                      <TreeItem
                        key={style}
                        label={style}
                        nodeId={styleNodeId}
                        count={(releases as unknown[]).length}
                        depth={2}
                        onFocus={setFocusNodeId}
                      />
                    );
                  })}
                </TreeItem>
              );
            })}
          </TreeItem>
        );
      })}
    </div>
  );
};
