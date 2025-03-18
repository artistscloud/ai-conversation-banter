
import React from "react";
import { cn } from "@/lib/utils";
import { marked } from "marked";

interface MessageBubbleProps {
  role: string;
  name: string;
  content: string;
  color: string;
  position: "left" | "right";
  index: number;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  role,
  name,
  content,
  color,
  position,
  index
}) => {
  // Parse markdown content
  const parsedContent = React.useMemo(() => {
    return { __html: marked(content, { breaks: true }) };
  }, [content]);

  return (
    <div
      className={cn(
        "message-transition w-full max-w-[85%] mb-4",
        position === "left" ? "self-start animate-slide-in-left" : "self-end animate-slide-in-right",
        `message-${role}`
      )}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="flex items-center mb-1">
        <div
          className="w-6 h-6 rounded-full mr-2 flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: color }}
        >
          {name.charAt(0)}
        </div>
        <span className="font-medium text-sm" style={{ color }}>
          {name}
        </span>
      </div>
      <div 
        className={cn(
          "p-4 rounded-xl shadow-sm",
          position === "left" ? "rounded-tl-none" : "rounded-tr-none"
        )}
      >
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={parsedContent}
        />
      </div>
    </div>
  );
};

export default MessageBubble;
