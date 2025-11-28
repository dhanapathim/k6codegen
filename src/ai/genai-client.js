import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { getSystemPrompt } from "./prompts/systemPromptResolver.js";


dotenv.config();
export function createChatModel({ tool }) {
  const systemInstruction = getSystemPrompt(tool);

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

   return new ChatGoogleGenerativeAI({
    client: ai,
    model: "gemini-2.5-flash",
    systemInstruction,
  });


}
