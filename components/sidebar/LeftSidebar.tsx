"use client";

import { useState } from "react";
import { useWorkflowStore } from "@/stores/workflowStore";
import { generateNodeId } from "@/lib/utils";
import { Node, Position } from "reactflow";
import {
  Type,
  Image as ImageIcon,
  Video,
  Brain,
  Crop,
  Film,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import type { NodeType } from "@/types";

const NODE_TYPES: Array<{
  type: NodeType;
  label: string;
  icon: React.ReactNode;
}> = [
  { type: "text", label: "Text", icon: <Type className="w-5 h-5" /> },
  {
    type: "uploadImage",
    label: "Upload Image",
    icon: <ImageIcon className="w-5 h-5" />,
  },
  {
    type: "uploadVideo",
    label: "Upload Video",
    icon: <Video className="w-5 h-5" />,
  },
  { type: "llm", label: "Run Any LLM", icon: <Brain className="w-5 h-5" /> },
  {
    type: "cropImage",
    label: "Crop Image",
    icon: <Crop className="w-5 h-5" />,
  },
  {
    type: "extractFrame",
    label: "Extract Frame",
    icon: <Film className="w-5 h-5" />,
  },
];

export default function LeftSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { addNode } = useWorkflowStore();

  const handleAddNode = (type: NodeType) => {
    const id = generateNodeId(type);
    // Generate random position using a helper function to avoid impure function warning
    const getRandomPosition = () => ({
      x: Math.random() * 400 + 100,
      y: Math.random() * 400 + 100,
    });
    const position = getRandomPosition();

    let nodeData: Record<string, unknown> = {};
    let handles: Array<{
      id: string;
      type: "source" | "target";
      position: Position;
      style: { background: string };
    }> = [];

    switch (type) {
      case "text":
        nodeData = { text: "" };
        handles = [
          {
            id: "output",
            type: "source",
            position: Position.Right,
            style: { background: "#555" },
          },
        ];
        break;
      case "uploadImage":
        nodeData = {};
        handles = [
          {
            id: "output",
            type: "source",
            position: Position.Right,
            style: { background: "#555" },
          },
        ];
        break;
      case "uploadVideo":
        nodeData = {};
        handles = [
          {
            id: "output",
            type: "source",
            position: Position.Right,
            style: { background: "#555" },
          },
        ];
        break;
      case "llm":
        nodeData = {
          model: "gemini-3-flash-preview",
          systemPrompt: "",
          userMessage: "",
          images: [],
        };
        handles = [
          {
            id: "system_prompt",
            type: "target",
            position: Position.Left,
            style: { background: "#555" },
          },
          {
            id: "user_message",
            type: "target",
            position: Position.Left,
            style: { background: "#555" },
          },
          {
            id: "images",
            type: "target",
            position: Position.Left,
            style: { background: "#555" },
          },
          {
            id: "output",
            type: "source",
            position: Position.Right,
            style: { background: "#555" },
          },
        ];
        break;
      case "cropImage":
        nodeData = {
          xPercent: 0,
          yPercent: 0,
          widthPercent: 100,
          heightPercent: 100,
        };
        handles = [
          {
            id: "image_url",
            type: "target",
            position: Position.Left,
            style: { background: "#555" },
          },
          {
            id: "x_percent",
            type: "target",
            position: Position.Left,
            style: { background: "#555" },
          },
          {
            id: "y_percent",
            type: "target",
            position: Position.Left,
            style: { background: "#555" },
          },
          {
            id: "width_percent",
            type: "target",
            position: Position.Left,
            style: { background: "#555" },
          },
          {
            id: "height_percent",
            type: "target",
            position: Position.Left,
            style: { background: "#555" },
          },
          {
            id: "output",
            type: "source",
            position: Position.Right,
            style: { background: "#555" },
          },
        ];
        break;
      case "extractFrame":
        nodeData = { timestamp: "0" };
        handles = [
          {
            id: "video_url",
            type: "target",
            position: Position.Left,
            style: { background: "#555" },
          },
          {
            id: "timestamp",
            type: "target",
            position: Position.Left,
            style: { background: "#555" },
          },
          {
            id: "output",
            type: "source",
            position: Position.Right,
            style: { background: "#555" },
          },
        ];
        break;
    }

    const newNode: Node = {
      id,
      type: type,
      position,
      data: nodeData,
      ...(handles.length > 0 && {
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      }),
    };

    addNode(newNode);
  };

  const filteredNodes = NODE_TYPES.filter((node) =>
    node.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`relative flex h-full flex-col border-r border-gray-800 bg-[#111111] transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-gray-700 bg-[#111111] text-gray-400 hover:bg-gray-800 hover:text-white"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {!isCollapsed && (
        <>
          <div className="border-b border-gray-800 p-4">
            <h2 className="mb-2 text-sm font-semibold text-gray-300">
              Quick Access
            </h2>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-gray-700 bg-gray-900 py-1.5 pl-8 pr-3 text-sm text-gray-300 placeholder-gray-500 focus:border-gray-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {filteredNodes.map((nodeType) => (
                <button
                  key={nodeType.type}
                  onClick={() => handleAddNode(nodeType.type)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                >
                  <div className="flex-shrink-0">{nodeType.icon}</div>
                  <span className="flex-1">{nodeType.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {isCollapsed && (
        <div className="flex flex-col items-center gap-2 p-2">
          {NODE_TYPES.map((nodeType) => (
            <button
              key={nodeType.type}
              onClick={() => handleAddNode(nodeType.type)}
              className="flex h-10 w-10 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
              title={nodeType.label}
            >
              {nodeType.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
