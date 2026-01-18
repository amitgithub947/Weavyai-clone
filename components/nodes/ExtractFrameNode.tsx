"use client";

import { memo, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { useWorkflowStore } from "@/stores/workflowStore";
import { Film, Play, Loader2, X } from "lucide-react";
import type { ExtractFrameNodeData } from "@/types";

function ExtractFrameNode({ id, data }: NodeProps<ExtractFrameNodeData>) {
  const { updateNodeData, deleteNode } = useWorkflowStore();
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = async () => {
    if (!data.videoUrl) {
      alert("Please connect a video input");
      return;
    }

    setIsRunning(true);
    updateNodeData(id, { isRunning: true });

    try {
      // TODO: Call Trigger.dev task for FFmpeg frame extraction
      const response = await fetch("/api/nodes/extract-frame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeId: id,
          videoUrl: data.videoUrl,
          timestamp: data.timestamp || "0",
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
        outputUrl: result.outputUrl || "", // Empty string if no output
        isRunning: false,
      });
    } catch (error) {
      console.error("❌ Extract frame error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to extract frame";
      updateNodeData(id, { 
        isRunning: false,
        error: errorMessage,
      });
      alert(`Error extracting frame: ${errorMessage}`);
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
          <Film className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-semibold text-gray-200">Extract Frame</span>
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
        {data.videoUrl && (
          <div className="rounded-md border border-gray-700 overflow-hidden">
            <video src={data.videoUrl} controls className="w-full" />
          </div>
        )}

        <Handle
          type="target"
          position={Position.Left}
          id="video_url"
          style={{ background: "#9333ea", width: "12px", height: "12px", border: "2px solid #0a0a0a" }}
          className="!w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
        />

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">
            Timestamp {hasConnection("timestamp") && "(Connected)"}
          </label>
          <input
            type="text"
            value={data.timestamp || "0"}
            onChange={(e) => updateNodeData(id, { timestamp: e.target.value })}
            placeholder="0 or 50%"
            disabled={hasConnection("timestamp")}
            className={`w-full rounded-md border px-2 py-1.5 text-sm placeholder-gray-500 focus:outline-none ${
              hasConnection("timestamp")
                ? "border-gray-800 bg-gray-900 text-gray-600 cursor-not-allowed"
                : "border-gray-700 bg-gray-800 text-gray-200 focus:border-purple-500"
            }`}
          />
          <p className="mt-1 text-xs text-gray-500">
            Enter seconds (e.g., &quot;30&quot;) or percentage (e.g., &quot;50%&quot;)
          </p>
          <Handle
            type="target"
            position={Position.Left}
            id="timestamp"
            style={{ background: "#9333ea", width: "12px", height: "12px", border: "2px solid #0a0a0a" }}
            className="!w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
          />
        </div>

        <button
          onClick={handleRun}
          disabled={isRunning || !data.videoUrl}
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
              Extract Frame
            </>
          )}
        </button>

        {data.outputUrl && (
          <div className="rounded-md border border-gray-700 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.outputUrl} alt="Extracted frame" className="w-full" />
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

export default memo(ExtractFrameNode);
