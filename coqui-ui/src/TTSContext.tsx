import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { FormData, LoadingStatus, ModelInfo } from "./types";
import useGenerationHistoryContext from "./GenerationHistoryContext";
import { API_BASE_URL, routes } from "./api";

const TTSContext = createContext<{
  selectModel: (model: string) => void;
  generate: (model: string, modelParameters: FormData) => void;
  models: string[];
  filteredModels: string[];
  selectedModel: string | null;
  modelInfo: ModelInfo | null;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  loadingStatus: LoadingStatus | null;
  isGenerating: boolean;
  audioUrl: string | null;
}>({
  selectModel: (_model: string) => {},
  generate: (_model: string, _modelParameters: FormData) => {},
  models: [],
  filteredModels: [],
  selectedModel: null,
  modelInfo: null,
  searchTerm: "",
  setSearchTerm: () => {},
  loadingStatus: null,
  isGenerating: false,
  audioUrl: null,
});

export const TTSContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [models, setModels] = useState<string[]>([]);
  const [filteredModels, setFilteredModels] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus | null>(
    null
  );
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { history, setHistory } = useGenerationHistoryContext();

  // Fetch available models on mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const modelList = await routes.models.list();
        setModels(modelList.models);
        setFilteredModels(modelList.models);
      } catch (error) {
        console.error("Error fetching models:", error);
      }
    };

    fetchModels();
  }, []);

  // Handle model search
  useEffect(() => {
    const filtered = models.filter((model) =>
      model.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredModels(filtered);
  }, [searchTerm, models]);

  // Poll model loading status
  const pollModelStatus = useCallback(async (modelName: string) => {
    try {
      const modelInfo = await routes.models.info(modelName);

      setLoadingStatus(modelInfo);

      if (modelInfo.status === "ready") {
        setModelInfo(modelInfo);
      } else if (modelInfo.status !== "error") {
        setTimeout(() => pollModelStatus(modelName), 1000);
      }
    } catch (error) {
      console.error("Error polling model status:", error);
      setLoadingStatus({
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, []);

  // Handle model selection
  const selectModel = async (model: string) => {
    setSelectedModel(model);
    setModelInfo(null);
    setLoadingStatus({ status: "loading", progress: 0 });
    pollModelStatus(model);
  };

  // Handle form submission
  const generate = async (selectedModel: string, modelParameters: FormData) => {
    if (!selectedModel) return;

    setIsGenerating(true);
    const payload = {
      model: selectedModel,
      ...modelParameters,
    };

    try {
      const id = await routes.audio.generate(payload);

      setHistory([{ ...payload, id }, ...history]);
      setAudioUrl(`${API_BASE_URL}/audio/${id}.wav`);
    } catch (error) {
      console.error("Error generating audio:", error);
      alert("Failed to generate audio");
    } finally {
      setIsGenerating(false);
    }
  };

  // Clean up audioUrl when component unmounts
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);
  return (
    <TTSContext.Provider
      value={{
        selectModel,
        generate,
        models,
        filteredModels,
        selectedModel,
        modelInfo,
        searchTerm,
        setSearchTerm,
        loadingStatus,
        isGenerating,
        audioUrl,
      }}
    >
      {children}
    </TTSContext.Provider>
  );
};

export const useTTSContext = () => useContext(TTSContext);
