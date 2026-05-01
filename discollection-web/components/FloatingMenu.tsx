"use client";

import { File, ListTree } from "lucide-react";
import { useTheme } from "next-themes";
import { ChangeEvent, useRef } from "react";

import { useCollectionStore } from "@/state/collection";

import { CollectionSearch } from "./CollectionSearch";
import { FormatTree } from "./FormatTree";
import { Input } from "./ui/input";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from "./ui/menubar";

export const FloatingMenu = () => {
  const { setTheme } = useTheme();
  const { set, collection } = useCollectionStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event?.target?.files?.[0] as File;
    const reader = new FileReader();

    reader.addEventListener("load", async (e) => {
      const data = JSON.parse((e.target as FileReader)?.result as string);
      set(data);

      event.target.value = "";
    });

    reader.readAsText(file);
  };

  const triggerFileInput = () => {
    inputRef.current?.click();
  };

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform rounded-full bg-background/80 px-2 py-1 shadow-lg backdrop-blur-md">
      <Menubar className="border-none bg-transparent">
        <MenubarMenu>
          <MenubarTrigger
            type="button"
            className="rounded-full p-2 data-[state=open]:bg-accent"
            onClick={triggerFileInput}
          >
            <Input
              type="file"
              accept=".json"
              onChange={handleUpload}
              className="sr-only"
              ref={inputRef}
            />
            <File />
          </MenubarTrigger>
        </MenubarMenu>

        {collection && (
          <MenubarMenu>
            <MenubarTrigger className="rounded-full p-2 data-[state=open]:bg-accent">
              <ListTree />
            </MenubarTrigger>
            <MenubarContent>
              <FormatTree data={collection} />
            </MenubarContent>
          </MenubarMenu>
        )}

        <MenubarMenu>
          <MenubarContent>
            <MenubarItem onClick={() => setTheme("light")}>Light</MenubarItem>
            <MenubarItem onClick={() => setTheme("dark")}>Dark</MenubarItem>
            <MenubarItem onClick={() => setTheme("system")}>System</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        {collection && (
          <MenubarMenu>
            <CollectionSearch />
          </MenubarMenu>
        )}
      </Menubar>
    </div>
  );
};
