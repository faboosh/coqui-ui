import ModelSelector from "./components/ModelSelector";
import ModelParameters from "./components/ModelParameters";
import HistoryManager from "./components/HistoryManager";

export default function TTSInterface() {
  return (
    <div className="max-w-8xl mx-auto p-6 grid grid-cols-2 gap-6 h-[100vh]">
      <div className="space-y-6">
        <ModelSelector />
        <ModelParameters />
      </div>
      <div className="space-y-3 flex flex-col overflow-y-auto">
        <HistoryManager />
      </div>
    </div>
  );
}
