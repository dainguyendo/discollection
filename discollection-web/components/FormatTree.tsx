import React from "react";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  level?: number;
  parent?: string;
}

export const FormatTree = ({ data, level = 1, parent = "" }: Props) => {
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
        <FormatTree data={node} level={level + 1} parent={key} />
        <div className={level === 1 ? "py-2" : ``}></div>
      </div>
    );
  });
};
