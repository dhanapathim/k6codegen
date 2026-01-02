import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export class ProjectInitializerJS {
  constructor() {
    this.basePath = process.env.PROJECT_BASE_PATH;
    this.projectName = process.env.PROJECT_NAME;

    if (!this.basePath) {
      console.error("❌ PROJECT_BASE_PATH is missing in .env");
      process.exit(1);
    }

    if (!this.projectName) {
      console.error("❌ PROJECT_NAME is missing in .env");
      process.exit(1);
    }

    this.projectPath = path.resolve(this.basePath, this.projectName);
  }

  run(command) {
    console.log(`\n▶ ${command}`);
    execSync(command, { stdio: "inherit" });
  }

  createProjectFolder() {
    console.log(`🚀 Creating JavaScript k6 project at: ${this.projectPath}`);
    fs.mkdirSync(this.projectPath, { recursive: true });
    process.chdir(this.projectPath);
  }

  initNpm() {
    if (!fs.existsSync("package.json")) {
      this.run("npm init -y");
    }
  }

  createFolders() {
    fs.mkdirSync("src", { recursive: true });
  }



  runAll() {
    this.createProjectFolder();
    this.initNpm();
    this.createFolders();
    

    console.log("\n✅ JavaScript k6 project created successfully!");
  }
}
