import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/hooks/useAIDiscussion";

export interface SavedConversation {
  id: string;
  topic: string;
  messages: ChatMessage[];
  selectedModels: string[];
  createdAt: string;
}

// Save conversation to Supabase
export const saveConversation = async (
  topic: string,
  messages: ChatMessage[],
  selectedModels: string[]
): Promise<string> => {
  try {
    // Check if we already have a conversation with this topic
    // in localStorage to maintain backwards compatibility
    const existingConvs = localStorage.getItem("aiConversations");
    let existingId = "";
    
    if (existingConvs) {
      const conversations = JSON.parse(existingConvs) as SavedConversation[];
      const existing = conversations.find(c => c.topic === topic);
      if (existing) {
        existingId = existing.id;
      }
    }
    
    // Insert into Supabase
    const { data, error } = await supabase
      .from('ai_conversations')
      .upsert({
        id: existingId || undefined,
        topic,
        messages,
        selected_models: selectedModels,
        created_at: new Date().toISOString(),
        is_public: false
      })
      .select('id')
      .single();
    
    if (error) {
      console.error("Error saving conversation to Supabase:", error);
      // Fallback to localStorage if Supabase fails
      return saveToLocalStorage(topic, messages, selectedModels, existingId);
    }
    
    console.log("Conversation saved to Supabase:", data);
    return data.id;
  } catch (error) {
    console.error("Error saving conversation:", error);
    // Fallback to localStorage if Supabase fails
    return saveToLocalStorage(topic, messages, selectedModels);
  }
};

// Fallback function to save to localStorage
const saveToLocalStorage = (
  topic: string,
  messages: ChatMessage[],
  selectedModels: string[],
  existingId?: string
): string => {
  try {
    // Create a unique ID for this conversation
    const conversationId = existingId || `conversation_${Date.now()}`;
    
    const savedConversation: SavedConversation = {
      id: conversationId,
      topic,
      messages,
      selectedModels,
      createdAt: new Date().toISOString(),
    };
    
    // Get existing conversations or initialize empty array
    const savedConversations = getSavedConversationsFromLocalStorage();
    
    // Filter out the conversation if it exists already
    const filteredConversations = savedConversations.filter(
      conv => conv.id !== conversationId
    );
    
    // Add this conversation and save back to localStorage
    localStorage.setItem(
      "aiConversations", 
      JSON.stringify([...filteredConversations, savedConversation])
    );
    
    return conversationId;
  } catch (error) {
    console.error("Error saving conversation to localStorage:", error);
    return "";
  }
};

// Get saved conversations from Supabase
export const getSavedConversations = async (): Promise<SavedConversation[]> => {
  try {
    // First try to get from Supabase
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching conversations from Supabase:", error);
      // Fallback to localStorage
      return getSavedConversationsFromLocalStorage();
    }
    
    // Format the data to match our SavedConversation interface
    const conversations = data.map(conv => ({
      id: conv.id,
      topic: conv.topic,
      messages: conv.messages,
      selectedModels: conv.selected_models,
      createdAt: conv.created_at
    }));
    
    console.log("Fetched conversations from Supabase:", conversations.length);
    
    // Merge with localStorage data for backwards compatibility
    const localConversations = getSavedConversationsFromLocalStorage();
    const localIds = new Set(localConversations.map(c => c.id));
    
    // Only add local conversations that aren't already in Supabase
    const mergedConversations = [
      ...conversations,
      ...localConversations.filter(c => !c.id.includes('-') && !localIds.has(c.id))
    ];
    
    return mergedConversations;
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return getSavedConversationsFromLocalStorage();
  }
};

// Helper function to get saved conversations from localStorage
const getSavedConversationsFromLocalStorage = (): SavedConversation[] => {
  try {
    const saved = localStorage.getItem("aiConversations");
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Error loading conversations from localStorage:", error);
    return [];
  }
};

// Load a specific conversation
export const loadConversation = async (id: string): Promise<SavedConversation | null> => {
  try {
    // Try to fetch from Supabase first
    if (id.includes('-')) {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error("Error loading conversation from Supabase:", error);
      } else if (data) {
        return {
          id: data.id,
          topic: data.topic,
          messages: data.messages,
          selectedModels: data.selected_models,
          createdAt: data.created_at
        };
      }
    }
    
    // Fallback to localStorage
    const conversations = getSavedConversationsFromLocalStorage();
    return conversations.find(conv => conv.id === id) || null;
  } catch (error) {
    console.error("Error loading conversation:", error);
    return null;
  }
};

// Delete a conversation
export const deleteConversation = async (id: string): Promise<boolean> => {
  try {
    // If it's a UUID, delete from Supabase
    if (id.includes('-')) {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error("Error deleting conversation from Supabase:", error);
        // Try localStorage as fallback
        return deleteFromLocalStorage(id);
      }
      
      console.log("Conversation deleted from Supabase:", id);
      return true;
    }
    
    // Otherwise delete from localStorage
    return deleteFromLocalStorage(id);
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return false;
  }
};

// Helper function to delete conversation from localStorage
const deleteFromLocalStorage = (id: string): boolean => {
  try {
    const conversations = getSavedConversationsFromLocalStorage();
    const filtered = conversations.filter(conv => conv.id !== id);
    localStorage.setItem("aiConversations", JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Error deleting conversation from localStorage:", error);
    return false;
  }
};
