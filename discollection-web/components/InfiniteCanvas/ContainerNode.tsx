"use client";

import { memo } from "react";

interface ContainerNodeProps {
  data: {
    label: string;
    level: "format" | "section";
  };
}

const LEVEL_STYLES: Record<string, string> = {
  format: "bg-white/[0.03] border-white/[0.08]",
  section: "bg-white/[0.07] border-white/[0.14]",
};

const LABEL_STYLES: Record<string, string> = {
  format: "text-white/40",
  section: "text-white/60",
};

function ContainerNodeComponent({ data }: ContainerNodeProps) {
  const levelStyle = LEVEL_STYLES[data.level] ?? LEVEL_STYLES.section;
  const labelStyle = LABEL_STYLES[data.level] ?? LABEL_STYLES.section;

  return (
    <div
      className={`w-full h-full rounded-xl border backdrop-blur-[2px] ${levelStyle}`}
    >
      <div className="px-3 pt-2 pb-1">
        <div
          className={`text-xs uppercase tracking-widest font-medium ${labelStyle}`}
        >
          {data.label}
        </div>
      </div>
    </div>
  );
}

export const ContainerNode = memo(ContainerNodeComponent);
