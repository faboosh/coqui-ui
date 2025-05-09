// types.ts
export interface ModelInfo {
  status: "ready" | "loading" | "error" | "queued";
  speakers?: string[];
  emotions?: string[];
  languages?: string[];
  supports_pitch?: boolean;
  progress?: number;
  error?: string;
}

export interface FormData {
  text: string;
  speaker: string;
  language: string;
  speed: number;
  emotion: string;
  pitch: number;
}

export interface LoadingStatus {
  status: "loading" | "ready" | "error" | "queued";
  progress?: number;
  error?: string;
}

export interface GenerationHistoryEntry {
  id: string;
  text: string;
  speaker: string;
  language: string;
  speed: number;
  emotion: string;
  pitch: number;
  model: string;
}
