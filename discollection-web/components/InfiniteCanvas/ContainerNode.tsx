"use client";

interface ContainerNodeProps {
  data: {
    label: string;
    level: "format" | "section";
  };
}

export function ContainerNode({ data }: ContainerNodeProps) {
  return (
    <div className="w-full h-full rounded-xl border border-border/70 bg-card/45 backdrop-blur-[1px] shadow-sm">
      <div className="px-3 pt-2 pb-1">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {data.level}
        </div>
        <div className="text-sm font-semibold leading-tight truncate">
          {data.label}
        </div>
      </div>
    </div>
  );
}
