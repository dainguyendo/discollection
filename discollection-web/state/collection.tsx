import { create } from "zustand";
import { Collection, Release } from "@/lib/types";

interface State {
  collection: Collection | null;
  format: number | null;
  set: (collection: Collection) => void;
  setFormat: (format: number) => void;
  clear: () => void;

  filtered: Array<Release["id"]> | null;
  setFiltered: (
    filtered: Array<Release["basic_information"]["id"]> | null
  ) => void;
}

export const useCollectionStore = create<State>()((set) => ({
  collection: null,
  format: null,
  set: (c: Collection) => {
    const formats = Object.keys(c);
    // Default selected format to the largest format
    const format = Math.max(...formats.map(Number));
    set({ collection: c, format });
  },
  setFormat: (format) => set({ format }),
  clear: () => set({ collection: null }),

  filtered: null,
  setFiltered: (filtered) => set({ filtered }),
}));
