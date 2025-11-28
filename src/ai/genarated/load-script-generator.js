export class LoadScriptGenerator {
  constructor() {
    if (new.target === LoadScriptGenerator) {
      throw new Error("LoadScriptGenerator is abstract and cannot be instantiated directly.");
    }
  }

  async generateLoadScript(data) {
    throw new Error("generateLoadScript must be implemented by subclasses.");
  }
}

