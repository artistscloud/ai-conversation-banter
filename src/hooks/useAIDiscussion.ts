
import { useState, useRef, useEffect } from "react";
import { AIModel, AI_MODELS } from "@/config/aiModels";
import { generateResponse, Message } from "@/services/openRouterService";
import { saveConversation } from "@/services/conversationService"; 
import { toast } from "sonner";

export interface ChatMessage extends Message {
  modelId?: string;
  animationComplete?: boolean;
}

export function useAIDiscussion(
  topic: string,
  selectedModels: string[],
  apiKey: string
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const currentDiscussionRef = useRef<boolean>(true);
  const generationLoopRef = useRef<any>(null);

  // Get the effective API key (provided or from localStorage)
  const getEffectiveApiKey = (): string => {
    return apiKey || localStorage.getItem("openrouter_api_key") || "";
  };

  // Initialize the conversation with a topic
  useEffect(() => {
    if (topic && selectedModels.length >= 2) {
      const initialMessage: ChatMessage = {
        role: "user",
        content: `The topic for discussion is: "${topic}"`,
      };
      setMessages([initialMessage]);
      
      // Small delay to ensure state is updated before generating responses
      setTimeout(() => {
        startGeneratingResponses();
      }, 100);
    }
    
    return () => {
      // Auto-save conversation when component unmounts
      if (messages.length > 1 && topic) {
        saveConversation(topic, messages, selectedModels);
      }
      
      currentDiscussionRef.current = false;
      if (generationLoopRef.current) {
        clearTimeout(generationLoopRef.current);
      }
    };
  }, [topic, selectedModels, apiKey]);

  // Auto-save conversation when messages change
  useEffect(() => {
    if (messages.length > 1 && topic) {
      saveConversation(topic, messages, selectedModels);
    }
  }, [messages, topic, selectedModels]);

  // Validate API key
  useEffect(() => {
    const effectiveApiKey = getEffectiveApiKey();
    if (!effectiveApiKey) {
      toast.error("OpenRouter API key is missing. Please provide a valid API key.");
      setIsPaused(true);
    } else if (!effectiveApiKey.startsWith('sk-or-')) {
      toast.error("Invalid OpenRouter API key format. Should start with 'sk-or-'");
      setIsPaused(true);
    }
  }, [apiKey]);

  const startGeneratingResponses = async () => {
    if (isGenerating) return; // Prevent multiple instances
    
    const effectiveApiKey = getEffectiveApiKey();
    if (!effectiveApiKey || !effectiveApiKey.startsWith('sk-or-')) {
      toast.error("OpenRouter API key is missing or invalid. Please provide a valid API key.");
      setIsPaused(true);
      return;
    }
    
    setIsGenerating(true);
    currentDiscussionRef.current = true;
    
    const generateCycle = async () => {
      if (!currentDiscussionRef.current || isPaused) {
        setIsGenerating(false);
        return;
      }
      
      for (const modelId of selectedModels) {
        if (!currentDiscussionRef.current || isPaused) {
          setIsGenerating(false);
          return;
        }

        try {
          const model = AI_MODELS[modelId];
          
          // Prepare the conversation history for context
          const historyMessages = messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            name: msg.name
          }));

          console.log(`Generating response for ${model.name} using model ${model.modelId}`);
          
          // Use the effective API key
          const response = await generateResponse(model, historyMessages, effectiveApiKey);
          
          if (!currentDiscussionRef.current || isPaused) {
            setIsGenerating(false);
            return;
          }
          
          // Add the response to messages
          const newMessage: ChatMessage = {
            role: "assistant",
            content: response,
            name: model.name,
            modelId: model.id
          };
          
          setMessages(prev => [...prev, newMessage]);
          
          // Clear any previous error for this model
          if (errors[modelId]) {
            setErrors(prev => {
              const updated = {...prev};
              delete updated[modelId];
              return updated;
            });
          }
          
          // Add a small delay between responses
          await new Promise(resolve => setTimeout(resolve, 800));
          
          if (!currentDiscussionRef.current || isPaused) {
            setIsGenerating(false);
            return;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Error generating response for ${modelId}:`, error);
          
          // Store the error for this model
          setErrors(prev => ({
            ...prev,
            [modelId]: errorMessage
          }));
          
          // Show toast with specific model error
          toast.error(`Error with ${AI_MODELS[modelId].name}: ${errorMessage}`);
          
          // Add error message as a system message
          const errorMsg: ChatMessage = {
            role: "system",
            content: `Error with ${AI_MODELS[modelId].name}'s response: ${errorMessage}`,
            modelId: modelId
          };
          
          setMessages(prev => [...prev, errorMsg]);
          
          // Add a small delay between responses
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }
      
      // Continue the loop after all models have responded
      if (currentDiscussionRef.current && !isPaused) {
        generationLoopRef.current = setTimeout(generateCycle, 1000);
      } else {
        setIsGenerating(false);
      }
    };
    
    // Start the generation cycle
    await generateCycle();
  };

  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      startGeneratingResponses();
    } else {
      setIsPaused(true);
    }
  };

  const addUserMessage = async (userInput: string) => {
    if (!userInput.trim()) return;
    
    // Pause ongoing generation if any
    setIsPaused(true);
    if (generationLoopRef.current) {
      clearTimeout(generationLoopRef.current);
    }
    
    // Add user message
    const userMessage: ChatMessage = {
      role: "user",
      content: userInput,
      name: "You"
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Resume generation after a small delay
    setTimeout(() => {
      setIsPaused(false);
      startGeneratingResponses();
    }, 500);
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

  return {
    messages,
    isPaused,
    isGenerating,
    errors,
    togglePause,
    addUserMessage,
    getMessagePosition,
    getMessageColor
  };
}
