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
  const [isReady, setIsReady] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const currentDiscussionRef = useRef<boolean>(true);
  const generationLoopRef = useRef<any>(null);

  const getEffectiveApiKey = (): string => {
    return apiKey || localStorage.getItem("openrouter_api_key") || "";
  };

  useEffect(() => {
    console.log("useEffect triggered with topic:", topic, "selectedModels:", selectedModels);
    // Ensure topic and selectedModels are arrays and have enough models
    const effectiveTopic = topic || "General Discussion";
    const effectiveModels = Array.isArray(selectedModels) && selectedModels.length >= 2 
      ? selectedModels 
      : Object.keys(AI_MODELS).slice(0, 2);

    const initialMessage: ChatMessage = {
      role: "user",
      content: `The topic for discussion is: "${effectiveTopic}"`,
      name: "You"
    };
    setMessages(prevMessages => {
      const newMessages = [initialMessage, ...prevMessages];
      console.log("Initial messages set:", newMessages);
      setIsReady(true);
      return newMessages;
    });

    return () => {
      if (messages.length > 1 && effectiveTopic) {
        saveConversation(effectiveTopic, messages, effectiveModels);
      }
      currentDiscussionRef.current = false;
      if (generationLoopRef.current) {
        clearTimeout(generationLoopRef.current);
      }
    };
  }, [topic, selectedModels, apiKey]);

  useEffect(() => {
    if (isReady && !isGenerating) {
      console.log("isReady triggered, starting generation with messages:", messages);
      startGeneratingResponses();
    }
  }, [isReady]);

  useEffect(() => {
    if (messages.length > 1 && topic) {
      saveConversation(topic || "General Discussion", messages, selectedModels || Object.keys(AI_MODELS).slice(0, 2));
    }
  }, [messages, topic, selectedModels]);

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
    if (isGenerating || !isReady) return;

    const effectiveApiKey = getEffectiveApiKey();
    if (!effectiveApiKey || !effectiveApiKey.startsWith('sk-or-')) {
      toast.error("OpenRouter API key is missing or invalid. Please provide a valid API key.");
      setIsPaused(true);
      return;
    }

    setIsGenerating(true);
    currentDiscussionRef.current = true;

    console.log("Starting generation with messages:", messages);
    if (!messages.some(msg => msg.role === "user")) {
      const initialMessage: ChatMessage = {
        role: "user",
        content: `The topic for discussion is: "${topic || 'general banter'}"`,
        name: "You"
      };
      setMessages(prev => {
        const newMessages = [initialMessage, ...prev];
        console.log("Fallback messages set:", newMessages);
        return newMessages;
      });
      await new Promise(resolve => setTimeout(resolve, 200));
    }

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
          const historyMessages = messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            name: msg.name || (msg.role === "user" ? "You" : undefined)
          }));

          console.log(`Generating response for ${model.name} with messages:`, JSON.stringify(historyMessages, null, 2));
          const response = await generateResponse(model, historyMessages, effectiveApiKey);

          if (!currentDiscussionRef.current || isPaused) {
            setIsGenerating(false);
            return;
          }

          const newMessage: ChatMessage = {
            role: "assistant",
            content: response,
            name: model.name,
            modelId: model.id
          };

          setMessages(prev => [...prev, newMessage]);

          if (errors[modelId]) {
            setErrors(prev => {
              const updated = { ...prev };
              delete updated[modelId];
              return updated;
            });
          }

          await new Promise(resolve => setTimeout(resolve, 800));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Error generating response for ${modelId}:`, error);
          setErrors(prev => ({
            ...prev,
            [modelId]: errorMessage
          }));
          toast.error(`Error with ${AI_MODELS[modelId].name}: ${errorMessage}`);
          const errorMsg: ChatMessage = {
            role: "system",
            content: `Error with ${AI_MODELS[modelId].name}'s response: ${errorMessage}`,
            modelId: modelId
          };
          setMessages(prev => [...prev, errorMsg]);
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }

      if (currentDiscussionRef.current && !isPaused) {
        generationLoopRef.current = setTimeout(generateCycle, 1000);
      } else {
        setIsGenerating(false);
      }
    };

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

    setIsPaused(true);
    if (generationLoopRef.current) {
      clearTimeout(generationLoopRef.current);
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: userInput,
      name: "You"
    };

    setMessages(prev => [...prev, userMessage]);

    setTimeout(() => {
      setIsPaused(false);
      startGeneratingResponses();
    }, 500);
  };

  const getMessagePosition = (index: number, message: ChatMessage): "left" | "right" => {
    if (message.role === "user") return "right";
    const aiMessageIndex = messages
      .filter(m => m.role === "assistant" && m.modelId)
      .findIndex(m => m.modelId === message.modelId);
    return aiMessageIndex % 2 === 0 ? "left" : "right";
  };

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
