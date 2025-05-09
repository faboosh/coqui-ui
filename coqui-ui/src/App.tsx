import TTSInterface from "./TTS";
import { TTSContextProvider } from "./TTSContext";
import { GenerationHistoryContextProvider } from "./GenerationHistoryContext";

function App() {
  return (
    <GenerationHistoryContextProvider>
      <TTSContextProvider>
        <TTSInterface />
      </TTSContextProvider>
    </GenerationHistoryContextProvider>
  );
}

export default App;
