"use client";

import { memo, useState, useMemo, useEffect } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { useWorkflowStore } from "@/stores/workflowStore";
import { Brain, Play, Loader2, X } from "lucide-react";
import type { LLMNodeData } from "@/types";

const GEMINI_MODELS = [
  "gemini-3-flash-preview",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-pro",
];

function LLMNode({ id, data }: NodeProps<LLMNodeData>) {
  const { updateNodeData, deleteNode, edges, getConnectedNodes, getNodeValue } = useWorkflowStore();
  const [isRunning, setIsRunning] = useState(false);

  // Get all connected nodes for each input
  const systemPromptNodes = useMemo(
    () => getConnectedNodes(id, "system_prompt"),
    [id, getConnectedNodes]
  );
  const userMessageNodes = useMemo(
    () => getConnectedNodes(id, "user_message"),
    [id, getConnectedNodes]
  );
  const imageNodes = useMemo(
    () => getConnectedNodes(id, "images"),
    [id, getConnectedNodes]
  );

  // Aggregate values from connected nodes
  const connectedSystemPrompt = useMemo(() => {
    if (systemPromptNodes.length === 0) return null;
    return systemPromptNodes
      .map((node) => getNodeValue(node.id))
      .filter((v) => v)
      .join("\n\n");
  }, [systemPromptNodes, getNodeValue]);

  const connectedUserMessage = useMemo(() => {
    if (userMessageNodes.length === 0) return null;
    const values = userMessageNodes
      .map((node) => {
        const value = getNodeValue(node.id);
        console.log("LLM Node - Getting value from node:", { nodeId: node.id, nodeType: node.type, value });
        return value;
      })
      .filter((v) => v && v.trim() !== "");
    return values.length > 0 ? values.join("\n\n") : null;
  }, [userMessageNodes, getNodeValue]);

  const connectedImages = useMemo(() => {
    return imageNodes
      .map((node) => {
        const value = getNodeValue(node.id);
        // Only include valid image URLs (data URLs or HTTP URLs)
        if (value && typeof value === "string" && (value.startsWith("data:") || value.startsWith("http://") || value.startsWith("https://"))) {
          return value;
        }
        return null;
      })
      .filter((v): v is string => v !== null && v !== undefined);
  }, [imageNodes, getNodeValue]);

  // Update node data when connections change
  useEffect(() => {
    const updates: Partial<LLMNodeData> = {};
    if (connectedSystemPrompt !== null) {
      updates.systemPrompt = connectedSystemPrompt;
    }
    if (connectedUserMessage !== null) {
      updates.userMessage = connectedUserMessage;
    }
    if (connectedImages.length > 0) {
      updates.images = connectedImages;
    }
    if (Object.keys(updates).length > 0) {
      updateNodeData(id, updates);
    }
  }, [connectedSystemPrompt, connectedUserMessage, connectedImages, id, updateNodeData]);

  // Debug: Log connection status
  useEffect(() => {
    console.log("LLM Node Connection Status:", {
      nodeId: id,
      userMessageNodes: userMessageNodes.length,
      connectedUserMessage: connectedUserMessage,
      dataUserMessage: data.userMessage,
      edges: edges.filter(e => e.target === id && e.targetHandle === "user_message"),
    });
  }, [id, userMessageNodes, connectedUserMessage, data.userMessage, edges]);

  const handleRun = async () => {
    setIsRunning(true);
    updateNodeData(id, { isRunning: true });

    try {
      // Use connected values if available, otherwise use manual input
      const systemPrompt = connectedSystemPrompt ?? data.systemPrompt ?? "";
      const userMessage = connectedUserMessage ?? data.userMessage ?? "";
      const images = connectedImages.length > 0 ? connectedImages : (data.images || []);

      if (!userMessage && userMessageNodes.length === 0) {
        alert("Please provide a user message or connect a text node");
        setIsRunning(false);
        updateNodeData(id, { isRunning: false });
        return;
      }

      // TODO: Call Trigger.dev task for LLM execution
      const response = await fetch("/api/nodes/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeId: id,
          model: data.model || "gemini-3-flash-preview",
          systemPrompt: systemPrompt || undefined,
          userMessage: userMessage,
          images: images,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        updateNodeData(id, {
          output: `Error: ${result.error}`,
          isRunning: false,
        });
      } else {
        updateNodeData(id, {
          output: result.output || "No response from API",
          isRunning: false,
        });
        
        // Always trigger history refresh after successful run (even if database save failed)
        console.log("LLM run completed, triggering history refresh. RunId:", result.runId);
        // Dispatch custom event to refresh history
        window.dispatchEvent(new CustomEvent("workflowRunCompleted", { 
          detail: { runId: result.runId, nodeId: id } 
        }));
        
        // Also trigger immediate refresh after a short delay
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("workflowRunCompleted"));
        }, 2000);
      }
    } catch (error) {
      console.error("LLM execution error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      updateNodeData(id, {
        output: `Error: ${errorMessage}`,
        isRunning: false,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const hasConnection = (handleId: string) => {
    return edges.some((e) => e.target === id && e.targetHandle === handleId);
  };

  const getConnectionCount = (handleId: string) => {
    return edges.filter((e) => e.target === id && e.targetHandle === handleId).length;
  };

  return (
    <div className={`rounded-lg border-2 bg-gray-900 shadow-lg min-w-[350px] ${
      data.isRunning ? "border-purple-500 shadow-purple-500/50 animate-pulse" : "border-gray-700"
    }`}>
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-3 py-2">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-semibold text-gray-200">Run Any LLM</span>
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
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">Model</label>
          <select
            value={data.model || "gemini-3-flash-preview"}
            onChange={(e) => updateNodeData(id, { model: e.target.value })}
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-gray-200 focus:border-purple-500 focus:outline-none"
          >
            {GEMINI_MODELS.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">
            System Prompt {hasConnection("system_prompt") && `(${getConnectionCount("system_prompt")} connected)`}
          </label>
          {hasConnection("system_prompt") ? (
            <div className="space-y-2">
              <div className="rounded-md border border-gray-700 bg-gray-800 p-2 text-xs text-gray-300">
                {connectedSystemPrompt || "No value from connected nodes"}
              </div>
              {systemPromptNodes.map((node) => (
                <div key={node.id} className="flex items-center gap-2 rounded bg-gray-800 px-2 py-1 text-xs">
                  <span className="text-gray-400">From: {node.type} node</span>
                  <span className="text-gray-500">({node.id.substring(0, 8)}...)</span>
                </div>
              ))}
            </div>
          ) : (
            <textarea
              value={data.systemPrompt || ""}
              onChange={(e) => updateNodeData(id, { systemPrompt: e.target.value })}
              placeholder="Optional system instructions..."
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
              rows={2}
            />
          )}
          <Handle
            type="target"
            position={Position.Left}
            id="system_prompt"
            isConnectable={true}
            style={{ background: "#9333ea", width: "12px", height: "12px", border: "2px solid #0a0a0a" }}
            className="!w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">
            User Message {hasConnection("user_message") && `(${getConnectionCount("user_message")} connected)`}
          </label>
          {hasConnection("user_message") ? (
            <div className="space-y-2">
              <div className="rounded-md border border-gray-700 bg-gray-800 p-2 text-xs text-gray-300 whitespace-pre-wrap">
                {connectedUserMessage || "No value from connected nodes"}
              </div>
              {userMessageNodes.map((node) => (
                <div key={node.id} className="flex items-center gap-2 rounded bg-gray-800 px-2 py-1 text-xs">
                  <span className="text-gray-400">From: {node.type} node</span>
                  <span className="text-gray-500">({node.id.substring(0, 8)}...)</span>
                </div>
              ))}
            </div>
          ) : (
            <textarea
              value={data.userMessage || ""}
              onChange={(e) => updateNodeData(id, { userMessage: e.target.value })}
              placeholder="User message..."
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
              rows={3}
            />
          )}
          <Handle
            type="target"
            position={Position.Left}
            id="user_message"
            isConnectable={true}
            style={{ background: "#9333ea", width: "12px", height: "12px", border: "2px solid #0a0a0a" }}
            className="!w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">
            Images {hasConnection("images") && `(${getConnectionCount("images")} connected)`}
          </label>
          {hasConnection("images") ? (
            <div className="space-y-2">
              <div className="text-xs text-gray-400 mb-2">
                {connectedImages.length} image(s) from connected nodes
              </div>
              {connectedImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {connectedImages.map((imgUrl, imgIdx) => (
                    <div key={imgIdx} className="relative rounded border border-gray-700 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgUrl} alt={`Connected ${imgIdx + 1}`} className="w-full h-20 object-cover" />
                    </div>
                  ))}
                </div>
              )}
              {imageNodes.map((node) => (
                <div key={node.id} className="flex items-center gap-2 rounded bg-gray-800 px-2 py-1 text-xs">
                  <span className="text-gray-400">From: {node.type} node</span>
                  <span className="text-gray-500">({node.id.substring(0, 8)}...)</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-500">
              Connect image nodes to add images
            </div>
          )}
          <Handle
            type="target"
            position={Position.Left}
            id="images"
            isConnectable={true}
            style={{ background: "#9333ea", width: "12px", height: "12px", border: "2px solid #0a0a0a" }}
            className="!w-3 !h-3 hover:!w-4 hover:!h-4 transition-all"
          />
        </div>

        <button
          onClick={handleRun}
          disabled={
            isRunning || 
            (
              (!data.userMessage || data.userMessage.trim() === "") && 
              (!connectedUserMessage || connectedUserMessage.trim() === "") && 
              userMessageNodes.length === 0
            )
          }
          title={
            isRunning 
              ? "Running..." 
              : (!data.userMessage && !connectedUserMessage && userMessageNodes.length === 0)
                ? "Please provide a user message or connect a text node"
                : userMessageNodes.length > 0 && (!connectedUserMessage || connectedUserMessage.trim() === "")
                  ? "Connected but text node is empty. Please add text to the connected text node or type in User Message field."
                  : "Run LLM"
          }
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
              Run
            </>
          )}
        </button>

        {data.output && (
          <div className="mt-3 rounded-md border border-gray-700 bg-gray-800 p-3">
            <div className="mb-1 text-xs font-medium text-gray-400">Output</div>
            <div className="text-sm text-gray-200 whitespace-pre-wrap">{data.output}</div>
          </div>
        )}
      </div>
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

export default memo(LLMNode);
