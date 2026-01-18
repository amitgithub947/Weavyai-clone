"use client";

import { memo, useState, useMemo, useEffect } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { useWorkflowStore } from "@/stores/workflowStore";
import { Video, Upload, X } from "lucide-react";
import type { UploadVideoNodeData } from "@/types";

function UploadVideoNode({ id, data }: NodeProps<UploadVideoNodeData>) {
  const { updateNodeData, deleteNode, edges, getConnectedNodes, getNodeValue } = useWorkflowStore();
  const [isUploading, setIsUploading] = useState(false);

  // Get connected input nodes
  const inputNodes = useMemo(
    () => getConnectedNodes(id, "input"),
    [id, edges, getConnectedNodes]
  );

  // Get value from connected input
  const connectedVideoUrl = useMemo(() => {
    if (inputNodes.length === 0) return null;
    return getNodeValue(inputNodes[0].id);
  }, [inputNodes, getNodeValue]);

  // Update node data when connection changes
  useEffect(() => {
    if (connectedVideoUrl) {
      updateNodeData(id, { videoUrl: connectedVideoUrl });
    }
  }, [connectedVideoUrl, id, updateNodeData]);

  const hasInputConnection = edges.some((e) => e.target === id && e.targetHandle === "input");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"];
    if (!validTypes.includes(file.type)) {
      alert("Invalid file type. Please upload mp4, mov, webm, or m4v.");
      return;
    }

    setIsUploading(true);
    // TODO: Implement Transloadit upload
    // For now, create a local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      updateNodeData(id, {
        videoUrl: reader.result as string,
        fileName: file.name,
      });
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-lg border-2 border-gray-700 bg-gray-900 shadow-lg min-w-[300px]">
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-3 py-2">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-semibold text-gray-200">Upload Video</span>
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
        {hasInputConnection && connectedVideoUrl ? (
          <div className="space-y-2">
            <video
              src={connectedVideoUrl}
              controls
              className="w-full rounded-md border border-gray-700"
            />
            <div className="text-xs text-gray-400">From connected node</div>
          </div>
        ) : data.videoUrl ? (
          <div className="space-y-2">
            <video
              src={data.videoUrl}
              controls
              className="w-full rounded-md border border-gray-700"
            />
            {data.fileName && (
              <p className="text-xs text-gray-400 truncate">{data.fileName}</p>
            )}
            <button
              onClick={() => updateNodeData(id, { videoUrl: undefined, fileName: undefined })}
              className="w-full rounded-md bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700"
            >
              Remove
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-700 bg-gray-800 p-6 transition-colors hover:border-purple-500">
            <Upload className="mb-2 h-8 w-8 text-gray-500" />
            <span className="text-sm text-gray-400">Click to upload</span>
            <span className="text-xs text-gray-500">MP4, MOV, WEBM, M4V</span>
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        )}
        {isUploading && (
          <div className="mt-2 text-center text-xs text-gray-500">Uploading...</div>
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

export default memo(UploadVideoNode);
