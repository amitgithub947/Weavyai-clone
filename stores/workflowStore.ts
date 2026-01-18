import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Node,
  Edge,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from "reactflow";
import type { WorkflowState, NodeData } from "@/types";

const STORAGE_KEY = "weavy-workflow-state";

interface WorkflowStore extends WorkflowState {
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: Node) => void;
  deleteNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  setSelectedNodes: (nodeIds: string[]) => void;
  clearSelection: () => void;
  getWorkflowData: () => { nodes: Node[]; edges: Edge[] };
  getConnectedNodes: (nodeId: string, handleId?: string) => Node[];
  getNodeValue: (nodeId: string, handleId?: string) => string | null;
}

function createsCycle(edges: Edge[], newConnection: Connection): boolean {
  const adjacency = new Map<string, string[]>();

  for (const edge of edges) {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    adjacency.get(edge.source)!.push(edge.target);
  }

  if (!adjacency.has(newConnection.source!)) {
    adjacency.set(newConnection.source!, []);
  }
  adjacency.get(newConnection.source!)!.push(newConnection.target!);

  const visited = new Set<string>();
  const stack = new Set<string>();

  const dfs = (nodeId: string): boolean => {
    if (stack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    stack.add(nodeId);

    const neighbors = adjacency.get(nodeId) ?? [];
    for (const neighbor of neighbors) {
      if (dfs(neighbor)) return true;
    }

    stack.delete(nodeId);
    return false;
  };

  return dfs(newConnection.source!);
}

export const useWorkflowStore = create<WorkflowStore>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      selectedNodes: [],

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),

      onNodesChange: (changes) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes),
        });
      },

      onEdgesChange: (changes) => {
        set({
          edges: applyEdgeChanges(changes, get().edges),
        });
      },

      onConnect: (connection) => {
        console.log("onConnect in store:", connection);
        
        // Validate that nodes exist
        const sourceNode = get().nodes.find((n) => n.id === connection.source);
        const targetNode = get().nodes.find((n) => n.id === connection.target);

        if (!sourceNode || !targetNode) {
          console.warn("onConnect: nodes not found", { source: connection.source, target: connection.target });
          return;
        }

        // Enforce DAG: block circular connections
        if (createsCycle(get().edges, connection)) {
          console.warn("Connection would create a cycle. Blocking to enforce DAG.");
          return;
        }

        const newEdges = addEdge(connection, get().edges);
        console.log("Adding edge, new edges count:", newEdges.length);
        set({
          edges: newEdges,
        });
      },

      addNode: (node) => {
        set({
          nodes: [...get().nodes, node],
        });
      },

      deleteNode: (nodeId) => {
        set({
          nodes: get().nodes.filter((n) => n.id !== nodeId),
          edges: get().edges.filter(
            (e) => e.source !== nodeId && e.target !== nodeId
          ),
        });
      },

      updateNodeData: (nodeId, data) => {
        set({
          nodes: get().nodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...data } }
              : node
          ),
        });
      },

      setSelectedNodes: (nodeIds) => set({ selectedNodes: nodeIds }),
      clearSelection: () => set({ selectedNodes: [] }),

      getWorkflowData: () => ({
        nodes: get().nodes,
        edges: get().edges,
      }),

      getConnectedNodes: (nodeId: string, handleId?: string) => {
        const edges = get().edges.filter(
          (e) => e.target === nodeId && (!handleId || e.targetHandle === handleId)
        );
        return edges
          .map((e) => get().nodes.find((n) => n.id === e.source))
          .filter((n): n is Node => n !== undefined);
      },

      getNodeValue: (nodeId: string, handleId?: string) => {
        const node = get().nodes.find((n) => n.id === nodeId);
        if (!node) return null;

        switch (node.type) {
          case "text": {
            const data = node.data as { text?: string };
            return data.text || "";
          }
          case "uploadImage": {
            const data = node.data as { imageUrl?: string };
            return data.imageUrl || "";
          }
          case "uploadVideo": {
            const data = node.data as { videoUrl?: string };
            return data.videoUrl || "";
          }
          case "llm": {
            const data = node.data as { output?: string };
            return handleId === "output" ? (data.output || null) : null;
          }
          case "cropImage": {
            const data = node.data as { outputUrl?: string };
            return handleId === "output" ? (data.outputUrl || null) : null;
          }
          case "extractFrame": {
            const data = node.data as { outputUrl?: string };
            return handleId === "output" ? (data.outputUrl || null) : null;
          }
          default:
            return null;
        }
      },
    }),
    {
      name: STORAGE_KEY,
      // Only persist nodes and edges, not selectedNodes
      partialize: (state) => ({
        nodes: state.nodes.map((node) => {
          // Don't persist large data like base64 images/videos
          const { data, ...nodeWithoutData } = node;
          return {
            ...nodeWithoutData,
            data: {
              ...data,
              // Clear large data fields to avoid quota exceeded
              imageUrl: data.imageUrl?.startsWith('data:') ? undefined : data.imageUrl,
              videoUrl: data.videoUrl?.startsWith('data:') ? undefined : data.videoUrl,
              outputUrl: data.outputUrl?.startsWith('data:') ? undefined : data.outputUrl,
            },
          };
        }),
        edges: state.edges,
        selectedNodes: [], // Don't persist selection
      }),
      // Add error handling for quota exceeded
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            // If quota exceeded, clear the storage and try again
            if (error instanceof DOMException && 
                (error.name === 'QuotaExceededError' || error.code === 22)) {
              console.warn('LocalStorage quota exceeded, clearing old data...');
              localStorage.removeItem(name);
              try {
                localStorage.setItem(name, JSON.stringify(value));
              } catch (e) {
                console.error('Failed to save even after clearing:', e);
              }
            } else {
              console.error('Failed to save to localStorage:', error);
            }
          }
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);
