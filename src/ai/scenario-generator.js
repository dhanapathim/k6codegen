export class ScenarioGenerator {
  constructor() {
    if (new.target === ScenarioGenerator) {
      throw new Error("ScenarioGenerator is abstract and cannot be instantiated directly.");
    }
  }

  async generateScenario(data, tool) {
    throw new Error("generateScenario must be implemented by subclasses.");
  }
}

