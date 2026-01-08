import { createChatModel } from "../create-chatmodel.js";
import { JMeterTemplate } from "../prompts/jmeter-prompts/jmeter-load-prompt.js";
import { PromptTemplate } from "@langchain/core/prompts";
import { LoadScriptGenerator } from "./load-script-generator.js";
import logger from "../../utils/logger.js";
import fs from "fs";
import path from "path";
import { readSwaggerFile } from "../../utils/swagger-reader.js";
import { CodeFenceCleaner } from "../../utils/code-cleaner.js";
import WorkflowManager from "../../utils/workflow-manager.js";
import dotenv from "dotenv";

dotenv.config();

export class JMeterLoadScriptGenerator extends LoadScriptGenerator {
  constructor() {
    super();
  }

  async generateLoadScript(data) {
    const { scenarios, commonFields } = data;
    const tool = data.commonFields.tool;
    // Create chat model with system prompt for JMeter load script generation
    const chat = createChatModel({ tool, mode: "load" });

    const fullPath = path.join(process.env.SWAGGER_BASE_PATH, data.commonFields.swaggerFile);
    let swaggerFile;
    try {
      swaggerFile = path.resolve(fullPath);
      logger.info(`📄 Reading Swagger file from: ${swaggerFile}`);
    } catch (error) {
      logger.error("❌", error.message);
      throw new logger.Error(error.message);
    }

    const swaggerJson = readSwaggerFile(swaggerFile);

    const threadGroups = scenarios.reduce((acc, sc) => {
      acc[sc.name] = {
        threads: sc.threads,
        rampUp: sc.rampUp,
        duration: sc.duration,
        delay: sc.delay,
      };
      return acc;
    }, {});

    const iteration_definition = commonFields.userInstructions || "";
    const manualSwaggerPaths = commonFields.apis.map((api) => ({
      method: api.method,
      path: api.pathName,
    }));


    if (tool) {
      logger.info(`🔧 Tool specified: ${tool}`);
    }
    const outputDir = process.env.OUTPUT_DIR || "./generated";
    const outputFile = process.env.OUTPUT_LOAD_FILE_NAME || "generated_k6_load_script";
    //const packageName = getPackageFromFile(outputDir);

    const prompt = new PromptTemplate({
      template: JMeterTemplate,
      inputVariables: [
        "threadGroups",
        "swaggerPaths",
        "iteration_definition",
        "swaggerJson",
        "outputFile"
      ],
    });

    const formattedPrompt = await prompt.format({
      threadGroups: JSON.stringify(threadGroups, null, 2),
      swaggerPaths: JSON.stringify(manualSwaggerPaths, null, 2),
      iteration_definition,
      swaggerJson,
      outputFile
    });

    logger.info("🧠 Sending prompt to Gemini model...");
    const Script = await chat.invoke(formattedPrompt);

    logger.info("------------Generated JMeter Script:-------------");
    logger.info(Script.content);

    const workflow = new WorkflowManager(outputDir);
    workflow.ensureWorkflow(
      "Jmeter.yml",
      `name: Run JMeter Tests

on:
  workflow_dispatch:
    inputs:
      testFile:
        description: "Select JMeter test plan (from jmeter/ folder)"
        required: true
        type: string

jobs:
  jmeter_test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      # 🔍 Auto-detect JMX files
      - name: Detect JMeter test plans
        id: detect
        run: |
          FILES=$(find src -type f -name "*.jmx" -printf "%f\n")

          if [ -z "$FILES" ]; then
            echo "❌ No JMX files found"
            exit 1
          fi

          echo "Available JMeter tests:"
          echo "$FILES"

          echo "files<<EOF" >> $GITHUB_OUTPUT
          echo "$FILES" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      # ✅ Validate selection
      - name: Validate selected test
        run: |
          SELECTED="\${{ github.event.inputs.testFile }}"
          if ! echo "\${{ steps.detect.outputs.files }}" | grep -qx "$SELECTED"; then
            echo "❌ Invalid test file: $SELECTED"
            exit 1
          fi

      # ▶ Run selected JMeter test (ALL outputs → ONE folder)
      - name: Run JMeter Test
        id: runjmeter
        run: |
          TEST="\${{ github.event.inputs.testFile }}"
          NAME="\${TEST%.jmx}"
          TS=$(date +"%Y-%m-%d_%H-%M-%S")
          OUTDIR="\${NAME}_\${TS}"

          mkdir -p "$OUTDIR"

          echo "outdir=$OUTDIR" >> $GITHUB_OUTPUT
          echo "▶ Running JMeter test: $TEST"

          docker run --rm \
            -v "\${{ github.workspace }}:/mnt" \
            justb4/jmeter:latest \
            -n \
            -t "/mnt/src/$TEST" \
            -l "/mnt/$OUTDIR/results.jtl" \
            -j "/mnt/$OUTDIR/jmeter.log" \
            -e -o "/mnt/$OUTDIR/html-report"

          # Convert JTL → CSV
          cp "$OUTDIR/results.jtl" "$OUTDIR/results.csv"

      # 📦 Upload ONE folder with EVERYTHING
      - name: Upload JMeter Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: jmeter-output-\${{ steps.runjmeter.outputs.outdir }}
          path: \${{ steps.runjmeter.outputs.outdir }}
          if-no-files-found: warn`
    );

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
    const outputPath = `${outputDir}/${outputFile}.java`;
    fs.writeFileSync(outputPath, Script.content, "utf-8");
    const cleaner = new CodeFenceCleaner(outputDir, [".js", ".ts", ".java"]);
    cleaner.clean();
    return { Script, outputPath };
  }


}