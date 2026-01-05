import {K6_LOAD_PROMPT_REGISTRY,K6_Scenario_PROMPT_REGISTRY} from "../../ai/prompts/PromptRegistry.js";

/**
 * Normalize language input to canonical key
 */
const normalizeLanguage = (language) => {
  if (!language) return "js";

  const map = {
    js: "js",
    javascript: "js",
    ts: "ts",
    typescript: "ts"
  };

  return map[language.toLowerCase()];
};

const resolveFromRegistry = (registry, language, label) => {
  const normalized = normalizeLanguage(language);

  const entry = registry[normalized];

  if (!entry) {
    throw new Error(
      `❌ Unsupported ${label} language '${language}'. Supported: ${Object.keys(registry).join(", ")}`
    );
  }

  return entry.prompt;
};

export const resolveK6loadPrompt = (language) =>
  resolveFromRegistry(K6_LOAD_PROMPT_REGISTRY, language, "K6 Load");


export const resolveK6ScenarioPrompt = (language) =>
  resolveFromRegistry(K6_Scenario_PROMPT_REGISTRY, language, "K6 Scenario");

