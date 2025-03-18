
import { AIModel } from "../config/aiModels";

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

export async function generateResponse(
  model: AIModel,
  messages: Message[],
  apiKey: string
): Promise<string> {
  try {
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

    // Check if API key is provided
    if (!apiKey) {
      console.error('No API key provided for OpenRouter');
      throw new Error('OpenRouter API key is missing');
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
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
