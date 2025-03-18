import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/hooks/useAIDiscussion";
import { Json } from "@/integrations/supabase/types";

export interface SavedConversation {
  id: string;
  topic: string;
  messages: ChatMessage[];
  selectedModels: string[];
  createdAt: string;
}

// Helper function to convert ChatMessage[] to Json for Supabase storage
const convertMessagesToJson = (messages: ChatMessage[]): Json => {
  return messages as unknown as Json;
};

// Helper function to convert Json back to ChatMessage[] when retrieving from Supabase
const convertJsonToMessages = (json: Json): ChatMessage[] => {
  return json as unknown as ChatMessage[];
};

// Save conversation to Supabase
export const saveConversation = async (
  topic: string,
  messages: ChatMessage[],
  selectedModels: string[]
): Promise<string> => {
  try {
    // Check if we already have a conversation with this topic in localStorage
    const existingConvs = localStorage.getItem("aiConversations");
    let existingId = "";

    if (existingConvs) {
      const conversations = JSON.parse(existingConvs) as SavedConversation[];
      const existing = conversations.find(c => c.topic === topic);
      if (existing) {
        existingId = existing.id;
      }
    }

    // Insert into Supabase with a proper UUID if no existing ID
    const { data, error } = await supabase
      .from('ai_conversations')
      .upsert({
        id: existingId || crypto.randomUUID(), // Generate UUID for new entries
        topic,
        messages: convertMessagesToJson(messages),
        selected_models: selectedModels,
        created_at: new Date().toISOString(),
        is_public: false
      })
      .select('id')
      .single();

    if (error) {
      console.error("Error saving conversation to Supabase:", error.message, error.details);
      if (error.code === '42501') {
        console.warn("Permission denied - check Supabase anon key or RLS policies");
      }
      // Fallback to localStorage if Supabase fails
      return saveToLocalStorage(topic, messages, selectedModels, existingId);
    }

    console.log("Conversation saved to Supabase:", data);
    return data.id;
  } catch (error) {
    console.error("Unexpected error saving conversation:", error);
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
    const conversationId = existingId || crypto.randomUUID(); // Use UUID instead of timestamp
    const savedConversation: SavedConversation = {
      id: conversationId,
      topic,
      messages,
      selectedModels,
      createdAt: new Date().toISOString(),
    };

    const savedConversations = getSavedConversationsFromLocalStorage();
    const filteredConversations = savedConversations.filter(
      conv => conv.id !== conversationId
    );

    localStorage.setItem(
      "aiConversations",
      JSON.stringify([...filteredConversations, savedConversation])
    );

    console.log("Conversation saved to localStorage with ID:", conversationId);
    return conversationId;
  } catch (error) {
    console.error("Error saving conversation to localStorage:", error);
    return "";
  }
};

// Get saved conversations from Supabase
export const getSavedConversations = async (): Promise<SavedConversation[]> => {
  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching conversations from Supabase:", error.message, error.details);
      return getSavedConversationsFromLocalStorage();
    }

    const conversations: SavedConversation[] = data.map(conv => ({
      id: conv.id,
      topic: conv.topic,
      messages: convertJsonToMessages(conv.messages),
      selectedModels: conv.selected_models,
      createdAt: conv.created_at
    }));

    console.log("Fetched conversations from Supabase:", conversations.length);

    const localConversations = getSavedConversationsFromLocalStorage();
    const supabaseIds = new Set(conversations.map(c => c.id));

    const mergedConversations: SavedConversation[] = [
      ...conversations,
      ...localConversations.filter(c => !c.id.includes('-') && !supabaseIds.has(c.id))
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
    if (id.includes('-')) {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error("Error loading conversation from Supabase:", error.message, error.details);
      } else if (data) {
        return {
          id: data.id,
          topic: data.topic,
          messages: convertJsonToMessages(data.messages),
          selectedModels: data.selected_models,
          createdAt: data.created_at
        };
      }
    }

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
    if (id.includes('-')) {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting conversation from Supabase:", error.message, error.details);
        return deleteFromLocalStorage(id);
      }

      console.log("Conversation deleted from Supabase:", id);
      return true;
    }

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
