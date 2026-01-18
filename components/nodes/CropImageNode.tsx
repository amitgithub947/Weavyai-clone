"use client";

import { memo, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { useWorkflowStore } from "@/stores/workflowStore";
import { Crop, Play, Loader2, X } from "lucide-react";
import type { CropImageNodeData } from "@/types";

function CropImageNode({ id, data }: NodeProps<CropImageNodeData>) {
  const { updateNodeData, deleteNode } = useWorkflowStore();
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = async () => {
    if (!data.imageUrl) {
      alert("Please connect an image input");
      return;
    }

    setIsRunning(true);
    updateNodeData(id, { isRunning: true });

    try {
      // TODO: Call Trigger.dev task for FFmpeg crop
      const response = await fetch("/api/nodes/crop-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeId: id,
          imageUrl: data.imageUrl,
          xPercent: data.xPercent || 0,
          yPercent: data.yPercent || 0,
          widthPercent: data.widthPercent || 100,
          heightPercent: data.heightPercent || 100,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      updateNodeData(id, {
        outputUrl: result.outputUrl || data.imageUrl, // Fallback to original if no output
        isRunning: false,
      });
    } catch (error) {
      console.error("❌ Crop error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to crop image";
      updateNodeData(id, { 
        isRunning: false,
        error: errorMessage,
      });
      alert(`Error cropping image: ${errorMessage}`);
    } finally {
      setIsRunning(false);
    }
  };

  const hasConnection = (_handleId: string) => {
    // TODO: Check if handle has connections
    return false;
  };

  return (
    <div className={`rounded-lg border-2 bg-gray-900 shadow-lg min-w-[300px] ${
      data.isRunning ? "border-purple-500 shadow-purple-500/50 animate-pulse" : "border-gray-700"
    }`}>
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-3 py-2">
        <div className="flex items-center gap-2">
          <Crop className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-semibold text-gray-200">Crop Image</span>
        </div>
        <button
          onClick={() => deleteNode(id)}
          className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-red-400 transition-colors"
          title="Delete node"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-3 space-y-3">
        {data.imageUrl && (
          <div className="rounded-md border border-gray-700 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.imageUrl} alt="Input" className="w-full" />
          </div>
        )}

        <Handle
          type="target"
          position={Position.Left}
          id="image_url"
          style={{ background: "#9333ea", width: "12px", height: "12px", border: "2px solid #0a0a0a" }}
          className="!w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
        />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">
              X% {hasConnection("x_percent") && "(Connected)"}
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={data.xPercent ?? 0}
              onChange={(e) => updateNodeData(id, { xPercent: Number(e.target.value) })}
              disabled={hasConnection("x_percent")}
              className={`w-full rounded-md border px-2 py-1.5 text-sm focus:outline-none ${
                hasConnection("x_percent")
                  ? "border-gray-800 bg-gray-900 text-gray-600 cursor-not-allowed"
                  : "border-gray-700 bg-gray-800 text-gray-200 focus:border-purple-500"
              }`}
            />
            <Handle
              type="target"
              position={Position.Left}
              id="x_percent"
              style={{ background: "#9333ea", width: "12px", height: "12px", border: "2px solid #0a0a0a" }}
              className="!w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">
              Y% {hasConnection("y_percent") && "(Connected)"}
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={data.yPercent ?? 0}
              onChange={(e) => updateNodeData(id, { yPercent: Number(e.target.value) })}
              disabled={hasConnection("y_percent")}
              className={`w-full rounded-md border px-2 py-1.5 text-sm focus:outline-none ${
                hasConnection("y_percent")
                  ? "border-gray-800 bg-gray-900 text-gray-600 cursor-not-allowed"
                  : "border-gray-700 bg-gray-800 text-gray-200 focus:border-purple-500"
              }`}
            />
            <Handle
              type="target"
              position={Position.Left}
              id="y_percent"
              style={{ background: "#9333ea", width: "12px", height: "12px", border: "2px solid #0a0a0a" }}
              className="!w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">
              Width% {hasConnection("width_percent") && "(Connected)"}
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={data.widthPercent ?? 100}
              onChange={(e) => updateNodeData(id, { widthPercent: Number(e.target.value) })}
              disabled={hasConnection("width_percent")}
              className={`w-full rounded-md border px-2 py-1.5 text-sm focus:outline-none ${
                hasConnection("width_percent")
                  ? "border-gray-800 bg-gray-900 text-gray-600 cursor-not-allowed"
                  : "border-gray-700 bg-gray-800 text-gray-200 focus:border-purple-500"
              }`}
            />
            <Handle
              type="target"
              position={Position.Left}
              id="width_percent"
              style={{ background: "#9333ea", width: "12px", height: "12px", border: "2px solid #0a0a0a" }}
              className="!w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">
              Height% {hasConnection("height_percent") && "(Connected)"}
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={data.heightPercent ?? 100}
              onChange={(e) => updateNodeData(id, { heightPercent: Number(e.target.value) })}
              disabled={hasConnection("height_percent")}
              className={`w-full rounded-md border px-2 py-1.5 text-sm focus:outline-none ${
                hasConnection("height_percent")
                  ? "border-gray-800 bg-gray-900 text-gray-600 cursor-not-allowed"
                  : "border-gray-700 bg-gray-800 text-gray-200 focus:border-purple-500"
              }`}
            />
            <Handle
              type="target"
              position={Position.Left}
              id="height_percent"
              style={{ background: "#9333ea", width: "12px", height: "12px", border: "2px solid #0a0a0a" }}
              className="!w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
            />
          </div>
        </div>

        <button
          onClick={handleRun}
          disabled={isRunning || !data.imageUrl}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Crop
            </>
          )}
        </button>

        {data.outputUrl && (
          <div className="rounded-md border border-gray-700 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.outputUrl} alt="Cropped" className="w-full" />
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: "#9333ea", width: "12px", height: "12px", border: "2px solid #0a0a0a" }}
        className="!w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
      />
    </div>
  );
}

export default memo(CropImageNode);
