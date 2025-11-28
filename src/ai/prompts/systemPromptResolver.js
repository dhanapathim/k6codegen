import { PromptStrategy } from "./systemPrompts.js";

export function getSystemPrompt(tool) {
  const toolKey = tool?.toLowerCase();

  const selected = PromptStrategy[toolKey];

  if (!selected) {
    throw new Error(`❌ Unsupported prompt for tool: ${tool}`);
  }

  return selected;
}
