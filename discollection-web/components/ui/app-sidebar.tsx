"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useCollectionStore } from "@/state/collection";
import { ChangeEvent } from "react";
import { Input } from "./input";
import { Tabs, TabsList, TabsTrigger } from "./tabs";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Button } from "./button";
import { Moon, Sun } from "lucide-react";

export function AppSidebar() {
  const { setTheme } = useTheme();
  const { set, setFormat, collection, format } = useCollectionStore();

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

  const formats = collection ? Object.keys(collection) : false;

  return (
    <Sidebar>
      <SidebarHeader>
        <h1 className="text-lg font-bold text-center">discollection viewer</h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Upload</SidebarGroupLabel>
          <SidebarGroupContent>
            <Input type="file" accept=".json" onChange={handleUpload} />
          </SidebarGroupContent>
        </SidebarGroup>

        {formats && (
          <SidebarGroup>
            <SidebarGroupLabel>Formats</SidebarGroupLabel>
            <SidebarGroupContent>
              <Tabs
                value={String(format)}
                className="w-full"
                onValueChange={(value) => setFormat(Number(value))}
              >
                <TabsList className="w-full justify-evenly">
                  {formats.map((format) => (
                    <TabsTrigger key={format} value={format}>
                      {format} &quot;
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {collection && format && (
          <SidebarGroup>
            <SidebarGroupLabel>Overview</SidebarGroupLabel>
            <SidebarGroupContent>
              <CollectionOverviewTree data={collection[format]} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupLabel>Theme</SidebarGroupLabel>
          <SidebarGroupContent>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}

interface CollectionOverviewTreeProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  level?: number;
  parent?: string;
}

const CollectionOverviewTree = ({
  data,
  level = 1,
  parent = "",
}: CollectionOverviewTreeProps) => {
  return Object.entries(data).map(([key, node]) => {
    if (Array.isArray(node)) {
      const href = parent
        ? `${parent}-${key}`.toLocaleLowerCase()
        : key.toLocaleLowerCase();
      return (
        <div key={key + level} className={`px-${level + 1}`}>
          <a href={`#${href}`}>
            {key} ({node.length})
          </a>
        </div>
      );
    }

    return (
      <div key={key + level} className={`px-${level + 1}`}>
        {key}
        <CollectionOverviewTree data={node} level={level + 1} parent={key} />
        <div className={level === 1 ? "py-2" : ``}></div>
      </div>
    );
  });
};
