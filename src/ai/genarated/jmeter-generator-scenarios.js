import { createChatModel } from "../create-chatmodel.js";
import { JMeterTemplate } from "../prompts/jmeter-prompts/jmeter-scenario-prompt.js";
import { PromptTemplate } from "@langchain/core/prompts";
import { ScenarioGenerator } from "./scenario-generator.js";
import logger from "../../utils/logger.js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { CodeFenceCleaner } from "../../utils/code-cleaner.js";
import { readSwaggerFile } from "../../utils/swagger-reader.js";
import WorkflowManager from "../../utils/workflow-manager.js";

dotenv.config();

export class JMeterScenarioGenerator extends ScenarioGenerator {
  constructor() {
    super();
  }

  async generateScenario(data) {
    const { config, scenarios } = data;
    // ✅ Step 1: Create chat model with system prompt for JMeter scenario generation
    const tool = data.config.tool;
    const chat = createChatModel({ tool, mode: "scenario" });

    // ✅ Step 2: Collect Swagger files across all scenarios
    const swaggerFiles = [
      ...new Set(
        scenarios
          .map((s) => s.swaggerFile)
          .filter(Boolean)
          .map((file) => path.resolve(process.env.SWAGGER_BASE_PATH, file))
      ),
    ];

    logger.info(`📚 Found ${swaggerFiles.length} Swagger file(s):`);
    swaggerFiles.forEach((file) => logger.info(" -", file));

    // ✅ Step 3: Parse all Swagger files
    const swaggerDocs = swaggerFiles.map((file) => ({
      file,
      content: readSwaggerFile(file),
    }));

    // ✅ Step 4: Build scenario definitions dynamically
    const scenarioDefinitions = scenarios.reduce((acc, sc) => {
      acc[sc.name] = {
        threads: sc.threads,
        rampUp: sc.rampUp,
        duration: sc.duration,
        delay: sc.delay,
      };
      return acc;
    }, {});

    // ✅ Step 5: Gather all API endpoints from all scenarios
    const swaggerPaths = scenarios.flatMap((sc) => {
      if (Array.isArray(sc.api)) {
        return sc.api.map((api) => ({
          method: api.method,
          path: api.path,
          swaggerFile: sc.swaggerFile,
        }));
      } else if (typeof sc.api === "object" && sc.api !== null) {
        return [{ method: sc.api.method, path: sc.api.path, swaggerFile: sc.swaggerFile }];
      }
      return [];
    });

    // Log tool if provided (from query parameter)
    if (tool) {
      logger.info(`🔧 Tool specified: ${tool}`);
    }

    // ✅ Step 7: Build iteration definition summary
    const iteration_definition = scenarios
      .map(
        (sc) =>
          `Scenario: ${sc.name}\nDescription: ${sc.description}\nSwagger: ${sc.swaggerFile}\nInstruction: ${sc.userInstructions || "N/A"
          }`
      )
      .join("\n\n");


    const outputDir = process.env.OUTPUT_DIR || "./generated";
    const outputFile = process.env.OUTPUT_SCENARIO_FILE || "generated_jmeter_script";
    const outputPath = `${outputDir}/${outputFile}.java`;

    // ✅ Step 8: Build prompt
    const prompt = new PromptTemplate({
      template: JMeterTemplate,
      inputVariables: [
        "scenarios",
        "swaggerPaths",
        "swaggerDocs",
        "iteration_definition",
        "outputFile",

      ],
    });

    const formattedPrompt = await prompt.format({
      scenarios: JSON.stringify(scenarioDefinitions, null, 2),
      swaggerPaths: JSON.stringify(swaggerPaths, null, 2),
      swaggerDocs: JSON.stringify(swaggerDocs, null, 2),
      iteration_definition,
      outputFile: outputFile,

    });

    logger.info("🧠 Sending prompt to Gemini model...");
    const Script = await chat.invoke(formattedPrompt);

    logger.info("------------Generated Script:-------------");
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

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    fs.writeFileSync(outputPath, Script.content, "utf-8");
    logger.info(`✅ Script successfully written to ${outputPath}`);
    const cleaner = new CodeFenceCleaner(outputDir, [".js", ".ts", ".java"]);
    cleaner.clean();

    return { Script, outputPath };
  }

}