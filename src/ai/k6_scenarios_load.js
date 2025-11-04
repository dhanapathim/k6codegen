export const k6Template = `

You are an expert in K6 load testing. Generate a complete and production-ready K6 script in ES6 that satisfies the following:

1. Include the options section with stages and thresholds:
   - scenarios: {stages}
   - thresholds: {thresholds}

2. The default function must follow this *iteration flow* (strictly follow each step):
   {iteration_definition}

3. The iteration should invoke only the provided REST APIs in the same order they appear in manualSwaggerPaths:
   - Swagger paths: {swaggerPaths}
   - Each API call should use:
     - requestBody, headers, and query parameters derived from Swagger Content.
     - Validate responses with K6 checks.
     - Handle authentication via environment variables.
     - Gracefully handle errors and increment error counters per API.

4. Include a handleSummary function that generates both text and HTML summaries:
   - Output path: {htmlReportPath}

5. Code guidelines:
   - No switch or if statements (use declarative constructs).
   - Use K6 counters for tracking errors per API (e.g., api_error_create_post_total).
   - Replace placeholders like {{'{{'}}documentId{{'}}'}} dynamically.
   - Ensure random data generation for update APIs when mentioned in iteration_definition.

6. Import:
   - import http from 'k6/http';
   - import {{'{{'}} check, sleep {{'}}'}} from 'k6';
   - import {{'{{'}} htmlReport {{'}}'}} from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
   - import {{'{{'}} textSummary {{'}}'}} from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

7. Gauard Rails
   - no markdown or blockquotes. Exclude \`\`\`javascript \`\`\`
   - Don't use json expression language.Example *createPostRes.json('data.documentId')* Instead use
     createPostRes.json().data.documentId.

`;
