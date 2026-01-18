"use client";

import { memo, useMemo, useEffect } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { useWorkflowStore } from "@/stores/workflowStore";
import { Type, X } from "lucide-react";
import type { TextNodeData } from "@/types";

function TextNode({ id, data }: NodeProps<TextNodeData>) {
  const { updateNodeData, deleteNode, edges, getConnectedNodes, getNodeValue } = useWorkflowStore();
  
  // Get connected input nodes
  const inputNodes = useMemo(
    () => getConnectedNodes(id, "input"),
    [id, edges, getConnectedNodes]
  );

  // Get value from connected input
  const connectedText = useMemo(() => {
    if (inputNodes.length === 0) return null;
    return inputNodes
      .map((node) => getNodeValue(node.id))
      .filter((v) => v)
      .join("\n\n");
  }, [inputNodes, getNodeValue]);

  // Update node data when connection changes
  useEffect(() => {
    if (connectedText !== null) {
      updateNodeData(id, { text: connectedText });
    }
  }, [connectedText, id, updateNodeData]);

  const hasInputConnection = edges.some((e) => e.target === id && e.targetHandle === "input");

  return (
    <div className="rounded-lg border-2 border-gray-700 bg-gray-900 shadow-lg min-w-[200px]">
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-3 py-2">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-semibold text-gray-200">Text</span>
        </div>
        <button
          onClick={() => deleteNode(id)}
          className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-red-400 transition-colors"
          title="Delete node"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-3">
        {hasInputConnection ? (
          <div className="space-y-2">
            <div className="rounded-md border border-gray-700 bg-gray-800 p-2 text-xs text-gray-300 whitespace-pre-wrap">
              {connectedText || "No value from connected nodes"}
            </div>
            {inputNodes.map((node) => (
              <div key={node.id} className="flex items-center gap-2 rounded bg-gray-800 px-2 py-1 text-xs">
                <span className="text-gray-400">From: {node.type} node</span>
              </div>
            ))}
          </div>
        ) : (
          <textarea
            value={data.text || ""}
            onChange={(e) => updateNodeData(id, { text: e.target.value })}
            placeholder="Enter text..."
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
            rows={3}
          />
        )}
      </div>
      {/* Input handle on left */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={true}
        style={{ background: "#9333ea", width: "12px", height: "12px", border: "2px solid #0a0a0a" }}
        className="!w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
      />
      {/* Output handle on right */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={true}
        style={{ background: "#9333ea", width: "12px", height: "12px", border: "2px solid #0a0a0a" }}
        className="!w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
      />
    </div>
  );
}

export default memo(TextNode);
