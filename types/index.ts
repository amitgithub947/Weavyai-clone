import { Node, Edge } from "reactflow";

export type NodeType =
  | "text"
  | "uploadImage"
  | "uploadVideo"
  | "llm"
  | "cropImage"
  | "extractFrame";

export interface TextNodeData {
  text: string;
}

export interface UploadImageNodeData {
  imageUrl?: string;
  fileName?: string;
}

export interface UploadVideoNodeData {
  videoUrl?: string;
  fileName?: string;
}

export interface LLMNodeData {
  model: string;
  systemPrompt?: string;
  userMessage?: string;
  images?: string[];
  output?: string;
  isRunning?: boolean;
}

export interface CropImageNodeData {
  imageUrl?: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  outputUrl?: string;
  isRunning?: boolean;
  error?: string;
}

export interface ExtractFrameNodeData {
  videoUrl?: string;
  timestamp: string; // Can be seconds or percentage like "50%"
  outputUrl?: string;
  isRunning?: boolean;
  error?: string;
}

export type NodeData =
  | TextNodeData
  | UploadImageNodeData
  | UploadVideoNodeData
  | LLMNodeData
  | CropImageNodeData
  | ExtractFrameNodeData;

export interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  selectedNodes: string[];
}

export interface WorkflowRun {
  id: string;
  workflowId?: string;
  status: "success" | "failed" | "partial" | "running";
  scope: "full" | "partial" | "single";
  duration?: number;
  nodeIds: string[];
  createdAt: Date;
  nodeRuns?: NodeRun[];
}

export interface NodeRun {
  id: string;
  nodeId: string;
  nodeType: string;
  status: "success" | "failed" | "running";
  duration?: number;
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  error?: string;
}

export interface HandleType {
  id: string;
  type: "source" | "target";
  dataType: "text" | "image" | "video";
  required?: boolean;
}
