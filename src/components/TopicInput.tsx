
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ModelSelector from "./ModelSelector";
import { MessagesSquare } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface TopicInputProps {
  onStartDiscussion: (topic: string, selectedModels: string[]) => void;
  initialSelectedModels: string[];
}

const TopicInput: React.FC<TopicInputProps> = ({
  onStartDiscussion,
  initialSelectedModels
}) => {
  const [topic, setTopic] = useState("");
  const [selectedModels, setSelectedModels] = useState(initialSelectedModels);

  const handleStartDiscussion = () => {
    if (!topic.trim()) {
      toast.error("Please enter a discussion topic");
      return;
    }
    
    if (selectedModels.length < 2) {
      toast.error("Please select at least 2 AI models");
      return;
    }
    
    onStartDiscussion(topic, selectedModels);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass-card p-6 rounded-xl space-y-6 shadow-lg animate-fade-in">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <MessagesSquare className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Start an AI Discussion</h2>
          <p className="text-sm text-gray-500 mt-1">
            Choose a topic and select AI models to participate
          </p>
        </div>
        
        <ModelSelector 
          selectedModels={selectedModels} 
          onChange={setSelectedModels} 
        />
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="topic" className="text-sm font-medium text-gray-700">
              Discussion Topic
            </label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="E.g., The future of artificial intelligence"
              className="glass-input text-base"
              onKeyPress={(e) => e.key === "Enter" && handleStartDiscussion()}
            />
          </div>
          
          <Button
            onClick={handleStartDiscussion}
            disabled={!topic.trim() || selectedModels.length < 2}
            className="w-full bg-primary hover:bg-primary/90"
          >
            Start Discussion
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TopicInput;
