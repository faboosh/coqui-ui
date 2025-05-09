import {
  useState,
  useEffect,
  useCallback,
  FormEvent,
  ChangeEvent,
} from "react";
import { Loader2 } from "lucide-react";
import { ModelInfo, FormData, LoadingStatus } from "./types";
import { useTTSContext } from "./TTSContext";
import ModelSelector from "./components/ModelSelector";
import ModelParameters from "./components/ModelParameters";
import useGenerationHistoryContext from "./GenerationHistoryContext";
import AudioPlayer from "./components/AudioPlayer";

const API_BASE_URL = "http://localhost:5000";

export default function TTSInterface() {
  const { audioUrl } = useTTSContext();
  const { history } = useGenerationHistoryContext();
  return (
    <div className="max-w-8xl mx-auto p-6 grid grid-cols-2 gap-6">
      <div className="space-y-6">
        <ModelSelector />
        <ModelParameters />

        {audioUrl && (
          <div>
            <audio controls src={audioUrl} className="w-full" />
          </div>
        )}
      </div>
      <div className="space-y-3">
        {history.map(({ id, model, text, speaker }) => (
          <div className="flex gap-3 border rounded p-3" key={id}>
            <div className="space-y-1 w-full">
              <h5 className="text-lg font-semibold">
                {model} ({speaker})
              </h5>
              <p>{text}</p>
            </div>
            <div className="flex justify-center items-center mr-3">
              <AudioPlayer src={`${API_BASE_URL}/api/audio/${id}.wav`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
