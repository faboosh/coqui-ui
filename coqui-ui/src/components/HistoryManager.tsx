import { Trash2 } from "lucide-react";
import useGenerationHistoryContext from "../GenerationHistoryContext";
import AudioPlayer from "./AudioPlayer";
import { routes } from "../api";
import DownloadButton from "./DownloadButton";

const HistoryManager = () => {
  const { history, clearHistory, removeHistoryEntry } =
    useGenerationHistoryContext();

  return (
    <>
      <div className="gap-3 flex justify-between">
        <h3 className="font-bold text-xl">History</h3>
        <button
          onClick={clearHistory}
          className="shadow-inner shadow-red-700 bg-red-900 border border-red-800 text-red-50 hover:bg-red-800 px-2 py-1 rounded flex gap-2"
        >
          Clear history
          <Trash2 />
        </button>
      </div>
      <div className="gap-y-3 flex flex-col flex-shrink overflow-y-auto max-h-full">
        {history.map(({ id, model, text, speaker }) => (
          <div
            className="flex gap-3 border border-stone-800 rounded p-3"
            key={id}
          >
            <div className="space-y-1 w-full">
              <h5 className="text-lg font-semibold">
                {model}
                {speaker ? ` (${speaker})` : ""}
              </h5>
              <p>{text}</p>
            </div>
            <div className="flex justify-center gap-5 items-center mr-3">
              <button onClick={() => removeHistoryEntry(id)}>
                <Trash2 />
              </button>
              <DownloadButton id={id} promptText={text} />
              <AudioPlayer src={routes.audio.playbackUrl(id)} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default HistoryManager;
