// createChatModel.js
import dotenv from "dotenv";
dotenv.config();

import { getSystemPrompt } from "./prompts/systemPromptResolver.js";
import { LLM_PROVIDERS } from "./llm-providers.js";

export function createChatModel({ tool }) {
  const provider = process.env.LLM_PROVIDER || "google";
  const model = process.env.LLM_MODEL;

  const systemInstruction = getSystemPrompt(tool);

  const providerFactory = LLM_PROVIDERS[provider];
  if (!providerFactory) {
    throw new Error(`❌ Unsupported LLM provider: ${provider}`);
  }

  return providerFactory({
    apiKey:
      {
        google: process.env.GOOGLE_API_KEY,
        openai: process.env.OPENAI_API_KEY,
      }[provider],

    baseUrl: process.env.OLLAMA_BASE_URL,
    model,
    systemInstruction,
  });
}
