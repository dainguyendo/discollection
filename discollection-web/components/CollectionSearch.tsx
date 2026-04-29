import { useCollectionStore } from "@/state/collection";
import Fuse from "fuse.js";
import { X } from "lucide-react";
import React from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { getReleaseArtist, getReleaseLabel } from "@/lib/utils";

export const CollectionSearch = () => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const { collection, format, setFiltered } = useCollectionStore();

  const data = collection && format ? collection[format] : null;

  const releases = React.useMemo(() => {
    if (!data) return [];
    return Object.values(data).flatMap((item) => {
      const arr = Array.isArray(item) ? item : Object.values(item).flat();
      return arr.map((release) => ({
        id: release.basic_information.id,
        title: release.basic_information.title,
        artist: getReleaseArtist(release),
        labels: getReleaseLabel(release),
        genres: release.basic_information.genres,
        styles: release.basic_information.styles,
      }));
    });
  }, [data]);

  const fuse = React.useMemo(() => {
    return new Fuse(releases, {
      keys: ["title", "artist", "labels", "genres", "styles"],
      threshold: 0.3, // Adjust threshold for sensitivity
    });
  }, [releases]);

  const search = (value: string) => {
    if (!value) {
      setFiltered(null);
      return;
    }

    const results = fuse.search(value);

    const filteredReleaseIds = results.map((result) => result.item.id);

    setFiltered(filteredReleaseIds);

    // Get the first result and scroll to it
    const [first] = filteredReleaseIds;

    if (first) {
      const element = document.getElementById(`release-${first}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
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
