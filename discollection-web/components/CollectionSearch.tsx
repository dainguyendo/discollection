import { useCollectionStore } from "@/state/collection";
import { sanitizeKey } from "@/lib/layoutAlgorithms";
import { Release } from "@/lib/types";
import Fuse from "fuse.js";
import { X } from "lucide-react";
import React from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { getReleaseArtist, getReleaseLabel } from "@/lib/utils";

interface SearchableRelease {
  id: number;
  title: string;
  artist: string;
  labels: string;
  genres: string[];
  styles: string[];
  nodeId: string;
}

export const CollectionSearch = () => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const { collection, setFiltered, setFocusNodeId } = useCollectionStore();

  const releases = React.useMemo((): SearchableRelease[] => {
    if (!collection) return [];
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
        } else {
          return Object.entries(genreValue).flatMap(
            ([style, styleReleases]) => {
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
            },
          );
        }
      }),
    );
  }, [collection]);

  const fuse = React.useMemo(() => {
    return new Fuse(releases, {
      keys: ["title", "artist", "labels", "genres", "styles"],
      threshold: 0.3,
    });
  }, [releases]);

  const search = (value: string) => {
    if (!value) {
      setFiltered(null);
      return;
    }

    const results = fuse.search(value);
    const filteredReleaseIds = results.map((r) => r.item.id);
    setFiltered(filteredReleaseIds);

    const [first] = results;
    if (first) {
      setFocusNodeId(first.item.nodeId);
    }
  };

  return (
    <>
      <Input
        type="text"
        name="search"
        placeholder="Search"
        onChange={(event) => {
          const value = event.target.value;
          setSearchTerm(value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            search(searchTerm);
          }
        }}
      />

      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          setFiltered(null);
        }}
      >
        <X />
      </Button>
    </>
  );
};
