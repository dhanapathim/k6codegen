export const k6Template = `
The Swagger content is {swaggerDocs}
You are an expert K6 performance engineer. Generate a **production-ready K6 JavaScript script (ES6)** that meets the following specification.

1. General Requirements
- The script must include **scenarios**, **thresholds**, and **summary reports**.
- Use the provided JSON configuration values as input variables:
  - Test Name: {testName}
  - Scenarios: {scenarios}
  - Thresholds: {thresholds}
  - HTML Report Path: {htmlReportPath}
  - Iteration Definition / Flow Logic: {iteration_definition}
  - Swagger Paths: {swaggerPaths}
- Ensure the script is modular, maintainable, and follows best practices for K6 scripting.

2. Scenarios
- Implement the scenarios as defined in the input JSON.
- Each scenario should have its own executor, VU count, duration, and start time.
- Ensure that scenarios can run concurrently without interference.
3. Thresholds
- Apply the provided thresholds to monitor performance metrics.
- Ensure that thresholds are realistic and aligned with performance goals.
4. Iteration Flow
- The default function must strictly follow the *iteration flow* as defined in {iteration_definition}.
- Each step in the iteration should correspond to an API call defined in the Swagger paths.
5. API Calls
- Use the provided Swagger paths to define the API calls.
- Each API call should include:
  - Proper request bodies, headers, and query parameters as per Swagger definitions.
   - Validation of responses using K6 checks.
   - Error handling and logging.
   - Authentication handling using environment variables.
6. Summary Reports
- Implement a handleSummary function to generate both text and HTML reports.
- The HTML report should be saved to the specified
   - Output path: {htmlReportPath}
7. Code Guidelines
- Do not use switch or if statements; prefer declarative constructs.
- Use K6 counters for tracking errors per API (e.g., api_error_create_post_total).
- Replace placeholders like {{'{{'}}documentId{{'}}'}} dynamically.
- Ensure random data generation for update APIs when mentioned in iteration_definition.

8. Imports
- The script must include the following imports:
  - import http from 'k6/http';
   - import {{'{{'}} check, sleep {{'}}'}} from 'k6';
   - import {{'{{'}} htmlReport {{'}}'}} from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
   - import {{'{{'}} textSummary {{'}}'}} from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
9. Guardrails
- No markdown or blockquotes. Exclude \`\`\`javascript \`\`\`
- Don't use json expression language. Example *createPostRes.json('data.documentId')* Instead use
  createPostRes.json().data.documentId.
- do not include any explanations or comments outside of the code itself.
`;