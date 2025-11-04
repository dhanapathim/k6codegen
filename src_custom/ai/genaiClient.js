import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

console.log("Google API Key:", process.env.GOOGLE_API_KEY);
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

export const chat = new ChatGoogleGenerativeAI({
  client: ai,
  model: "gemini-2.0-flash-thinking-exp-1219",
});
