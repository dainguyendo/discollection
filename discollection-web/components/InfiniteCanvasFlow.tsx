"use client";

import { Collection } from "@/lib/types";
import { buildCanvasGraph } from "@/lib/layoutAlgorithms";
import { useCollectionStore } from "@/state/collection";
import { useCallback, useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Panel,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { ReleaseNode } from "./InfiniteCanvas/ReleaseNode";
import { ContainerNode } from "./InfiniteCanvas/ContainerNode";

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
      duration: 600,
      padding: 0.3,
      maxZoom: 1.5,
    });
    setFocusNodeId(null);
  }, [focusNodeId, fitView, setFocusNodeId]);

  return null;
}

export function InfiniteCanvasFlow({ data }: InfiniteCanvasFlowProps) {
  const nodeTypes = useMemo(
    () => ({
      release: ReleaseNode,
      container: ContainerNode,
    }),
    [],
  );
  const { filtered } = useCollectionStore();

  // Build graph from collection data
  const { nodes: baseNodes, edges: baseEdges } = useMemo(
    () => buildCanvasGraph(data),
    [data],
  );

  // Apply filtering: dim non-matching nodes
  const nodes = useMemo(() => {
    return baseNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
      },
      style: {
        ...node.style,
        opacity:
          node.data.type === "release" && filtered?.length
            ? filtered.includes(node.data.release?.basic_information.id ?? -1)
              ? 1
              : 0.3
            : 1,
        transition: "opacity 0.2s ease-in-out",
      },
    })) as Node[];
  }, [baseNodes, filtered]);

  const edges = useMemo(() => baseEdges as Edge[], [baseEdges]);

  const [flowNodes, setNodes, onNodesChange] = useNodesState(nodes);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(edges);

  // Keep React Flow state in sync with derived layout/filter state.
  useEffect(() => {
    setNodes(nodes);
    setEdges(edges);
  }, [nodes, edges, setNodes, setEdges]);

  const onLayout = useCallback(() => {
    // Optional: Re-layout with a different algorithm
    // For now, the initial Dagre layout is sufficient
  }, []);

  return (
    <div className="w-full h-screen">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap />
        <FocusHandler />
        <Panel position="top-left" className="flex gap-2">
          <button
            onClick={onLayout}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Re-layout
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
