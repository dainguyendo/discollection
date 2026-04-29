"use client";

import { useCollectionStore } from "@/state/collection";
import { CollectionNode } from "./Collection";

export default function Home() {
  const { collection, format } = useCollectionStore();

  return (
    <div className="min-h-screen p-6 pb-6 sm:p-6 font-[family-name:var(--font-inter)] w-full">
      <main>
        {collection && format && <CollectionNode data={collection[format]} />}
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center"></footer>
    </div>
  );
}
