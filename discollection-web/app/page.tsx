"use client";

import { useCollectionStore } from "@/state/collection";
import { InfiniteCanvasFlow } from "@/components/InfiniteCanvasFlow";
import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { toast } from "sonner";

export default function Home() {
  const { collection, set } = useCollectionStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadCollectionFile = async (file: File | null) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".json")) {
      toast.error("Please upload a .json file.");
      return;
    }

    setIsLoading(true);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      set(data);
      toast.success("Collection loaded.");
    } catch {
      toast.error("Invalid JSON file. Please try another export.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    await loadCollectionFile(file);
    event.target.value = "";
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0] ?? null;
    await loadCollectionFile(file);
  };

  if (!collection) {
    return (
      <div className="empty-state-shell">
        <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 py-16">
          <h1 className="empty-title">discollection</h1>

          <div
            className={`empty-dropzone ${isDragging ? "empty-dropzone-active" : ""}`}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                inputRef.current?.click();
              }
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={handleFileChange}
            />

            {isLoading && (
              <p className="empty-dropzone-title">Loading collection...</p>
            )}

            <p className="empty-dropzone-subtitle">
              Drag and drop or click to choose a file.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-[family-name:var(--font-inter)] w-full">
      <InfiniteCanvasFlow data={collection} />
    </div>
  );
}
