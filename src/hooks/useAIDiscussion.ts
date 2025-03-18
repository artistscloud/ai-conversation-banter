
import { useState, useRef, useEffect } from "react";
import { AIModel, AI_MODELS } from "@/config/aiModels";
import { generateResponse, Message } from "@/services/openRouterService";
import { toast } from "sonner";

export interface ChatMessage extends Message {
  modelId?: string;
  animationComplete?: boolean;
}

export interface SavedConversation {
  id: string;
  topic: string;
  messages: ChatMessage[];
  selectedModels: string[];
  createdAt: string;
}

// Function to save the current conversation to localStorage
export const saveConversation = (
  topic: string,
  messages: ChatMessage[],
  selectedModels: string[]
): string => {
  try {
    // Create a unique ID for this conversation
    const conversationId = `conversation_${Date.now()}`;
    
    const savedConversation: SavedConversation = {
      id: conversationId,
      topic,
      messages,
      selectedModels,
      createdAt: new Date().toISOString(),
    };
    
    // Get existing conversations or initialize empty array
    const savedConversations = getSavedConversations();
    
    // Add this conversation and save back to localStorage
    localStorage.setItem(
      "aiConversations", 
      JSON.stringify([...savedConversations, savedConversation])
    );
    
    return conversationId;
  } catch (error) {
    console.error("Error saving conversation:", error);
    toast.error("Failed to save conversation");
    return "";
  }
};

// Function to get all saved conversations
export const getSavedConversations = (): SavedConversation[] => {
  try {
    const saved = localStorage.getItem("aiConversations");
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Error loading conversations:", error);
    return [];
  }
};

// Function to load a specific conversation
export const loadConversation = (id: string): SavedConversation | null => {
  try {
    const conversations = getSavedConversations();
    return conversations.find(conv => conv.id === id) || null;
  } catch (error) {
    console.error("Error loading conversation:", error);
    return null;
  }
};

// Function to delete a conversation
export const deleteConversation = (id: string): boolean => {
  try {
    const conversations = getSavedConversations();
    const filtered = conversations.filter(conv => conv.id !== id);
    localStorage.setItem("aiConversations", JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return false;
  }
};

export function useAIDiscussion(
  topic: string,
  selectedModels: string[],
  apiKey: string
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const currentDiscussionRef = useRef<boolean>(true);
  const generationLoopRef = useRef<any>(null);

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
      const id = saveConversation(topic, messages, selectedModels);
      if (id && !conversationId) {
        setConversationId(id);
      }
    }
  }, [messages, topic, selectedModels]);

  const startGeneratingResponses = async () => {
    if (isGenerating) return; // Prevent multiple instances
    
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
          
          // Generate response from the model
          const response = await generateResponse(model, historyMessages, apiKey);
          
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
          
          // Add a small delay between responses
          await new Promise(resolve => setTimeout(resolve, 800));
          
          if (!currentDiscussionRef.current || isPaused) {
            setIsGenerating(false);
            return;
          }
        } catch (error) {
          console.error(`Error generating response for ${modelId}:`, error);
          toast.error(`Error with ${AI_MODELS[modelId].name}'s response`);
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
    conversationId,
    togglePause,
    addUserMessage,
    getMessagePosition,
    getMessageColor
  };
}
