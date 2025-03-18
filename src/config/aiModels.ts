
export interface AIModel {
  id: string;
  name: string;
  personality: string;
  color: string;
  modelId: string;
}

export const AI_MODELS: Record<string, AIModel> = {
  claude: {
    id: "claude",
    name: "Claude",
    personality: "analytical and precise, often citing research",
    color: "#0066CC",
    modelId: "anthropic/claude-3-opus"
  },
  grok: {
    id: "grok",
    name: "Grok",
    personality: "witty and sarcastic, with pop culture references",
    color: "#FF4444",
    modelId: "x-ai/grok-2-1212"
  },
  chatgpt: {
    id: "chatgpt",
    name: "ChatGPT",
    personality: "helpful and balanced, diplomatic in discussions",
    color: "#10A37F",
    modelId: "openai/gpt-4o-mini"
  },
  gemini: {
    id: "gemini",
    name: "Gemini",
    personality: "creative and imaginative, thinks outside the box",
    color: "#8E44AD",
    modelId: "google/gemini-2.0-flash-001"
  },
  llama: {
    id: "llama",
    name: "Llama",
    personality: "direct and practical, focused on real-world applications",
    color: "#FFA500",
    modelId: "meta-llama/llama-3.3-70b-instruct:free"
  },
  mistral: {
    id: "mistral",
    name: "Mistral",
    personality: "technically focused, emphasizes efficiency",
    color: "#4169E1",
    modelId: "mistralai/mistral-small-3.1-24b-instruct-2503"
  },
  nova: {
    id: "nova",
    name: "Nova",
    personality: "enthusiastic and optimistic, enjoys exploring new ideas",
    color: "#FF1493",
    modelId: "cohere/command-r-plus"
  }
};
