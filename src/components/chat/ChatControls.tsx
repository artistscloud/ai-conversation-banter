
import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Play, Pause, Download, X } from "lucide-react";
import { toast } from "sonner";
import { ChatMessage } from "@/hooks/useAIDiscussion";

interface ChatControlsProps {
  messages: ChatMessage[];
  isPaused: boolean;
  togglePause: () => void;
  onReset: () => void;
}

const ChatControls: React.FC<ChatControlsProps> = ({
  messages,
  isPaused,
  togglePause,
  onReset
}) => {
  const downloadTranscript = () => {
    // Create a formatted transcript
    let transcript = `# AI Models Discussion\n\nDate: ${new Date().toLocaleString()}\n\n`;
    
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

  return (
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
  );
};

export default ChatControls;
