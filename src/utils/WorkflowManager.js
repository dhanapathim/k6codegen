import fs from "fs";
import path from "path";

class WorkflowManager {
  /**
   * @param {string} basePath - project root or any directory path
   */
  constructor(basePath) {
    this.basePath = basePath;
    this.workflowDir = path.join(this.basePath, ".github", "workflows");
  }

  /**
   * Ensure .github/workflows exists and add workflow file if missing
   * @param {string} fileName - e.g. k6-load-test.yml
   * @param {string} content - YAML content
   */
  ensureWorkflow(fileName, content) {
    const workflowFile = path.join(this.workflowDir, fileName);

    // 1️⃣ Ensure .github/workflows directory
    if (!fs.existsSync(this.workflowDir)) {
      fs.mkdirSync(this.workflowDir, { recursive: true });
      console.log("📁 Created:", this.workflowDir);
    } else {
      console.log("📁 Using existing:", this.workflowDir);
    }

    // 2️⃣ Create workflow file if NOT exists
    if (!fs.existsSync(workflowFile)) {
      fs.writeFileSync(workflowFile, content.trim() + "\n", "utf-8");
      console.log("✅ Workflow added:", workflowFile);
    } else {
      console.log("ℹ️ Workflow already exists, skipped:", workflowFile);
    }
  }
}

export default WorkflowManager;
