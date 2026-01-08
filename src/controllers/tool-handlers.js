
import { K6LoadScriptGenerator } from "../ai/genarated/k6-load-script-generator.js";
import { K6ScenarioGenerator } from "../ai/genarated/k6-scenario-script-generator.js";
import { JMeterLoadScriptGenerator } from "../ai/genarated/jmeter-load-script-generator.js";
import { JMeterScenarioGenerator } from "../ai/genarated/jmeter-generator-scenarios.js";

const k6LoadScriptGenerator = new K6LoadScriptGenerator();
const k6ScenarioGenerator = new K6ScenarioGenerator();
const jmeterLoadScriptGenerator = new JMeterLoadScriptGenerator();
const jmeterScenarioGenerator = new JMeterScenarioGenerator();

export const loadtoolHandlers = {
  jmeter: async (data) => jmeterLoadScriptGenerator.generateLoadScript(data),
  k6: async (data) => k6LoadScriptGenerator.generateLoadScript(data),
};

export const scenariotoolHandlers = {
  jmeter: async (data) => jmeterScenarioGenerator.generateScenario(data),
  k6: async (data) => k6ScenarioGenerator.generateScenario(data),
};