
import React, { useState, useEffect } from "react";
import { AI_MODELS } from "@/config/aiModels";
import TopicInput from "@/components/TopicInput";
import ChatInterface from "@/components/ChatInterface";
import SavedConversations from "@/components/SavedConversations";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getApiKey } from "@/services/openRouterService";
import { SavedConversation } from "@/services/conversationService";
import { toast } from "sonner";

const Index = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [topic, setTopic] = useState("");
  const [selectedModels, setSelectedModels] = useState<string[]>(
    Object.keys(AI_MODELS).slice(0, 3) // Default to first 3 models
  );
  const [showSavedConversations, setShowSavedConversations] = useState(false);
  
  // Try to get API key on component mount
  useEffect(() => {
    async function initializeApiKey() {
      try {
        setIsLoading(true);
        const key = await getApiKey();
        if (key) {
          setApiKey(key);
          console.log("Successfully retrieved API key");
        } else {
          console.error("Failed to retrieve API key - no key returned");
          toast.error("Failed to connect to OpenRouter API. Please check Supabase Edge Function logs.");
        }
      } catch (error) {
        console.error("Failed to get API key:", error);
        toast.error(`API key error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    }
    
    initializeApiKey();
  }, []);
  
  const handleStartDiscussion = (newTopic: string, models: string[]) => {
    setTopic(newTopic);
    setSelectedModels(models);
    setShowSavedConversations(false);
  };
  
  const handleReset = () => {
    setTopic("");
    setShowSavedConversations(false);
  };

  const handleLoadConversation = (conversation: SavedConversation) => {
    setTopic(conversation.topic);
    setSelectedModels(conversation.selectedModels);
    setShowSavedConversations(false);
  };

  const handleToggleSavedConversations = () => {
    setShowSavedConversations(prev => !prev);
  };

  // Show loading spinner while checking for API key
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to OpenRouter API...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-indigo-50">
      <header className="py-6 px-4 text-center">
        <h1 className="text-3xl font-bold text-gray-900">AI Conversation Banter</h1>
        <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
          Watch AI models discuss topics with distinct personalities, or join the conversation yourself
        </p>
      </header>
      
      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 pb-10">
        {!topic ? (
          <div className="flex flex-col space-y-4">
            <TopicInput 
              onStartDiscussion={handleStartDiscussion}
              initialSelectedModels={selectedModels}
            />
            <div className="text-center">
              <Button
                variant="outline"
                onClick={handleToggleSavedConversations}
                className="mx-auto"
              >
                View Saved Conversations
              </Button>
            </div>
          </div>
        ) : showSavedConversations ? (
          <div className="rounded-xl overflow-hidden shadow-lg flex flex-col">
            <div className="bg-primary/10 px-4 py-3 border-b border-gray-100 flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleSavedConversations}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <h3 className="font-medium text-gray-800">Saved Conversations</h3>
            </div>
            <div className="p-4">
              <SavedConversations onLoadConversation={handleLoadConversation} />
            </div>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden shadow-lg h-[600px] flex flex-col">
            <div className="bg-primary/10 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-medium text-gray-800">
                  Discussion: <span className="text-primary">{topic}</span>
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedModels.length} AI models participating
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleSavedConversations}
              >
                Saved Chats
              </Button>
            </div>
            <ChatInterface
              topic={topic}
              selectedModels={selectedModels}
              apiKey={apiKey}
              onReset={handleReset}
            />
          </div>
        )}
      </main>
      
      <footer className="py-4 px-4 text-center text-gray-500 text-sm">
        <p>Designed and built with precision and simplicity in mind.</p>
      </footer>
      
      <Toaster position="top-center" />
    </div>
  );
};

export default Index;
