import { ModelInfo } from "./types";

export const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? `http://localhost:${process.env.VITE_API_PORT || 5000}/api`
    : window.location.origin + "/api";

export const routes = {
  models: {
    list: async () => {
      const response = await fetch(`${API_BASE_URL}/models`);
      const data: { models: string[] } = await response.json();
      return data;
    },
    info: async (modelName: string) => {
      const response = await fetch(
        `${API_BASE_URL}/model_info?model=${encodeURIComponent(modelName)}`
      );
      const data: ModelInfo = await response.json();
      return data;
    },
  },
  audio: {
    generate: async (payload: {
      text: string;
      speaker: string;
      language: string;
      speed: number;
      emotion: string;
      pitch: number;
      model: string;
    }) => {
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Generation failed");
      const { id } = await response.json();
      return id;
    },
    playbackUrl: (id: string) => `${API_BASE_URL}/audio/${id}.wav`,
  },
};
