import { LANGUAGE_REGISTRY } from "../../ai/prompts/PromptRegistry.js";
import { normalizeLanguage } from "./languageNormalizer.js";

export const resolveFileExtension = (language) => {
  const normalized = normalizeLanguage(language);

  if (!normalized) {
    throw new Error("❌ Language is missing or invalid while resolving file extension");
  }

  const entry = LANGUAGE_REGISTRY[normalized];

  if (!entry) {
    throw new Error(
      `❌ Unsupported language '${language}'. Supported: ${Object.keys(LANGUAGE_REGISTRY).join(", ")}`
    );
  }

  return entry.extension;
};
