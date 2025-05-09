import React, { createContext, useContext } from "react";
import { GenerationHistoryEntry } from "./types";
import { useLocalStorageState } from "./hooks/useLocalStorageState";

const GenerationHistoryContext = createContext<{
  history: GenerationHistoryEntry[];
  setHistory: (history: GenerationHistoryEntry[]) => void;
}>({
  history: [],
  setHistory: () => {},
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
  return (
    <GenerationHistoryContext.Provider value={{ history, setHistory }}>
      {children}
    </GenerationHistoryContext.Provider>
  );
};

const useGenerationHistoryContext = () => useContext(GenerationHistoryContext);

export default useGenerationHistoryContext;
