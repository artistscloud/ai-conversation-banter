
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Key } from "lucide-react";
import { toast } from "sonner";
import { storeApiKey, getApiKey } from "@/services/openRouterService";

interface ApiKeyInputProps {
  onApiKeySubmit: (apiKey: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeySubmit }) => {
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // On component mount, check for API key from various sources
  useEffect(() => {
    async function checkForApiKey() {
      setIsLoading(true);
      try {
        // Try to get key from Supabase or localStorage
        const key = await getApiKey();
        if (key && key.startsWith('sk-or-')) {
          onApiKeySubmit(key);
          return;
        }
      } catch (error) {
        console.error("Error fetching API key:", error);
        // If we couldn't get a key from Supabase, check URL params
        const urlParams = new URLSearchParams(window.location.search);
        const keyFromUrl = urlParams.get('key');
        
        if (keyFromUrl && keyFromUrl.startsWith('sk-or-')) {
          setApiKey(keyFromUrl);
          storeApiKey(keyFromUrl);
          onApiKeySubmit(keyFromUrl);
          // Clean the URL without refreshing the page
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }
      } finally {
        setIsLoading(false);
      }
    }
    
    checkForApiKey();
  }, [onApiKeySubmit]);

  const handleSubmit = () => {
    if (!apiKey) return;
    
    setIsSubmitting(true);
    
    // Validate API key format
    if (!apiKey.startsWith('sk-or-')) {
      toast.error("Invalid API key format. OpenRouter keys should start with 'sk-or-'");
      setIsSubmitting(false);
      return;
    }
    
    // Store the API key in localStorage
    storeApiKey(apiKey);
    
    // Pass it to the parent component
    setTimeout(() => {
      onApiKeySubmit(apiKey);
      toast.success("API key accepted");
      setIsSubmitting(false);
    }, 600);
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto">
        <div className="glass-card p-6 rounded-xl space-y-6 shadow-lg animate-fade-in">
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Key className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Connecting to OpenRouter</h2>
            <p className="text-sm text-gray-500 mt-1">
              Retrieving API key from server...
            </p>
          </div>
        </div>
      </div>
    );
  }

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
