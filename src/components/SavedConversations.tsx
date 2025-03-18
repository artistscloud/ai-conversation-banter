
import React, { useEffect, useState } from "react";
import { 
  getSavedConversations, 
  deleteConversation,
  SavedConversation
} from "@/services/conversationService";
import { Button } from "./ui/button";
import { Trash2, ArrowRight, Clock } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "./ui/scroll-area";

interface SavedConversationsProps {
  onLoadConversation: (conversation: SavedConversation) => void;
}

const SavedConversations: React.FC<SavedConversationsProps> = ({ 
  onLoadConversation 
}) => {
  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load saved conversations when component mounts
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const saved = await getSavedConversations();
      setConversations(saved.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (err) {
      console.error("Failed to load conversations:", err);
      setError("Failed to load conversations. Please try again.");
      toast.error("Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const success = await deleteConversation(id);
      if (success) {
        toast.success("Conversation deleted");
        loadConversations();
      } else {
        toast.error("Failed to delete conversation");
      }
    } catch (err) {
      console.error("Error deleting conversation:", err);
      toast.error("Failed to delete conversation");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-500">Loading conversations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadConversations} 
          className="mt-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No saved conversations yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-3">
        {conversations.map((conv) => (
          <div 
            key={conv.id}
            onClick={() => onLoadConversation(conv)}
            className="glass-card p-3 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors flex justify-between items-center"
          >
            <div className="flex-1">
              <h3 className="font-medium text-gray-800 truncate">{conv.topic}</h3>
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <Clock className="h-3 w-3 mr-1" />
                <span>{formatDate(conv.createdAt)}</span>
              </div>
              <div className="text-xs text-gray-500">
                {conv.messages.length} messages • {conv.selectedModels.length} models
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => handleDeleteConversation(conv.id, e)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default SavedConversations;
