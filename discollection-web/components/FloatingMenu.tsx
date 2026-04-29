"use client";

import { File, ListTree, Moon, Sun } from "lucide-react";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "./ui/menubar";
import { useTheme } from "next-themes";
import { Input } from "./ui/input";
import { useCollectionStore } from "@/state/collection";
import { ChangeEvent, useRef } from "react";
import { FormatTree } from "./FormatTree";
import { CollectionSearch } from "./CollectionSearch";

export const FloatingMenu = () => {
  const { setTheme } = useTheme();
  const { set, setFormat, collection, format } = useCollectionStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event?.target?.files?.[0] as File;
    const reader = new FileReader();

    reader.onload = async (e) => {
      const data = JSON.parse(e.target?.result as string);
      set(data);

      event.target.value = "";
    };

    reader.readAsText(file);
  };

  const triggerFileInput = () => {
    inputRef.current?.click();
  };

  const formats = collection ? Object.keys(collection) : false;

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

        {collection && format && (
          <MenubarMenu>
            <MenubarTrigger className="rounded-full p-2 data-[state=open]:bg-accent">
              {format}&quot;
            </MenubarTrigger>
            <MenubarContent>
              {formats &&
                formats.map((f) => (
                  <MenubarItem
                    key={f}
                    onClick={() => {
                      setFormat(Number(f));
                    }}
                  >
                    {f}&quot;
                  </MenubarItem>
                ))}
            </MenubarContent>
          </MenubarMenu>
        )}

        {collection && format && (
          <MenubarMenu>
            <MenubarTrigger className="rounded-full p-2 data-[state=open]:bg-accent">
              <ListTree />
            </MenubarTrigger>
            <MenubarContent>
              <FormatTree data={collection[format]} />
            </MenubarContent>
          </MenubarMenu>
        )}

        <MenubarMenu>
          <MenubarTrigger className="rounded-full p-2 data-[state=open]:bg-accent">
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={() => setTheme("light")}>Light</MenubarItem>
            <MenubarItem onClick={() => setTheme("dark")}>Dark</MenubarItem>
            <MenubarItem onClick={() => setTheme("system")}>System</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        {collection && format && (
          <MenubarMenu>
            <CollectionSearch />
          </MenubarMenu>
        )}
      </Menubar>
    </div>
  );
};
