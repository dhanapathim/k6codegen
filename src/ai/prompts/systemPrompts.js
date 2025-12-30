// Import all your prompts
import { resolveK6Prompt } from "../resolvers/promptResolver.js";
import dotenv from "dotenv";

dotenv.config();
const language = process.env.K6_LANGUAGE;

// Add any new tools here later (Locust, Gatling, etc.)
export const PromptStrategy = {
  k6: {
    load: resolveK6Prompt(language)
  }
};
