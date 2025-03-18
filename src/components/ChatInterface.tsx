
import React, { useState, useRef, useEffect } from "react";
import { AIModel, AI_MODELS } from "@/config/aiModels";
import { generateResponse, Message } from "@/services/openRouterService";
import MessageBubble from "./MessageBubble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Play, Pause, Download, Send, X } from "lucide-react";

interface ChatInterfaceProps {
  topic: string;
  selectedModels: string[];
  apiKey: string;
  onReset: () => void;
}

interface ChatMessage extends Message {
  modelId?: string;
  animationComplete?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  topic,
  selectedModels,
  apiKey,
  onReset
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userInput, setUserInput] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const currentDiscussionRef = useRef<boolean>(true);

  // Initialize the conversation with a topic
  useEffect(() => {
    if (topic && selectedModels.length >= 2) {
      const initialMessage: ChatMessage = {
        role: "user",
        content: `The topic for discussion is: "${topic}"`,
      };
      setMessages([initialMessage]);
      startGeneratingResponses();
    }
    
    return () => {
      currentDiscussionRef.current = false;
    };
  }, [topic, selectedModels, apiKey]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const startGeneratingResponses = async () => {
    setIsGenerating(true);
    currentDiscussionRef.current = true;

    while (currentDiscussionRef.current && !isPaused) {
      for (const modelId of selectedModels) {
        if (!currentDiscussionRef.current || isPaused) break;

        try {
          const model = AI_MODELS[modelId];
          
          // Prepare the conversation history for context
          const historyMessages = messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            name: msg.name
          }));

          // Generate response from the model
          const response = await generateResponse(model, historyMessages, apiKey);
          
          // Add the response to messages
          const newMessage: ChatMessage = {
            role: "assistant",
            content: response,
            name: model.name,
            modelId: model.id
          };
          
          setMessages(prev => [...prev, newMessage]);
          
          // Add a small delay between responses
          await new Promise(resolve => setTimeout(resolve, 800));
        } catch (error) {
          console.error(`Error generating response for ${modelId}:`, error);
          
          // Only log the error, don't break the conversation
          toast.error(`Error with ${AI_MODELS[modelId].name}'s response`);
        }
      }
    }
    
    setIsGenerating(false);
  };

  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      startGeneratingResponses();
    } else {
      setIsPaused(true);
    }
  };

  const handleUserInput = async () => {
    if (!userInput.trim()) return;
    
    // Pause ongoing generation if any
    setIsPaused(true);
    
    // Add user message
    const userMessage: ChatMessage = {
      role: "user",
      content: userInput,
      name: "You"
    };
    
    setMessages(prev => [...prev, userMessage]);
    setUserInput("");
    
    // Resume generation after a small delay
    setTimeout(() => {
      setIsPaused(false);
      startGeneratingResponses();
    }, 500);
  };

  const downloadTranscript = () => {
    // Create a formatted transcript
    let transcript = `# AI Models Discussion: ${topic}\n\nDate: ${new Date().toLocaleString()}\n\n`;
    
    messages.forEach(msg => {
      const namePrefix = msg.role === "user" ? "You" : msg.name;
      transcript += `## ${namePrefix}\n\n${msg.content}\n\n`;
    });
    
    // Create download link
    const blob = new Blob([transcript], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-discussion-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Transcript downloaded successfully");
  };

  // Function to determine if this message should be on the left or right
  const getMessagePosition = (index: number, message: ChatMessage): "left" | "right" => {
    if (message.role === "user") return "right";
    
    // Alternate AI messages left and right for better visual flow
    const aiMessageIndex = messages
      .filter(m => m.role === "assistant" && m.modelId)
      .findIndex(m => m.modelId === message.modelId);
      
    return aiMessageIndex % 2 === 0 ? "left" : "right";
  };

  // Function to get color for a message
  const getMessageColor = (message: ChatMessage): string => {
    if (message.role === "user") return "#4CAF50";
    return message.modelId ? AI_MODELS[message.modelId].color : "#888888";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages container */}
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
      
      {/* Controls */}
      <div className="p-4 border-t border-gray-100 glass-card rounded-b-xl space-y-3">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={togglePause}
            className={cn(
              "flex-1",
              isPaused ? "bg-green-50 hover:bg-green-100 text-green-700" : "bg-amber-50 hover:bg-amber-100 text-amber-700"
            )}
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4 mr-1" /> Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-1" /> Pause
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTranscript}
            className="flex-1 bg-violet-50 hover:bg-violet-100 text-violet-700"
          >
            <Download className="h-4 w-4 mr-1" /> Download
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700"
          >
            <X className="h-4 w-4 mr-1" /> Reset
          </Button>
        </div>
        
        {/* User input */}
        <div className="flex gap-2">
          <Input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleUserInput()}
            placeholder="Join the conversation..."
            className="glass-input text-base"
          />
          <Button
            onClick={handleUserInput}
            disabled={!userInput.trim()}
            className="bg-primary text-white hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
