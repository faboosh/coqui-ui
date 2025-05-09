import React, { ChangeEvent } from "react";
import { useTTSContext } from "../TTSContext";
import { Loader2, Star, StarOff } from "lucide-react";
import { useLocalStorageState } from "../hooks/useLocalStorageState";

const ModelSelector = () => {
  const {
    searchTerm,
    setSearchTerm,
    selectedModel,
    selectModel,
    filteredModels,
    loadingStatus,
  } = useTTSContext();

  const [favoriteModels, setFavoriteModels] = useLocalStorageState<string[]>(
    "favorite-models",
    []
  );

  const isFavoriteModel = (model: string) => favoriteModels.includes(model);
  const toggleFavoriteModel = (model: string) => {
    console.log(model, isFavoriteModel(model));
    if (isFavoriteModel(model)) {
      setFavoriteModels(
        favoriteModels.filter((modelToCheck) => modelToCheck !== model)
      );
    } else {
      setFavoriteModels([...favoriteModels, model]);
    }
  };

  const getSortedModels = () => [
    ...filteredModels.filter((model) => isFavoriteModel(model)),
    ...filteredModels.filter((model) => !isFavoriteModel(model)),
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Search Models</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setSearchTerm(e.target.value)
          }
          className="w-full p-2 border rounded"
          placeholder="Search models..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Select Model</label>
        <div className="w-full flex flex-col p-2 border rounded max-h-64 overflow-y-auto">
          {getSortedModels().map((model) => (
            <div
              key={model}
              className={`flex justify-between cursor-pointer p-1 rounded ${
                selectedModel === model ? "bg-gray-200" : ""
              }`}
            >
              <p className="flex-grow" onClick={() => selectModel(model)}>
                {model}
              </p>
              <button
                className="z-10 "
                onClick={() => toggleFavoriteModel(model)}
              >
                <Star
                  className={`${
                    isFavoriteModel(model)
                      ? "fill-yellow-400 stroke-yellow-500"
                      : ""
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
      {loadingStatus && loadingStatus.status !== "ready" && (
        <div className="flex items-center space-x-2">
          <Loader2 className="animate-spin" />
          <span>
            {loadingStatus.status === "error"
              ? `Error: ${loadingStatus.error}`
              : `Loading model... ${loadingStatus.progress}%`}
          </span>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
