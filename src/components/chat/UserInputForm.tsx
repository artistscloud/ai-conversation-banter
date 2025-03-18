
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface UserInputFormProps {
  onSendMessage: (message: string) => void;
}

const UserInputForm: React.FC<UserInputFormProps> = ({ onSendMessage }) => {
  const [userInput, setUserInput] = useState("");

  const handleSubmit = () => {
    if (!userInput.trim()) return;
    onSendMessage(userInput);
    setUserInput("");
  };

  return (
    <div className="flex gap-2">
      <Input
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
        placeholder="Join the conversation..."
        className="glass-input text-base"
      />
      <Button
        onClick={handleSubmit}
        disabled={!userInput.trim()}
        className="bg-primary text-white hover:bg-primary/90"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default UserInputForm;
