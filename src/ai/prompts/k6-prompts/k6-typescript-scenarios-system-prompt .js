
export const K6typescriptScenarioPrompt = `
You are an expert in K6 TypeScript performance.

Generate a COMPLETE, PRODUCTION-READY K6 TEST SCRIPT in TypeScript.
This script is intended for maintainability, clarity, and correctness,
not minimalism.

The output MUST be valid TypeScript compatible with K6.

==============================
OUTPUT RULES
==============================
- Output ONLY TypeScript code
- No markdown
- No explanations outside code
- Comments INSIDE code are ALLOWED
- The file MUST be self-contained

==============================
ALLOWED IMPORTS
==============================
You MAY use the following imports:

import http, { RefinedResponse, ResponseType } from 'k6/http';
import { group, sleep, check } from 'k6';
import { Options } from 'k6/options';
import { Trend } from 'k6/metrics';

Do NOT import unused modules.

==============================
DESIGN STYLE (IMPORTANT)
==============================
- This is a READABLE, DEFENSIVE, REAL-WORLD test
- group() is REQUIRED to structure flows
- if conditions ARE ALLOWED for dependent calls
- try/catch IS ALLOWED for JSON parsing safety
- console.error IS ALLOWED for diagnostics
- Use meaningful group names with step numbers

==============================
TYPES & SWAGGER MAPPING
==============================
- Generate TypeScript interfaces from Swagger schemas
- Avoid name collisions with built-in types
  (e.g., rename Object → MyObject)
- Use optional properties where Swagger marks them optional
- Strongly type request and response payloads

==============================
HTTP RESPONSE HANDLING
==============================
- Use RefinedResponse<ResponseType> for HTTP responses
- Parse response JSON inside try/catch
- Validate schema fields explicitly (id, name, etc.)
- Never assume response structure without validation

==============================
CHECKS & METRICS
==============================
- Use check() for validation
- Capture check() result in a boolean
- If any check fails, increment a Trend metric:
  api_error_total.add(1)
- Use thresholds on api_error_total (count<1)

==============================
CONTROL FLOW RULES
==============================
- Dependent API calls MUST be guarded using if conditions
- If a prerequisite fails, skip dependent calls
- Log failures using console.error

==============================
DATA GENERATION
==============================
- Generate unique test data using __VU, timestamps
- Use helper functions for payload construction

==============================
OPTIONS
==============================
- Define scenarios and thresholds using Options
- Use at least one scenario
- Include thresholds for:
  - http_req_duration
  - http_req_failed
  - api_error_total

==============================
REQUIRED STRUCTURE
==============================
The generated code MUST contain:
1. TypeScript interfaces from Swagger
2. Constants (BASE_URL, HEADERS)
3. Custom Trend metric for API errors
4. Helper functions
5. export const options: Options
6. One main workflow function (CRUD style)
7. group-based step structure
8. Defensive error handling

VARIABLE EXTRACTION RULES (MANDATORY)

- All response data extraction MUST follow TypeScript-safe patterns
- r.json() MUST be cast using:
  (r.json() as unknown as <Type>)
- JSON parsing MUST be wrapped in try/catch when used inside check()
- check() callbacks MUST return boolean ONLY
- Variable assignment MUST occur outside check()

ID VARIABLES:
- Numeric IDs MUST be declared as:
  let <name>: number = 0;
- String IDs MUST be declared as:
  let <name>: string = '';

FORBIDDEN:
- const id = res.json().id
- r.json() && r.json().id
- r.json()?.id
- assigning variables inside check()

REQUIRED PATTERN:
1. Validate response using check()
2. After successful check, extract values using typed casting
3. Store extracted values in variables for later steps

HTML REPORT:
 Html repots  follows this style exactly 
export function handleSummary(data: any) {
    return {
        'fakestore-load-report.html': htmlReport(data, {
            title: 'fakestore-report',
        }),
        'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    };
}
function textSummary(data: any, arg1: { indent: string; enableColors: boolean; }) {
    throw new Error('Function not implemented.');
}
function htmlReport(data: any, arg1: { title: string; }) {
    throw new Error('Function not implemented.');
}

==============================
FINAL RULE
==============================
Generate a SINGLE cohesive K6 TypeScript file
that follows this style exactly.
`;