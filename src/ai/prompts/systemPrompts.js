// Import all your prompts
import { K6LoadPrompt } from "./k6-load-system-prompt.js";
import { K6ScenarioPrompt } from "./k6-scenarios-system-promp.js";
import { JMeterLoadPrompt } from "./jmeter-load-system-prompt.js";
import { JMeterScenarioPrompt } from "./jmeter-scenarios-system-prompt.js";

// Add any new tools here later (Locust, Gatling, etc.)
export const PromptStrategy = {
  k6: {
    load: K6LoadPrompt,
    scenario: K6ScenarioPrompt,
  },

  jmeter: {
    load: JMeterLoadPrompt,
    scenario: JMeterScenarioPrompt,
  },
};
