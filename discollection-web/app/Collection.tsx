import { Release } from "@/components/Release";
import { Badge } from "@/components/ui/badge";
import { Collection as CollectionType } from "@/lib/types";
import { useCollectionStore } from "@/state/collection";

interface CollectionAtFormatProps {
  data: CollectionType[keyof CollectionType];
}

export const CollectionAtFormat = ({ data }: CollectionAtFormatProps) => {
  return <CollectionNode data={data} />;
};

interface CollectionNodeProps {
  data: CollectionType[keyof CollectionType];
  parent?: string;
}

export const CollectionNode = ({ data, parent }: CollectionNodeProps) => {
  const { filtered } = useCollectionStore();

  return Object.entries(data).map(([key, value]) => {
    if (!Array.isArray(value)) {
      return <CollectionNode key={key} data={value} parent={key} />;
    }

    const id = parent
      ? `${parent}-${key}`.toLocaleLowerCase()
      : key.toLocaleLowerCase();

    return (
      <div key={key} className="grid grid-cols-8 relative">
        <div id={id} className="uppercase">
          <div className="flex flex-col gap-1 sticky top-0">
            {parent && (
              <div>
                <Badge className="font-bold">{parent}</Badge>
              </div>
            )}
            <div className="truncate">{key}</div>
            <div className="text-xs text-muted-foreground">
              ({value.length})
            </div>
          </div>
        </div>
        <div className="col-span-7">
          <div className="grid [grid-template-columns:repeat(auto-fit,300px)] gap-1">
            {value.map((release) => {
              const id = release.basic_information.id;

              const dim = Boolean(filtered?.length && !filtered.includes(id));

              return dim ? (
                <div className="opacity-30" key={id}>
                  <Release release={release} key={id} variant="minimal" />
                </div>
              ) : (
                <Release release={release} key={id} />
              );
            })}
          </div>
        </div>
      </div>
    );
  });
};
