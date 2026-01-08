
import { K6LoadPromptjavascript } from "./k6-prompts/k6-load-javascript-system-prompt.js";
import { K6LoadPrompttypescript } from "./k6-prompts/k6-load-typescript-system-prompt.js";
import { K6ScenarioPrompt } from "./k6-prompts/k6-javascript-scenarios-system-prompt.js";
import { K6typescriptScenarioPrompt } from "./k6-prompts/k6-typescript-scenarios-system-prompt .js"

export const K6_LOAD_PROMPT_REGISTRY = Object.freeze({
  js: {
    prompt: K6LoadPromptjavascript
  },
  ts: {
    prompt: K6LoadPrompttypescript
  }
});

export const K6_Scenario_PROMPT_REGISTRY = Object.freeze({
  js: {
    prompt: K6ScenarioPrompt
  },
  ts: {
    prompt: K6typescriptScenarioPrompt
  }

});

export const LANGUAGE_REGISTRY = Object.freeze({
  js: { extension: ".js" },
  ts: { extension: ".ts" }
});