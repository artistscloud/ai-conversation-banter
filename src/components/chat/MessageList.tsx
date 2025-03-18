
import React, { useRef, useEffect } from "react";
import MessageBubble from "@/components/MessageBubble";
import { ChatMessage } from "@/hooks/useAIDiscussion";

interface MessageListProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  isPaused: boolean;
  getMessagePosition: (index: number, message: ChatMessage) => "left" | "right";
  getMessageColor: (message: ChatMessage) => string;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isGenerating,
  isPaused,
  getMessagePosition,
  getMessageColor
}) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div 
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-2 flex flex-col"
    >
      {messages.map((message, index) => (
        <MessageBubble
          key={index}
          role={message.role === "user" ? "user" : message.modelId || "assistant"}
          name={message.role === "user" ? "You" : message.name || "AI"}
          content={message.content}
          color={getMessageColor(message)}
          position={getMessagePosition(index, message)}
          index={index}
        />
      ))}
      
      {isGenerating && !isPaused && (
        <div className="self-center py-2 px-4 bg-gray-100 rounded-full animate-message-pulse">
          <span className="text-sm text-gray-500">AI models are thinking...</span>
        </div>
      )}
    </div>
  );
};

export default MessageList;
