"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronRight, ChevronLeft, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, Database, Trash2 } from "lucide-react";
import type { WorkflowRun, NodeRun } from "@/types";

export default function RightSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasDatabase, setHasDatabase] = useState(true); // Assume true until proven otherwise
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFetching, setIsFetching] = useState(false); // Track if a fetch is in progress

  const fetchRuns = useCallback(async () => {
    // Check if we're in the browser first
    if (typeof window === "undefined") {
      console.warn("⚠️ fetchRuns called on server, skipping");
      return;
    }

    // Check if fetch is available
    if (typeof fetch === "undefined") {
      console.error("❌ Fetch API not available");
      setRuns([]);
      setHasDatabase(false);
      return;
    }

    // Prevent multiple simultaneous fetches
    if (isFetching) {
      console.log("⏭️ Skipping fetch - another request in progress");
      return;
    }

    setIsFetching(true);

    try {
      // Get current runs using functional update to avoid dependency issues
      let currentRuns: WorkflowRun[] = [];
      setRuns((prevRuns) => {
        currentRuns = prevRuns;
        // Only show loading indicator if we don't have any runs yet
        if (prevRuns.length === 0) {
          setIsLoading(true);
        }
        return prevRuns; // Don't change state here
      });
      
      console.log(`🔄 Fetching workflow runs... (preserving ${currentRuns.length} existing runs)`);
      
      // Ensure we have a valid URL
      const apiUrl = "/api/runs";
      if (!apiUrl || typeof apiUrl !== "string") {
        throw new Error("Invalid API URL");
      }
      
      let res: Response;
      try {
        // Create abort controller for timeout (fallback for browsers without AbortSignal.timeout)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        res = await fetch(apiUrl, {
          method: "GET",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
      } catch (fetchError) {
        // Handle network errors (TypeError: Failed to fetch)
        const errorMessage = fetchError instanceof Error ? fetchError.message : "Unknown network error";
        
        // Silently handle abort/timeout errors (they're expected)
        if (errorMessage.includes("aborted") || errorMessage.includes("timeout")) {
          // Don't clear existing runs on timeout - keep them visible
          console.log("⏱️ Request timed out, keeping existing data");
          setIsLoading(false);
          setIsFetching(false);
          return;
        }
        
        // For network errors, silently handle them
        console.log("ℹ️ Network request failed, keeping existing data");
        
        // Don't clear existing runs on network error - preserve them
        setIsLoading(false);
        setIsFetching(false);
        return;
      }
      
      if (!res) {
        throw new Error("No response received from server");
      }
      
      console.log("📡 Response status:", res.status);
      console.log("📡 Response URL:", res.url);
      
      if (!res.ok) {
        // Handle different error statuses gracefully
        if (res.status === 404) {
          console.warn("⚠️ Route /api/runs not found (404). This might be a Next.js routing issue.");
          console.warn("💡 Try: 1) Restart dev server, 2) Clear .next cache, 3) Check route file exists");
        } else if (res.status === 401) {
          // Unauthorized - user not logged in, this is expected
          console.log("ℹ️ User not authenticated, returning empty runs list");
        } else if (res.status >= 500) {
          // Server error - log but don't break UI
          console.warn("⚠️ Server error fetching runs:", res.status);
        }
        
        // Try to read error text, but don't fail if we can't
        try {
          const errorText = await res.text();
          if (errorText && res.status >= 500) {
            console.warn("⚠️ Error details:", errorText.substring(0, 200));
          }
        } catch (textError) {
          // Ignore text reading errors
        }
        
        // Don't clear existing runs on error - preserve them
        setIsLoading(false);
        setIsFetching(false);
        return;
      }
      
      let data;
      try {
        data = await res.json();
      } catch (jsonError) {
        console.error("❌ Failed to parse JSON response:", jsonError);
        // Don't clear existing runs on JSON parse error - preserve them
        setIsLoading(false);
        setIsFetching(false);
        return;
      }
      
      console.log("📦 Received data:", data);
      console.log("📊 Data type:", Array.isArray(data) ? "array" : typeof data);
      console.log("📊 Data length:", Array.isArray(data) ? data.length : "N/A");
      
      if (Array.isArray(data)) {
        console.log(`✅ Received ${data.length} runs from server`);
        const formattedRuns = data.map((run: WorkflowRun & { createdAt?: string | Date }) => {
          try {
            return {
              ...run,
              createdAt: run.createdAt ? new Date(run.createdAt) : new Date(),
            };
          } catch (dateError) {
            console.warn("⚠️ Invalid date in run:", run, dateError);
            return {
              ...run,
              createdAt: new Date(),
            };
          }
        }) as WorkflowRun[];
        
        // Only update runs if we got valid data
        // This preserves existing runs if server returns empty array
        setRuns((prevRuns) => {
          if (formattedRuns.length > 0 || prevRuns.length === 0) {
            // Update with new data if we got runs OR if we had no runs before
            console.log(`✅ Updating runs: ${formattedRuns.length} runs (had ${prevRuns.length} before)`);
            return formattedRuns;
          } else {
            // Server returned empty array but we have existing runs - keep existing runs
            console.log(`ℹ️ Server returned empty array, preserving existing ${prevRuns.length} runs`);
            return prevRuns;
          }
        });
        setHasDatabase(true); // Data received, so database is likely working
      } else {
        console.error("❌ Invalid response format:", data);
        // Don't clear existing runs on invalid format - preserve them
      }
    } catch (error) {
      console.error("❌ Failed to load workflow history", error);
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        if (error.stack) {
          console.error("Error stack:", error.stack);
        }
      } else {
        console.error("Unknown error type:", typeof error, error);
      }
      // Don't clear existing runs on error - preserve them
      // Only clear if we never had any runs (first load)
      setRuns((prevRuns) => {
        if (prevRuns.length === 0) {
          setHasDatabase(false);
          return [];
        }
        return prevRuns; // Preserve existing runs
      });
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [isFetching]);

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") {
      return;
    }

    // Fetch immediately on mount (browser refresh)
    console.log("🔄 Component mounted, fetching workflow history...");
    fetchRuns().catch((err) => {
      console.error("❌ Initial fetch failed:", err);
    });
    
    // Refresh every 10 seconds to get new runs (reduced frequency to avoid too many requests)
    let interval: NodeJS.Timeout | null = null;
    try {
      interval = setInterval(() => {
        // Check if component is still mounted
        if (typeof window !== "undefined") {
          fetchRuns().catch((err) => {
            console.error("❌ Interval fetch failed:", err);
          });
        }
      }, 10000); // Changed from 5s to 10s
    } catch (intervalError) {
      console.error("❌ Failed to set up interval:", intervalError);
    }
    
    // Also refresh when a workflow run completes
    const handleRunCompleted = (event?: Event) => {
      try {
        const customEvent = event as CustomEvent;
        const runId = customEvent?.detail?.runId;
        console.log("🔄 Workflow run completed event received, refreshing history...", { runId });
        
        // Refresh immediately
        fetchRuns().catch((err) => {
          console.error("❌ Event-triggered fetch failed:", err);
        });
        
        // Only one delayed refresh after 2s to catch database updates
        setTimeout(() => {
          if (typeof window !== "undefined") {
            console.log("🔄 Delayed refresh (2s)...");
            fetchRuns().catch((err) => {
              console.error("❌ Delayed fetch failed:", err);
            });
          }
        }, 2000); // Only one delayed refresh instead of 3
      } catch (eventError) {
        console.error("❌ Error handling workflowRunCompleted event:", eventError);
      }
    };
    
    try {
      window.addEventListener("workflowRunCompleted", handleRunCompleted);
    } catch (addEventListenerError) {
      console.error("❌ Failed to add event listener:", addEventListenerError);
    }
    
    // Cleanup function
    return () => {
      if (interval) {
        clearInterval(interval);
      }
      try {
        window.removeEventListener("workflowRunCompleted", handleRunCompleted);
      } catch (removeError) {
        console.error("❌ Failed to remove event listener:", removeError);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - fetchRuns is stable from useCallback

  const handleDeleteAllHistory = useCallback(async () => {
    if (!hasDatabase || runs.length === 0) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/runs", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to delete history");
      }

      const result = await response.json();
      console.log("✅ History deleted successfully:", result);

      // Clear runs from state
      setRuns([]);
      setSelectedRun(null);
      setShowDeleteConfirm(false);

      // Show success message
      alert(`Successfully deleted ${result.deletedCount} workflow run${result.deletedCount !== 1 ? "s" : ""}`);
    } catch (error) {
      console.error("❌ Failed to delete history:", error);
      alert(error instanceof Error ? error.message : "Failed to delete history. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }, [hasDatabase, runs.length]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "partial":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "—";
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  const formatRunTitle = (run: WorkflowRun, index: number) => {
    const scopeLabel = 
      run.scope === "full" 
        ? "Full Workflow" 
        : run.scope === "partial" 
        ? `${run.nodeIds.length} nodes selected`
        : "Single Node";
    return `Run #${runs.length - index} - ${formatDate(run.createdAt)} (${scopeLabel})`;
  };

  const formatNodeOutput = (outputs?: Record<string, unknown>): string => {
    if (!outputs) return "";
    
    // If outputs has an 'output' key, use that
    if (outputs.output) {
      const output = outputs.output;
      if (typeof output === "string") {
        // Truncate long outputs
        return output.length > 100 ? output.substring(0, 100) + "..." : output;
      }
      return String(output);
    }
    
    // Otherwise, format the object
    return JSON.stringify(outputs);
  };

  const formatNodeInputs = (inputs?: Record<string, unknown>): string => {
    if (!inputs) return "";
    
    // Format inputs nicely
    const parts: string[] = [];
    if (inputs.model) parts.push(`Model: ${inputs.model}`);
    if (inputs.userMessage) {
      const msg = String(inputs.userMessage);
      parts.push(`Message: ${msg.length > 50 ? msg.substring(0, 50) + "..." : msg}`);
    }
    if (inputs.imagesCount) parts.push(`Images: ${inputs.imagesCount}`);
    if (inputs.imageUrl) parts.push("Image URL: [provided]");
    if (inputs.videoUrl) parts.push("Video URL: [provided]");
    
    return parts.length > 0 ? parts.join(", ") : "No inputs";
  };

  const getNodeTypeLabel = (nodeType: string): string => {
    const labels: Record<string, string> = {
      text: "Text",
      uploadImage: "Upload Image",
      uploadVideo: "Upload Video",
      llm: "LLM Node",
      cropImage: "Crop Image",
      extractFrame: "Extract Frame",
    };
    return labels[nodeType] || nodeType;
  };

  return (
    <div
      className={`relative flex h-full flex-col border-l border-gray-800 bg-[#111111] transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-80"
      }`}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -left-3 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-gray-700 bg-[#111111] text-gray-400 hover:bg-gray-800 hover:text-white"
      >
        {isCollapsed ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {!isCollapsed && (
        <>
          <div className="border-b border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-300">
                  Workflow History
                </h2>
                {runs.length > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {runs.length} run{runs.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!hasDatabase && (
                  <div 
                    title="Database not connected or configured" 
                    className="text-red-500"
                  >
                    <Database className="h-4 w-4" />
                  </div>
                )}
                {runs.length > 0 && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isLoading || isDeleting}
                    className="rounded p-1.5 text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-colors disabled:opacity-50"
                    title="Delete all history"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={fetchRuns}
                  disabled={isLoading}
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors disabled:opacity-50"
                  title="Refresh history"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Delete Confirmation Dialog */}
          {showDeleteConfirm && (
            <div className="border-b border-gray-800 p-4 bg-red-900/10">
              <div className="space-y-3">
                <div className="text-sm font-semibold text-red-400">
                  Delete All History?
                </div>
                <div className="text-xs text-gray-400">
                  This will permanently delete all {runs.length} workflow run{runs.length !== 1 ? "s" : ""}. This action cannot be undone.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDeleteAllHistory}
                    disabled={isDeleting}
                    className="flex-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Delete All"}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="flex-1 rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Loading history...
              </div>
            ) : runs.length === 0 ? (
              <div className="p-4 text-center space-y-2">
                <div className="text-sm text-gray-500">
                  No workflow runs yet
                </div>
                <div className="text-xs text-gray-600">
                  {hasDatabase 
                    ? "Run a workflow to see history here" 
                    : "Please configure DATABASE_URL to save workflow history"}
                </div>
                {!hasDatabase && (
                  <div className="flex items-center justify-center gap-1 text-xs text-red-400 mt-2">
                    <Database className="h-3 w-3" />
                    <span>Database not connected</span>
                  </div>
                )}
                {hasDatabase && (
                  <div className="text-xs text-gray-500 mt-1">
                    💡 Make sure you&apos;ve run an LLM node to create history
                  </div>
                )}
                <button
                  onClick={fetchRuns}
                  disabled={isLoading}
                  className="mt-2 text-xs text-purple-400 hover:text-purple-300 underline disabled:opacity-50"
                >
                  {isLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            ) : (
              <div className="p-2">
                {runs.map((run, index) => (
                  <div
                    key={run.id}
                    className={`mb-3 cursor-pointer rounded-md border transition-colors ${
                      selectedRun === run.id
                        ? "border-purple-600 bg-gray-800"
                        : "border-gray-800 bg-gray-900 hover:border-gray-700"
                    }`}
                    onClick={() =>
                      setSelectedRun(selectedRun === run.id ? null : run.id)
                    }
                  >
                    {/* Run Header */}
                    <div className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          {getStatusIcon(run.status)}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-gray-200">
                              {formatRunTitle(run, index)}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                run.status === "success" 
                                  ? "bg-green-900/30 text-green-400"
                                  : run.status === "failed"
                                  ? "bg-red-900/30 text-red-400"
                                  : run.status === "partial"
                                  ? "bg-yellow-900/30 text-yellow-400"
                                  : "bg-blue-900/30 text-blue-400"
                              }`}>
                                {run.status.toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDuration(run.duration)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Node-Level Details (Expanded) */}
                    {selectedRun === run.id && run.nodeRuns && run.nodeRuns.length > 0 && (
                      <div className="border-t border-gray-800 p-3 space-y-3 bg-gray-900/50">
                        <div className="text-xs font-semibold text-gray-400 mb-2">
                          Node Execution Details:
                        </div>
                        {run.nodeRuns.map((nodeRun: NodeRun) => (
                          <div
                            key={nodeRun.id}
                            className="relative pl-4 border-l-2 border-gray-700"
                          >
                            {/* Visual connector line */}
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-700"></div>
                            
                            <div className="space-y-2">
                              {/* Node Header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-gray-800 border-2 border-gray-700"></div>
                                  <span className="text-xs font-medium text-gray-300">
                                    {getNodeTypeLabel(nodeRun.nodeType)} ({nodeRun.nodeId.substring(0, 8)}...)
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(nodeRun.status)}
                                  <span className="text-xs text-gray-500">
                                    {formatDuration(nodeRun.duration)}
                                  </span>
                                </div>
                              </div>

                              {/* Inputs */}
                              {nodeRun.inputs && Object.keys(nodeRun.inputs).length > 0 && (
                                <div className="ml-4 text-xs text-gray-500">
                                  <span className="text-gray-600">Inputs:</span> {formatNodeInputs(nodeRun.inputs)}
                                </div>
                              )}

                              {/* Output */}
                              {nodeRun.outputs && Object.keys(nodeRun.outputs).length > 0 && (
                                <div className="ml-4 rounded bg-gray-800/50 p-2 text-xs">
                                  <div className="text-gray-500 mb-1">Output:</div>
                                  <div className="text-gray-300 whitespace-pre-wrap break-words">
                                    {formatNodeOutput(nodeRun.outputs)}
                                  </div>
                                </div>
                              )}

                              {/* Error */}
                              {nodeRun.error && (
                                <div className="ml-4 rounded bg-red-900/20 border border-red-800/30 p-2 text-xs text-red-400">
                                  <div className="font-medium mb-1">Error:</div>
                                  <div className="whitespace-pre-wrap break-words">
                                    {nodeRun.error}
                                  </div>
                                </div>
                              )}

                              {/* Status indicator */}
                              {nodeRun.status === "success" && !nodeRun.outputs && (
                                <div className="ml-4 text-xs text-gray-500 italic">
                                  Completed successfully
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Empty state for expanded run */}
                    {selectedRun === run.id && (!run.nodeRuns || run.nodeRuns.length === 0) && (
                      <div className="border-t border-gray-800 p-3 text-xs text-gray-500 text-center">
                        No node execution details available
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {isCollapsed && (
        <div className="flex flex-col items-center gap-2 p-2">
          <Clock className="h-5 w-5 text-gray-400" />
          {!hasDatabase && (
            <div 
              title="Database not connected or configured" 
              className="text-red-500"
            >
              <Database className="h-4 w-4" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
