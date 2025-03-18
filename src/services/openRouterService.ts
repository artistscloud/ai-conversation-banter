
import { AIModel } from "../config/aiModels";
import { supabase } from "@/integrations/supabase/client";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
  name?: string;
}

interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      content: string;
    };
  }[];
}

// Store the API key in localStorage
export const storeApiKey = (apiKey: string): void => {
  localStorage.setItem("openrouter_api_key", apiKey);
};

// Get API key from Supabase Edge Function
export const getApiKey = async (): Promise<string> => {
  // First check localStorage
  const localKey = localStorage.getItem("openrouter_api_key");
  if (localKey && localKey.startsWith('sk-or-')) {
    console.log("Using API key from localStorage");
    return localKey;
  }
  
  // If not in localStorage, try to get from Supabase Edge Function
  try {
    console.log("Fetching API key from Supabase Edge Function");
    const { data, error } = await supabase.functions.invoke('set-openrouter-key');
    
    if (error) {
      console.error('Error fetching API key from Supabase:', error);
      throw new Error('Could not fetch API key from server');
    }
    
    if (data && data.key && data.key.startsWith('sk-or-')) {
      console.log("Successfully retrieved API key from Supabase");
      // Store the key in localStorage for future use
      storeApiKey(data.key);
      return data.key;
    } else {
      console.error('Invalid API key format received from server:', data);
      throw new Error('Invalid API key format received from server');
    }
  } catch (error) {
    console.error('Error fetching API key:', error);
    throw error;
  }
};

export async function generateResponse(
  model: AIModel,
  messages: Message[],
  apiKey?: string
): Promise<string> {
  try {
    // First use provided key, then localStorage, then try to fetch from Supabase
    let effectiveApiKey = apiKey;
    
    if (!effectiveApiKey || !effectiveApiKey.startsWith('sk-or-')) {
      try {
        effectiveApiKey = await getApiKey();
      } catch (error) {
        console.error('Failed to get API key:', error);
        throw new Error('Valid OpenRouter API key is required (should start with sk-or-)');
      }
    }

    // Check if API key is valid
    if (!effectiveApiKey || !effectiveApiKey.startsWith('sk-or-')) {
      console.error('Invalid or missing OpenRouter API key');
      throw new Error('Valid OpenRouter API key is required (should start with sk-or-)');
    }

    const systemPrompt = `You are ${model.name}, an AI model with the following personality: ${model.personality}.
You are participating in a discussion with other AI models.
Respond in character, maintaining your unique perspective and personality.
Keep your response concise (2-3 sentences).
Consider and reference what other AIs have said before you (if applicable).`;

    // Prepare the messages, including the system prompt
    const fullMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    console.log(`Sending request to OpenRouter for model ${model.modelId}`);
    console.log('Request messages:', JSON.stringify(fullMessages, null, 2));

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${effectiveApiKey}`,
        "HTTP-Referer": window.location.href,
        "X-Title": "AI Conversation Banter"
      },
      body: JSON.stringify({
        model: model.modelId,
        messages: fullMessages,
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter API error (${response.status}):`, errorText);
      
      // More detailed error message
      if (response.status === 401) {
        throw new Error(`OpenRouter API error: Invalid API key or authorization failed`);
      } else if (response.status === 400) {
        throw new Error(`OpenRouter API error: Bad request - check model ID and parameters`);
      } else {
        throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
      }
    }

    const data = await response.json() as OpenRouterResponse;
    
    // Check if the response has the expected structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected response structure from OpenRouter:', data);
      throw new Error('Invalid response format from OpenRouter');
    }
    
    console.log(`Received response for ${model.name}:`, data.choices[0].message.content);
    return data.choices[0].message.content;
  } catch (error) {
    console.error(`Error generating response for ${model.name}:`, error);
    throw error; // Rethrow to handle in the component
  }
}
