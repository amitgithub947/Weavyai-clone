"use client";

import { useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  Connection,
} from "reactflow";
import "reactflow/dist/style.css";
import { useWorkflowStore } from "@/stores/workflowStore";
import TextNode from "./nodes/TextNode";
import UploadImageNode from "./nodes/UploadImageNode";
import UploadVideoNode from "./nodes/UploadVideoNode";
import LLMNode from "./nodes/LLMNode";
import CropImageNode from "./nodes/CropImageNode";
import ExtractFrameNode from "./nodes/ExtractFrameNode";
import type { Node as RFNode } from "reactflow";

const nodeTypes: NodeTypes = {
  text: TextNode,
  uploadImage: UploadImageNode,
  uploadVideo: UploadVideoNode,
  llm: LLMNode,
  cropImage: CropImageNode,
  extractFrame: ExtractFrameNode,
};

type DataType = "text" | "image" | "video";

function getHandleType(node: RFNode, handleId: string | null, isSource: boolean): DataType | null {
  if (!handleId) return null;

  switch (node.type) {
    case "text":
      // Text node has both input and output, both are text
      if (handleId === "input") return "text";
      if (handleId === "output") return "text";
      return null;
    case "uploadImage":
      // Image node has both input and output, both are image
      if (handleId === "input") return "image";
      if (handleId === "output") return "image";
      return null;
    case "uploadVideo":
      // Video node has both input and output, both are video
      if (handleId === "input") return "video";
      if (handleId === "output") return "video";
      return null;
    case "llm":
      if (!isSource) {
        if (handleId === "system_prompt" || handleId === "user_message") return "text";
        if (handleId === "images") return "image";
      } else if (handleId === "output") {
        return "text";
      }
      return null;
    case "cropImage":
      if (!isSource) {
        if (handleId === "image_url") return "image";
        if (
          handleId === "x_percent" ||
          handleId === "y_percent" ||
          handleId === "width_percent" ||
          handleId === "height_percent"
        ) {
          return "text";
        }
      } else if (handleId === "output") {
        return "image";
      }
      return null;
    case "extractFrame":
      if (!isSource) {
        if (handleId === "video_url") return "video";
        if (handleId === "timestamp") return "text";
      } else if (handleId === "output") {
        return "image";
      }
      return null;
    default:
      return null;
  }
}

export default function WorkflowCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
  } = useWorkflowStore();

  const isValidConnection = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) {
        console.log("Invalid: missing source or target");
        return false;
      }
      
      // Prevent self-connections
      if (connection.source === connection.target) {
        console.log("Invalid: self-connection");
        return false;
      }
      
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      if (!sourceNode || !targetNode) {
        console.log("Invalid: nodes not found", { source: connection.source, target: connection.target });
        return false;
      }

      // Always allow connection if handles are not specified
      if (!connection.sourceHandle || !connection.targetHandle) {
        console.log("Valid: handles not specified, allowing connection");
        return true;
      }

      // Try to get types
      const sourceType = getHandleType(
        sourceNode as RFNode,
        connection.sourceHandle ?? null,
        true
      );
      const targetType = getHandleType(
        targetNode as RFNode,
        connection.targetHandle ?? null,
        false
      );

      console.log("Connection validation:", {
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        sourceType,
        targetType,
        sourceNodeType: sourceNode.type,
        targetNodeType: targetNode.type,
      });

      // If types can't be determined, allow the connection (be lenient)
      if (!sourceType || !targetType) {
        console.log("Valid: types cannot be determined, allowing connection");
        return true;
      }

      // For now, allow all connections except self-connections (we'll enforce types later)
      // This makes it easier to test and connect nodes
      const isValid = true; // Temporarily allow all type combinations
      
      if (sourceType !== targetType) {
        console.log(`Warning: type mismatch ${sourceType} -> ${targetType}, but allowing connection`);
      } else {
        console.log(`Valid: type match ${sourceType} -> ${targetType}`);
      }
      return isValid;
    },
    [nodes]
  );

  const defaultEdgeOptions = useMemo(
    () => ({
      animated: true,
      style: { stroke: "#9333ea", strokeWidth: 2 },
    }),
    []
  );

  return (
    <div className="h-full w-full bg-[#0a0a0a]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={(connection) => {
          console.log("onConnect called:", connection);
          onConnect(connection);
        }}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        isValidConnection={isValidConnection}
        connectionRadius={20}
        snapToGrid={false}
        snapGrid={[15, 15]}
        fitView
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
        deleteKeyCode={["Delete", "Backspace"]}
      >
        <Background
          gap={20}
          size={1}
          color="#333"
        />
        <Controls className="bg-gray-900 border-gray-800" />
        <MiniMap
          className="bg-gray-900 border border-gray-800"
          nodeColor="#9333ea"
          maskColor="rgba(0, 0, 0, 0.5)"
        />
      </ReactFlow>
    </div>
  );
}
