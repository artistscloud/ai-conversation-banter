
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Key } from "lucide-react";

interface ApiKeyInputProps {
  onApiKeySubmit: (apiKey: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeySubmit }) => {
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!apiKey) return;
    
    setIsSubmitting(true);
    
    // Simulate validation
    setTimeout(() => {
      onApiKeySubmit(apiKey);
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="glass-card p-6 rounded-xl space-y-6 shadow-lg animate-fade-in">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Key className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Enter OpenRouter API Key</h2>
          <p className="text-sm text-gray-500 mt-1">
            Required to connect to AI models via OpenRouter
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-..."
              className="glass-input text-base"
              onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
            />
            <p className="text-xs text-gray-500">
              Your API key is only stored in your browser's memory and never sent to our servers.
            </p>
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={!apiKey.trim() || isSubmitting}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? "Validating..." : "Continue"}
          </Button>
          
          <div className="text-xs text-center text-gray-500">
            <a 
              href="https://openrouter.ai/keys" 
              target="_blank" 
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              Get an OpenRouter API key
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyInput;
