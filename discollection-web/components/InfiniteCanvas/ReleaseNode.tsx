"use client";

import { Music } from "lucide-react";
import Image from "next/image";
import { memo } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Release as ReleaseType } from "@/lib/types";
import { getReleaseArtist } from "@/lib/utils";

interface ReleaseNodeProps {
  data: {
    label: string;
    release: ReleaseType;
    type: "release" | "group";
    groupPath: string[];
  };
}

function ReleaseNodeComponent({ data }: ReleaseNodeProps) {
  if (data.type !== "release" || !data.release) {
    return <div>Invalid node</div>;
  }

  const release = data.release;
  const title = release.basic_information.title;
  const artists = getReleaseArtist(release);
  const thumbnail = release.basic_information.thumb || null;
  const genres = release.basic_information.genres;
  const styles = release.basic_information.styles;
  const id = release.basic_information.id;
  const discogs = new URL(String(id), "https://www.discogs.com/release/").toString();

  const handleBadgeClick = async (value: string) => {
    const quotedValue = JSON.stringify(value);
    const command = `discollection release-override ${id} ${quotedValue}`;
    await navigator.clipboard.writeText(command);
    toast.success(`Copied`, {
      description: <code className="px-2 py-1 rounded text-xs font-mono">{command}</code>,
    });
  };

  // Generate a gradient based on the first letter of the artist name
  const getGradientColors = () => {
    const firstChar = artists.charAt(0).toLowerCase();
    const charCode = firstChar.charCodeAt(0);
    const hue1 = (charCode * 15) % 360;
    const hue2 = (hue1 + 40) % 360;
    return {
      color1: `hsl(${hue1}, 70%, 20%)`,
      color2: `hsl(${hue2}, 60%, 40%)`,
    };
  };

  const { color1, color2 } = getGradientColors();

  return (
    <>
      <Card className="w-80 h-80 flex flex-col relative overflow-hidden group shadow-lg hover:shadow-xl transition-shadow bg-black/20 backdrop-blur-md border-white/10">
        <div className="absolute inset-0 z-0">
          {thumbnail ? (
            <Image src={thumbnail} alt={title} fill sizes="320px" className="object-cover" />
          ) : (
            <div
              className="absolute inset-0 z-0 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${color1}, ${color2})`,
              }}
            >
              <div className="absolute inset-0 opacity-10">
                {[...Array(6)].map((_, i) => (
                  <Music
                    key={i}
                    className="absolute text-white opacity-30"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      width: `${Math.random() * 40 + 20}px`,
                      height: `${Math.random() * 40 + 20}px`,
                      transform: `rotate(${Math.random() * 360}deg)`,
                    }}
                  />
                ))}
              </div>
              <div className="flex flex-col items-center justify-center text-white">
                <div className="text-center px-4">
                  <a
                    href={discogs}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block hover:underline nodrag nopan"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <span className="block font-bold text-sm">{title}</span>
                    <span className="block text-xs opacity-80">{artists}</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors z-10" />

        <div className="relative z-20 flex flex-col justify-end h-full p-4">
          <div className="space-y-2">
            <div className="text-white">
              <a
                href={discogs}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:underline nodrag nopan"
                onClick={(event) => event.stopPropagation()}
              >
                <span className="block font-bold text-sm line-clamp-2">{title}</span>
                <span className="block text-xs opacity-90">{artists}</span>
              </a>
            </div>
            {genres.length > 0 && (
              <div className="flex flex-wrap justify-end gap-1">
                {genres.map((genre) => (
                  <Badge
                    key={genre}
                    variant="outline"
                    className="text-xs cursor-pointer hover:bg-white/20"
                    onClick={() => handleBadgeClick(genre)}
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            )}
            {styles.length > 0 && (
              <div className="flex flex-wrap justify-end gap-1">
                {styles.map((style) => (
                  <Badge
                    key={style}
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-white/20"
                    onClick={() => handleBadgeClick(style)}
                  >
                    {style}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </>
  );
}

export const ReleaseNode = memo(ReleaseNodeComponent);
