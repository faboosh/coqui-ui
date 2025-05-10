import { ChangeEvent, FormEvent, useState } from "react";
import { useTTSContext } from "../TTSContext";
import { FormData } from "../types";
import { ChevronDown, ChevronUp, Download } from "lucide-react";
import AudioPlayer from "./AudioPlayer";
import { downloadFile } from "../util/downloadFile";
import DownloadButton from "./DownloadButton";

const ModelParameters = () => {
  const { modelInfo, generate, isGenerating, selectedModel, audioUrl } =
    useTTSContext();

  const [formData, setFormData] = useState<FormData>({
    text: "",
    speaker: "",
    speed: 1.0,
    emotion: "",
    language: "",
    pitch: 0,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedModel) return;
    generate(selectedModel, formData);
  };

  const generateFileName = (promptText: string) => {
    const text = promptText
      .replace(/[^a-z\d\s]/gi, "")
      .replace(/\s/gi, "-")
      .slice(0, 50)
      .toLowerCase();
    return `${text}.wav`;
  };

  if (!modelInfo || modelInfo?.status !== "ready") return null;
  return (
    <form className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Text</label>
        <textarea
          value={formData.text}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev) => ({ ...prev, text: e.target.value }))
          }
          className="w-full p-2 border bg-stone-950 outline-0 border-stone-800 rounded"
          required
        />
      </div>

      {modelInfo.speakers && modelInfo.speakers.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">Speaker</label>
          <div className="flex gap-1">
            <select
              value={formData.speaker}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setFormData((prev) => ({
                  ...prev,
                  speaker: e.target.value,
                }))
              }
              className="w-full p-2 border border-stone-800 rounded"
            >
              <option value="">Default</option>
              {modelInfo.speakers.map((speaker) => (
                <option key={speaker} value={speaker}>
                  {speaker}
                </option>
              ))}
            </select>
            <div className="flex flex-col gap-1">
              <button className="bg-stone-200 h-6 w-6 rounded-sm flex justify-center items-center">
                <ChevronUp className="w-4" />
              </button>
              <button className="bg-stone-200 h-6 w-6 rounded-sm flex justify-center items-center">
                <ChevronDown className="w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {modelInfo.languages && modelInfo.languages.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">Language</label>
          <select
            value={formData.language}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setFormData((prev) => ({
                ...prev,
                language: e.target.value,
              }))
            }
            className="w-full p-2 border border-stone-800 rounded"
          >
            <option value="">Default</option>
            {modelInfo.languages.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </div>
      )}

      {modelInfo.emotions && modelInfo.emotions.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">Emotion</label>
          <select
            value={formData.emotion}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setFormData((prev) => ({
                ...prev,
                emotion: e.target.value,
              }))
            }
            className="w-full p-2 border border-stone-800 rounded"
          >
            <option value="">Neutral</option>
            {modelInfo.emotions.map((emotion) => (
              <option key={emotion} value={emotion}>
                {emotion}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          Speed: {formData.speed}
        </label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={formData.speed}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({
              ...prev,
              speed: parseFloat(e.target.value),
            }))
          }
          className="w-full"
        />
      </div>

      {modelInfo.supports_pitch && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Pitch: {formData.pitch} semitones
          </label>
          <input
            type="range"
            min="-12"
            max="12"
            step="1"
            value={formData.pitch}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({
                ...prev,
                pitch: parseInt(e.target.value, 10),
              }))
            }
            className="w-full"
          />
        </div>
      )}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={isGenerating}
          className="w-full p-2 bg-sky-500 text-white rounded hover:bg-sky-600 disabled:opacity-50"
        >
          {isGenerating ? "Generating..." : "Generate Speech"}
        </button>
        {audioUrl && (
          <>
            <DownloadButton url={audioUrl} promptText={formData.text} />
            <div className="shadow-inner shadow-lime-100 bg-lime-500 border-2 border-lime-300 flex items-center justify-center rounded-full p-1 text-lime-100">
              <AudioPlayer src={audioUrl} />
            </div>
          </>
        )}
      </div>
    </form>
  );
};

export default ModelParameters;
