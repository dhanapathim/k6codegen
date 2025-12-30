export const basek6prompt=`
The Swagger content is {swaggerJson}
You are an expert K6 performance engineer. Generate a **production-ready K6 {language} script (ES6)** that meets the following specification.

1. General Requirements

  - Scenarios: {stages}
  - Thresholds: {thresholds}
  - HTML Report Path: {htmlReportPath}
   - HTML report name: {htmlReportName}
  - Iteration Definition / Flow Logic: {iteration_definition}
  - Swagger Paths: {swaggerPaths}
 
`;