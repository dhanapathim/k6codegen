// llmProviders.js
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { ChatOllama } from "@langchain/ollama";
import { GoogleGenAI } from "@google/genai";

export const LLM_PROVIDERS = {
  google: ({ apiKey, model, systemInstruction }) => {
    const ai = new GoogleGenAI({ apiKey });

    return new ChatGoogleGenerativeAI({
      client: ai,
      model: model || "gemini-2.5-flash",
      systemInstruction,
    });
  },

  openai: ({ apiKey, model, systemInstruction }) =>
    new ChatOpenAI({
      apiKey,
      model: model || "gpt-4o",
      systemMessage: systemInstruction,
    }),

  ollama: ({ baseUrl, model, systemInstruction }) =>
    new ChatOllama({
      baseUrl: baseUrl || "http://localhost:11434",
      model: model || "llama3",
      temperature: 0,
      system: systemInstruction,
    }),
};
