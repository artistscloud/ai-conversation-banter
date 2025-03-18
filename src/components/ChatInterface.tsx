
import React from "react";
import { useAIDiscussion } from "@/hooks/useAIDiscussion";
import MessageList from "./chat/MessageList";
import ChatControls from "./chat/ChatControls";
import UserInputForm from "./chat/UserInputForm";

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
    togglePause,
    addUserMessage,
    getMessagePosition,
    getMessageColor
  } = useAIDiscussion(topic, selectedModels, apiKey);

  return (
    <div className="flex flex-col h-full">
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
