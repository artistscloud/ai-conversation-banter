
import React from "react";
import { AI_MODELS, AIModel } from "@/config/aiModels";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
  selectedModels: string[];
  onChange: (models: string[]) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModels, onChange }) => {
  const handleModelToggle = (modelId: string) => {
    const newSelectedModels = selectedModels.includes(modelId)
      ? selectedModels.filter(id => id !== modelId)
      : [...selectedModels, modelId];
    
    // Ensure we have at least 2 models selected and no more than 7
    if (newSelectedModels.length >= 2 && newSelectedModels.length <= 7) {
      onChange(newSelectedModels);
    }
  };

  return (
    <div className="glass-card p-4 rounded-xl mb-4">
      <h3 className="text-sm font-medium mb-3 text-gray-700">Select AI Models (2-7)</h3>
      <div className="flex flex-wrap gap-2">
        {Object.values(AI_MODELS).map((model) => (
          <button
            key={model.id}
            onClick={() => handleModelToggle(model.id)}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              "flex items-center space-x-2 border",
              selectedModels.includes(model.id)
                ? "border-2 shadow-sm"
                : "border border-gray-200 opacity-70"
            )}
            style={{
              borderColor: selectedModels.includes(model.id) ? model.color : undefined,
              backgroundColor: selectedModels.includes(model.id) ? `${model.color}10` : undefined,
            }}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: model.color }}
            />
            <span>{model.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModelSelector;
