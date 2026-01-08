export const k6Template = `
The Swagger content is {swaggerDocs}
You are an expert K6 performance engineer. Generate a **production-ready K6 {language} script (ES6)** that meets the following specification.

1. General Requirements

  - Test Name: {testName}
  - Scenarios: {scenarios}
  - Thresholds: {thresholds}
  - HTML Report Path: {htmlReportPath}
   - HTML report name: {htmlReportName}
  - Iteration Definition / Flow Logic: {iteration_definition}
  - Swagger Paths: {swaggerPaths}
 

`;