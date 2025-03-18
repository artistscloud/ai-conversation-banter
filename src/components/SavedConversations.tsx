
import React, { useEffect, useState } from "react";
import { 
  getSavedConversations, 
  SavedConversation,
  deleteConversation 
} from "@/hooks/useAIDiscussion";
import { Button } from "./ui/button";
import { Trash2, ArrowRight, Clock } from "lucide-react";
import { toast } from "sonner";

interface SavedConversationsProps {
  onLoadConversation: (conversation: SavedConversation) => void;
}

const SavedConversations: React.FC<SavedConversationsProps> = ({ 
  onLoadConversation 
}) => {
  const [conversations, setConversations] = useState<SavedConversation[]>([]);

  // Load saved conversations when component mounts
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = () => {
    const saved = getSavedConversations();
    setConversations(saved.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation(id);
    toast.success("Conversation deleted");
    loadConversations();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (conversations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No saved conversations yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
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
  );
};

export default SavedConversations;
