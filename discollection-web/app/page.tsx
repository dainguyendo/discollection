"use client";

import { useCollectionStore } from "@/state/collection";
import { InfiniteCanvasFlow } from "@/components/InfiniteCanvasFlow";

export default function Home() {
  const { collection } = useCollectionStore();

  if (!collection) {
    return (
      <div className="min-h-screen p-6 pb-6 sm:p-6 font-[family-name:var(--font-inter)] w-full flex items-center justify-center text-muted-foreground">
        <p>Upload a collection to get started</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-[family-name:var(--font-inter)] w-full">
      <InfiniteCanvasFlow data={collection} />
    </div>
  );
}
