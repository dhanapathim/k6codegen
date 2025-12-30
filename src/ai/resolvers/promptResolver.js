import { K6_PROMPT_REGISTRY } from "../../ai/prompts/PromptRegistry.js";


export const resolveK6Prompt = (language) =>
  [
    K6_PROMPT_REGISTRY[language].prompt
  ].join("\n\n");
