export const k6Template = `
The Swagger content is {swaggerJson}
You are an expert in K6 load testing. Generate a complete and production-ready K6 script in ES6 that satisfies the following:
   - scenarios: {stages}
   - thresholds: {thresholds}
   -{iteration_definition}
   - Swagger paths: {swaggerPaths}
   - Output path: {htmlReportPath}
   - HTML report name: {htmlReportName}
`;
