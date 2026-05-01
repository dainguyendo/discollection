"use client";

import { useEffect, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MiniMap,
} from "reactflow";

import { buildCanvasGraph } from "@/lib/layoutAlgorithms";
import { Collection } from "@/lib/types";
import { useCollectionStore } from "@/state/collection";

import "reactflow/dist/style.css";
import { ContainerNode } from "./InfiniteCanvas/ContainerNode";
import { ReleaseNode } from "./InfiniteCanvas/ReleaseNode";

interface InfiniteCanvasFlowProps {
  data: Collection;
}

function FocusHandler() {
  const { fitView } = useReactFlow();
  const { focusNodeId, setFocusNodeId } = useCollectionStore();

  useEffect(() => {
    if (!focusNodeId) return;
    fitView({
      nodes: [{ id: focusNodeId }],
      duration: 280,
      padding: 0.3,
      maxZoom: 1.5,
    });
    setFocusNodeId(null);
  }, [focusNodeId, fitView, setFocusNodeId]);

  return null;
}

const minimapNodeColor = (node: Node) => {
  if (node.type === "container") {
    return "hsl(var(--muted-foreground) / 0.18)";
  }

  return "hsl(var(--foreground) / 0.34)";
};

const minimapNodeStrokeColor = (node: Node) => {
  if (node.type === "container") {
    return "hsl(var(--border) / 0.28)";
  }

  return "hsl(var(--foreground) / 0.14)";
};

export function InfiniteCanvasFlow({ data }: InfiniteCanvasFlowProps) {
  const nodeTypes = useMemo(
    () => ({
      release: ReleaseNode,
      container: ContainerNode,
    }),
    [],
  );
  const { filtered } = useCollectionStore();
  const filteredSet = useMemo(() => (filtered?.length ? new Set(filtered) : null), [filtered]);

  // Build graph from collection data
  const { nodes: baseNodes, edges: baseEdges } = useMemo(() => buildCanvasGraph(data), [data]);

  // Apply filtering: dim non-matching nodes
  const nodes = useMemo(() => {
    return baseNodes.map((node) => ({
      ...node,
      style: {
        ...node.style,
        opacity:
          node.data.type === "release" && filteredSet
            ? filteredSet.has(node.data.release?.basic_information.id ?? -1)
              ? 1
              : 0.3
            : 1,
        transition: "opacity 0.16s ease-out",
      },
    })) as Node[];
  }, [baseNodes, filteredSet]);

  const edges = useMemo(() => baseEdges as Edge[], [baseEdges]);

  const translateExtent = useMemo(() => {
    const rootContainers = baseNodes.filter(
      (node) => node.type === "container" && !node.parentNode,
    );

    if (!rootContainers.length) {
      return [
        [-2000, -2000],
        [2000, 2000],
      ] as [[number, number], [number, number]];
    }

    const minX = Math.min(...rootContainers.map((node) => node.position.x));
    const minY = Math.min(...rootContainers.map((node) => node.position.y));
    const maxX = Math.max(
      ...rootContainers.map((node) => node.position.x + Number(node.style?.width ?? 0)),
    );
    const maxY = Math.max(
      ...rootContainers.map((node) => node.position.y + Number(node.style?.height ?? 0)),
    );

    const padding = 420;

    return [
      [minX - padding, minY - padding],
      [maxX + padding, maxY + padding],
    ] as [[number, number], [number, number]];
  }, [baseNodes]);

  const [flowNodes, setNodes, onNodesChange] = useNodesState(nodes);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(edges);

  // Keep React Flow state in sync with derived layout/filter state.
  useEffect(() => {
    setNodes(nodes);
    setEdges(edges);
  }, [nodes, edges, setNodes, setEdges]);

  const proOptions = { hideAttribution: true };

  return (
    <div className="w-full h-screen canvas-transparent-pane">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        translateExtent={translateExtent}
        proOptions={proOptions}
        onlyRenderVisibleElements
      >
        <MiniMap
          pannable
          className="canvas-minimap"
          maskColor="hsl(var(--background) / 0.08)"
          nodeColor={minimapNodeColor}
          nodeStrokeColor={minimapNodeStrokeColor}
          nodeBorderRadius={10}
          style={{
            width: 180,
            height: 112,
          }}
        />
        <FocusHandler />
      </ReactFlow>
    </div>
  );
}
