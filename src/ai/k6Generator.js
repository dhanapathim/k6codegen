import { chat } from "./genaiClient.js";
import { k6Template } from "./k6Template.js";
import { PromptTemplate } from "@langchain/core/prompts";
import fs from "fs";

export async function generateK6Script(data) {
  const { scenarios, commonFields } = data;

  // Example stage definition (can be extended for multiple scenarios)
  const stages = scenarios.reduce((acc, sc) => {
    acc[sc.name] = {
      executor: commonFields.executor,
      vus: sc.virtualUser,
      duration:
        `${commonFields.duration.hours}h` +
        `${commonFields.duration.minutes}m` +
        `${commonFields.duration.seconds}s`,
      startTime: sc.startTime,
    };
    return acc;
  }, {});

  const iteration_definition = commonFields.iterationDefinition;

  // Extract selected APIs from each scenario
  const swaggerPaths = commonFields.apis
    .filter((api) => api.selected)
    .map((api) => ({
      method: api.method,
      path: api.pathName,
    }));

  const thresholds = commonFields.thresholds || {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.01"],
  };

  const htmlReportPath = `${commonFields.htmlReportFilePath}/${commonFields.htmlReportName}.html`;

  const prompt = new PromptTemplate({
    template: k6Template,
    inputVariables: ["stages", "thresholds", "swaggerPaths", "htmlReportPath", "iteration_definition"],
  });

  const formattedPrompt = await prompt.format({
    stages: JSON.stringify(stages, null, 2),
    thresholds: JSON.stringify(thresholds, null, 2),
    swaggerPaths: JSON.stringify(swaggerPaths, null, 2),
    iteration_definition,
    htmlReportPath,
  });


  console.log("🧠 Sending prompt to Gemini model...");
  const k6Script = await chat.invoke(formattedPrompt);

  console.log("------------Generated K6 Script:-------------");
  console.log(`Genreated content is ${k6Script.content}`);

  // Write the generated script to a file
  const outputDir = process.env.OUTPUT_DIR || "./generated";
  const outputFile = process.env.OUTPUT_FILE_NAME || "generated_k6_script.js";

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  const outputPath = `${outputDir}/${outputFile}`;
  fs.writeFileSync(outputPath, k6Script.content, "utf-8");
  return { k6Script, outputPath };
}
