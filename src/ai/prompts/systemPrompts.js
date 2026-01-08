// Import all your prompts
import { resolveK6loadPrompt, resolveK6ScenarioPrompt } from "../resolvers/promptResolver.js";
import { JMeterLoadPrompt } from "./jmeter-prompts/jmeter-load-system-prompt.js";
import { JMeterScenarioPrompt } from "./jmeter-prompts/jmeter-scenarios-system-prompt.js";
import dotenv from "dotenv";

dotenv.config();
const language = process.env.K6_LANGUAGE;

// Add any new tools here later (Locust, Gatling, etc.)
export const PromptStrategy = {
  k6: {
    load: resolveK6loadPrompt(language),
    Scenarios: resolveK6ScenarioPrompt(language)

  },
  jmeter: {
    load: JMeterLoadPrompt,
    scenario: JMeterScenarioPrompt,
  }

};
