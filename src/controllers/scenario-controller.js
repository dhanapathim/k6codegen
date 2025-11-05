import { generateK6Script } from "../ai/k6-load-script-generator.js";
import { K6Scriptgenerate } from "../ai/k6-generator-scenarios.js";


export const createScenario = async (req, res) => {
  try {
    const data = req.body;
    console.log(`Creating scenario with data: ${JSON.stringify(data, null, 2)}`);

    // ✅ Wait for the K6 script to be generated
    const { k6Script, outputPath } = await generateK6Script(data);

    console.log(`Generated k6 script is \n ${JSON.stringify(k6Script)}\n`);
    console.log("✅ K6 script generated at:", outputPath);

    // ✅ Send only one response
    res.status(201).json({
      message: "✅ K6 script generated successfully",

    });
  } catch (error) {
    console.error("❌ Error creating scenario:", error);
    res.status(500).json({ error: "Failed to generate K6 script" });
  }
};

export const createScenarioload = async (req, res) => {
  try {
    const data = req.body;
    console.log(`Creating scenario with data: ${JSON.stringify(data, null, 2)}`);

    // ✅ Wait for the K6 script to be generated
    const { k6Script, outputPath } = await K6Scriptgenerate(data);

    console.log(`Generated k6 script is \n ${JSON.stringify(k6Script)}\n`);
    console.log("✅ K6 script generated at:", outputPath);

    // ✅ Send only one response
    res.status(201).json({
      message: "✅ K6 script generated successfully",

    });
  } catch (error) {
    console.error("❌ Error creating scenario:", error);
    res.status(500).json({ error: "Failed to generate K6 script" });
  }
};