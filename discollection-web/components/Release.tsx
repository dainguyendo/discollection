import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HoverCard } from "@/components/ui/hover-card";
import { Release as ReleaseType } from "@/lib/types";
import { getReleaseArtist } from "@/lib/utils";
import { Copy, Music } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Props {
  release: ReleaseType;
  variant?: "default" | "minimal";
}
export const Release = ({ release, variant = "default" }: Props) => {
  const title = release.basic_information.title;
  const artists = getReleaseArtist(release);
  const thumbnail = release.basic_information.thumb || null;
  const genres = release.basic_information.genres;
  const styles = release.basic_information.styles;
  const id = release.basic_information.id;

  const discogs = new URL(String(id), "https://www.discogs.com/release/");

  // Generate a gradient based on the first letter of the artist name for the fallback
  const getGradientColors = () => {
    const firstChar = artists.charAt(0).toLowerCase();
    const charCode = firstChar.charCodeAt(0);

    // Create a deterministic but varied color palette based on the first character
    const hue1 = (charCode * 15) % 360;
    const hue2 = (hue1 + 40) % 360;

    return {
      color1: `hsl(${hue1}, 70%, 20%)`,
      color2: `hsl(${hue2}, 60%, 40%)`,
    };
  };

  const { color1, color2 } = getGradientColors();

  const showBadges = variant === "default";
  const showActions = variant === "default";

  return (
    <HoverCard key={id}>
      <Card
        id={`release-${id}`}
        className="h-full flex flex-col relative overflow-hidden group"
      >
        <div className="absolute inset-0 z-0">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              priority
              className="object-cover"
            />
          ) : (
            <div
              className="absolute inset-0 z-0 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${color1}, ${color2})`,
              }}
            >
              <div className="absolute inset-0 opacity-10">
                <div className="absolute w-full h-full">
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
              </div>
              <div className="flex flex-col items-center justify-center text-white">
                <Music className="w-16 h-16 mb-4 opacity-80" />
                <div className="text-xl font-medium text-center opacity-80">
                  {title}
                </div>
                <div className="text-lg opacity-60">{artists}</div>
              </div>
            </div>
          )}
        </div>
        {/* Gradient Overlay for Readability - always present */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/30 z-10" />

        <div className="relative z-20 flex flex-col justify-end h-full">
          <CardContent className="pt-4 pb-0">
            {showBadges && (
              <div className="flex flex-wrap flex-row gap-1 justify-end">
                {genres.map((genre) => (
                  <Badge
                    key={genre}
                    className="text-[8px] text-center cursor-pointer bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-none py-0.5"
                    onClick={() => navigator.clipboard.writeText(genre)}
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            )}
            {showBadges && (
              <div className="flex flex-wrap gap-1 justify-end pt-1">
                {styles.map((style) => (
                  <Badge
                    key={style}
                    className="text-[8px] text-center cursor-pointer bg-black/20 hover:bg-black/30 backdrop-blur-sm text-white border-none py-0.5"
                    onClick={() => navigator.clipboard.writeText(style)}
                  >
                    {style}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
          <CardHeader>
            <Link href={discogs.toString()}>
              <CardTitle className="text-white text-md text-nowrap truncate">
                {title}
              </CardTitle>
              <CardDescription className="text-sm text-white/90 text-nowrap truncate">
                {artists}
              </CardDescription>
            </Link>
          </CardHeader>

          <CardFooter className="justify-end">
            {showActions && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigator.clipboard.writeText(String(id))}
                className="text-[10px] text-neutral-400	"
              >
                <Copy />
              </Button>
            )}
          </CardFooter>
        </div>
      </Card>
    </HoverCard>
  );
};
