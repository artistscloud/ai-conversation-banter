
import React from "react";
import { useAIDiscussion } from "@/hooks/useAIDiscussion";
import MessageList from "./chat/MessageList";
import ChatControls from "./chat/ChatControls";
import UserInputForm from "./chat/UserInputForm";
import { AlertTriangle } from "lucide-react";

interface ChatInterfaceProps {
  topic: string;
  selectedModels: string[];
  apiKey: string;
  onReset: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  topic,
  selectedModels,
  apiKey,
  onReset
}) => {
  const {
    messages,
    isPaused,
    isGenerating,
    errors,
    togglePause,
    addUserMessage,
    getMessagePosition,
    getMessageColor
  } = useAIDiscussion(topic, selectedModels, apiKey);

  return (
    <div className="flex flex-col h-full">
      {/* API Key warning if missing */}
      {!apiKey && (
        <div className="bg-amber-50 p-3 mb-2 rounded-lg border border-amber-200 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <p className="text-sm text-amber-800">
            No API key provided. Please go back and enter your OpenRouter API key.
          </p>
        </div>
      )}
      
      {/* Chat messages container */}
      <MessageList 
        messages={messages}
        isGenerating={isGenerating}
        isPaused={isPaused}
        getMessagePosition={getMessagePosition}
        getMessageColor={getMessageColor}
      />
      
      {/* Controls */}
      <div className="p-4 border-t border-gray-100 glass-card rounded-b-xl space-y-3">
        <ChatControls 
          messages={messages}
          isPaused={isPaused}
          topic={topic}
          selectedModels={selectedModels}
          togglePause={togglePause}
          onReset={onReset}
        />
        
        {/* User input */}
        <UserInputForm onSendMessage={addUserMessage} />
      </div>
    </div>
  );
};

export default ChatInterface;
