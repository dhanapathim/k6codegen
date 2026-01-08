import { createChatModel } from "../create-chatmodel.js";
import { basek6prompt } from "../prompts/k6-prompts/base-k6-prompt.js";
import { PromptTemplate } from "@langchain/core/prompts";
import logger from "../../utils/logger.js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { LoadScriptGenerator } from "./load-script-generator.js";
import { readSwaggerFile } from "../../utils/swagger-reader.js";
import { CodeFenceCleaner } from "../../utils/code-cleaner.js";
import { resolveFileExtension } from "../resolvers/extensionResolver.js";
import WorkflowManager from "../../utils/workflow-manager.js";

dotenv.config();

export class K6LoadScriptGenerator extends LoadScriptGenerator {
  constructor() {
    super();
  }

  async generateLoadScript(data) {
    const { scenarios, commonFields } = data;

    const language = process.env.K6_LANGUAGE;

    const tool = data.commonFields.tool;
    // Create chat model with system prompt for JMeter load script generation
    const chat = createChatModel({ tool, mode: "load" });

    let swaggerFile;
    const fullPath = path.join(process.env.SWAGGER_BASE_PATH, data.commonFields.swaggerFile);

    try {
      swaggerFile = path.resolve(fullPath);
      logger.info(`📄 Reading Swagger file from: ${swaggerFile}`);
    } catch (error) {
      logger.error("❌", error.message);
      throw new logger.Error(error.message);
    }

    const swaggerJson = readSwaggerFile(swaggerFile);

    const { hours, minutes, seconds } = commonFields.duration;
    const formattedDuration =
      `${hours ? hours + "h" : ""}${minutes ? minutes + "m" : ""}${seconds ? seconds + "s" : ""}` || "1m";

    const stages = scenarios.reduce((acc, sc) => {
      acc[sc.name] = {
        executor: commonFields.executor,
        vus: sc.virtualUser,
        duration: formattedDuration,
        startTime: sc.startTime,
      };
      return acc;
    }, {});

    const iteration_definition = commonFields.iterationDefinition || "";
    const manualSwaggerPaths = commonFields.apis.map((api) => ({
      method: api.method,
      path: api.pathName,
    }));


    let thresholds;
    if (commonFields.thresholds && Object.keys(commonFields.thresholds).length > 0) {
      thresholds = {};
      for (const [metric, value] of Object.entries(commonFields.thresholds)) {
        thresholds[metric] = [value];
      }
    } else {
      thresholds = {};
    }

    const htmlReportPath = `${commonFields.htmlReportFilePath}`;
    const htmlReportName = `${commonFields.htmlReportName}`;

    if (tool) {
      logger.info(`🔧 Tool specified: ${tool}`);
    }


    const fileExtension = resolveFileExtension(language);

    const prompt = new PromptTemplate({
      template: basek6prompt,
      inputVariables: [
        "stages",
        "thresholds",
        "swaggerPaths",
        "htmlReportPath",
        "htmlReportName",
        "iteration_definition",
        "swaggerJson",
        "language",
      ],
    });

    const formattedPrompt = await prompt.format({
      stages: JSON.stringify(stages, null, 2),
      thresholds: JSON.stringify(thresholds, null, 2),
      swaggerPaths: JSON.stringify(manualSwaggerPaths, null, 2),
      iteration_definition,
      htmlReportName,
      swaggerJson,
      htmlReportPath,
      language,
    });

    logger.info("🧠 Sending prompt to Gemini model...");
    const Script = await chat.invoke(formattedPrompt);

    logger.info("------------Generated K6 Script:-------------");
    logger.info(Script.content);

    const outputDir = path.resolve(process.env.PROJECT_BASE_PATH, process.env.PROJECT_NAME);
    const outputFile = process.env.OUTPUT_LOAD_FILE_NAME || "generated_k6_load_script";

    const scriptsDir = path.join(outputDir, "src");
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true });
    }
    const workflow = new WorkflowManager(outputDir);
    workflow.ensureWorkflow(
      "k6.yml",
      `name: K6 Load Test

on:
  workflow_dispatch:
    inputs:
      scriptName:
        description: "Select k6 script from src/ folder (example: login_test.js)"
        required: true
        type: string

jobs:
  k6-load-test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      # =========================
      # Install k6
      # =========================
      - name: Install k6
        run: |
          sudo apt update
          sudo apt install -y gnupg ca-certificates
          curl -s https://dl.k6.io/key.gpg | sudo apt-key add -
          echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt update
          sudo apt install -y k6
          k6 version

      # =========================
      # Detect k6 scripts
      # =========================
      - name: Detect k6 src
        id: detect
        run: |
          SRC=$(find src -type f -name "*.js" -printf "%f\\n")
          [ -z "$src" ] && echo "❌ No src found" && exit 1

          echo "src<<EOF" >> $GITHUB_OUTPUT
          echo "$SRC" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      # =========================
      # Validate selection
      # =========================
      - name: Validate selected script
        run: |
          if ! echo "\${{ steps.detect.outputs.src }}" | grep -qx "\${{ github.event.inputs.scriptName }}"; then
            echo "❌ Invalid script"
            exit 1
          fi

      # =========================
      # Run k6 (Dashboard + Summary)
      # =========================
      - name: Run selected k6 script
        id: runk6
        env:
          K6_WEB_DASHBOARD: "true"
          CI: "true"
        run: |
          FILE="scripts/\${{ github.event.inputs.scriptName }}"
          NAME="\${{ github.event.inputs.scriptName }}"
          NAME="\${NAME%.js}"
          TS=$(date +"%Y-%m-%d_%H-%M-%S")

          OUTDIR="\${NAME}_\${TS}"
          mkdir -p "\$OUTDIR"

          echo "outdir=\$OUTDIR" >> \$GITHUB_OUTPUT

          echo "▶ Running \$FILE"

          K6_OUTDIR="\$OUTDIR" \\
          K6_RUN_NAME="\$NAME" \\
          K6_RUN_TS="\$TS" \\
          K6_WEB_DASHBOARD_EXPORT="\$OUTDIR/\${NAME}.html" \\
          k6 run "\$FILE" \\
            --out json="\$OUTDIR/results.json" \\
            --out csv="\$OUTDIR/results.csv" \\
            2>&1 | tee "\$OUTDIR/k6.log"

      # =========================
      # Verify outputs
      # =========================
      - name: Verify generated files
        if: always()
        run: |
          echo "Generated files:"
          ls -lh "\${{ steps.runk6.outputs.outdir }}"

      # =========================
      # Upload artifact
      # =========================
      - name: Upload k6 output folder
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: k6-output-\${{ steps.runk6.outputs.outdir }}
          path: \${{ steps.runk6.outputs.outdir }}
          if-no-files-found: warn
`
    );

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
    const outputPath = `${scriptsDir}/${outputFile}${fileExtension}`;
    fs.writeFileSync(outputPath, Script.content, "utf-8");
    const cleaner = new CodeFenceCleaner(outputDir, [".js", ".ts", ".java"]);
    cleaner.clean();

    return { Script, outputPath };
  }
}
