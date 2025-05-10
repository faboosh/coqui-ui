import React, { createContext, useContext } from "react";
import { GenerationHistoryEntry } from "./types";
import { useLocalStorageState } from "./hooks/useLocalStorageState";

const GenerationHistoryContext = createContext<{
  history: GenerationHistoryEntry[];
  setHistory: (history: GenerationHistoryEntry[]) => void;
  clearHistory: () => void;
  removeHistoryEntry: (id: string) => void;
}>({
  history: [],
  setHistory: () => {},
  clearHistory: () => {},
  removeHistoryEntry: (_id: string) => {},
});

export const GenerationHistoryContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [history, setHistory] = useLocalStorageState<GenerationHistoryEntry[]>(
    "generation-history",
    []
  );
  const clearHistory = () => {
    setHistory([]);
  };
  const removeHistoryEntry = (id: string) => {
    setHistory(history.filter((entry) => entry.id !== id));
  };
  return (
    <GenerationHistoryContext.Provider
      value={{ history, setHistory, clearHistory, removeHistoryEntry }}
    >
      {children}
    </GenerationHistoryContext.Provider>
  );
};

const useGenerationHistoryContext = () => useContext(GenerationHistoryContext);

export default useGenerationHistoryContext;
