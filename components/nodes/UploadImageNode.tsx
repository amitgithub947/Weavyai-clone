"use client";

import { memo, useState, useMemo, useEffect } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { useWorkflowStore } from "@/stores/workflowStore";
import { Image as ImageIcon, Upload, X } from "lucide-react";
import type { UploadImageNodeData } from "@/types";

function UploadImageNode({ id, data }: NodeProps<UploadImageNodeData>) {
  const { updateNodeData, deleteNode, edges, getConnectedNodes, getNodeValue } = useWorkflowStore();
  const [isUploading, setIsUploading] = useState(false);

  // Get connected input nodes
  const inputNodes = useMemo(
    () => getConnectedNodes(id, "input"),
    [id, edges, getConnectedNodes]
  );

  // Get value from connected input
  const connectedImageUrl = useMemo(() => {
    if (inputNodes.length === 0) return null;
    return getNodeValue(inputNodes[0].id);
  }, [inputNodes, getNodeValue]);

  // Update node data when connection changes
  useEffect(() => {
    if (connectedImageUrl) {
      updateNodeData(id, { imageUrl: connectedImageUrl });
    }
  }, [connectedImageUrl, id, updateNodeData]);

  const hasInputConnection = edges.some((e) => e.target === id && e.targetHandle === "input");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      alert("Invalid file type. Please upload jpg, jpeg, png, webp, or gif.");
      return;
    }

    setIsUploading(true);
    // TODO: Implement Transloadit upload
    // For now, create a local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      updateNodeData(id, {
        imageUrl: reader.result as string,
        fileName: file.name,
      });
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-lg border-2 border-gray-700 bg-gray-900 shadow-lg min-w-[250px]">
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-3 py-2">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-semibold text-gray-200">Upload Image</span>
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
        {hasInputConnection && connectedImageUrl ? (
          <div className="space-y-2">
            <img
              src={connectedImageUrl}
              alt="Connected"
              className="w-full rounded-md border border-gray-700"
            />
            <div className="text-xs text-gray-400">From connected node</div>
          </div>
        ) : data.imageUrl ? (
          <div className="space-y-2">
            <img
              src={data.imageUrl}
              alt="Uploaded"
              className="w-full rounded-md border border-gray-700"
            />
            {data.fileName && (
              <p className="text-xs text-gray-400 truncate">{data.fileName}</p>
            )}
            <button
              onClick={() => updateNodeData(id, { imageUrl: undefined, fileName: undefined })}
              className="w-full rounded-md bg-gray-800 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700"
            >
              Remove
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-700 bg-gray-800 p-6 transition-colors hover:border-purple-500">
            <Upload className="mb-2 h-8 w-8 text-gray-500" />
            <span className="text-sm text-gray-400">Click to upload</span>
            <span className="text-xs text-gray-500">JPG, PNG, WEBP, GIF</span>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
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

export default memo(UploadImageNode);
