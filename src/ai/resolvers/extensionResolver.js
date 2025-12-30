import { K6_PROMPT_REGISTRY } from "../../ai/prompts/PromptRegistry.js";

export const resolveFileExtension = (language) =>
  K6_PROMPT_REGISTRY[language].extension;
