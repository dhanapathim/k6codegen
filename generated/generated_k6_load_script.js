import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import { Counter } from 'k6/metrics';

// Base URL from Swagger content
const BASE_URL = 'https://app.hivemindd.com';

// K6 Counters for API errors
const createHiveError = new Counter('api_error_create_hive_total');
const getHiveError = new Counter('api_error_get_hive_total');
const deleteHiveError = new Counter('api_error_delete_hive_total');

export const options = {
  scenarios: {
    "load_50": {
      "executor": "constant-vus",
      "vus": 5,
      "duration": "5m",
      "startTime": "0s"
    },
    "load_100": {
      "executor": "constant-vus",
      "vus": 10,
      "duration": "5m",
      "startTime": "5m"
    },
    "load_300": {
      "executor": "constant-vus",
      "vus": 30,
      "duration": "5m",
      "startTime": "10m"
    },
    "load_1000": {
      "executor": "constant-vus",
      "vus": 100,
      "duration": "5m",
      "startTime": "15m"
    }
  },
  thresholds: {
    'http_req_duration': ['p(95)<2000'], // 95% of requests should complete within 2 seconds
    'http_req_failed': ['rate<0.01'],    // less than 1% of requests should fail
    'api_error_create_hive_total': ['count<100'], // Example threshold for custom counter, adjust as needed
    'api_error_get_hive_total': ['count<100'],
    'api_error_delete_hive_total': ['count<100'],
  },
};

// Helper function to generate random strings
const randomString = (length) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Helper function to generate random number within a range
const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Dummy image data (very small base64 encoded transparent GIF)
const DUMMY_GIF_BASE64 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const DUMMY_GIF_BINARY = http.file(
  Array.from(atob(DUMMY_GIF_BASE64)).map(char => char.charCodeAt(0)),
  'dummy.gif',
  'image/gif'
);

export default function () {
  const authToken = `Bearer ${__ENV.BEARER_TOKEN}`;
  const headers = {
    'Authorization': authToken,
  };

  let hiveID = ''; // Variable to store created hiveID

  // Iteration Step 1: POST /service/api/hive/v1/hive (CreateHive)
  const createHivePayload = {
    name: `TestHive-${randomString(8)}`,
    description: `Description for Test Hive ${randomString(20)}`,
    status: Math.random() < 0.5 ? 'public' : 'private',
    profileImage: DUMMY_GIF_BINARY,
    coverImage: DUMMY_GIF_BINARY,
    mandatoryRulesAccepted: true,
    optionalRules: JSON.stringify([
      { "documentId": randomString(5), "name": `Optional Rule ${randomString(3)}`, "description": "This is an optional rule.", "selected": true }
    ]),
    rules: JSON.stringify([
      { "rule_id": randomString(5), "text": `Rule text ${randomString(10)}` }
    ]),
    autoArchiveAfter: getRandomInt(1, 30),
    autoArchiveDuration: ['days', 'weeks', 'months', 'years'][getRandomInt(0, 3)],
    honeycombs: [randomString(7), randomString(7)],
    resources: JSON.stringify({
      "type": "doc",
      "content": [{
        "type": "paragraph",
        "content": [{ "type": "text", "text": "This is a paragraph with some resources." }]
      }]
    }),
  };

  const createHiveRes = http.post(`${BASE_URL}/service/api/hive/v1/hive`, createHivePayload, {
    headers: { ...headers, 'Content-Type': 'multipart/form-data; boundary=' + Math.random().toString().slice(2) },
    tags: { name: 'CreateHive' },
  });

  const createHiveCheckSuccess = check(createHiveRes, {
    'CreateHive: status is 200': (r) => r.status === 200,
    'CreateHive: response has data object': (r) => r.json() && r.json().data !== null,
    'CreateHive: response has documentId': (r) => r.json() && r.json().data && typeof r.json().data.documentId === 'string',
  });

  if (!createHiveCheckSuccess) {
    createHiveError.add(1);
    // If hive creation fails, subsequent calls requiring hiveID cannot proceed.
    sleep(1); // Still pause to simulate some user activity
    return;
  }

  hiveID = createHiveRes.json().data.documentId;
  sleep(1); // Short pause after creation

  // Iteration Step 2: GET /service/api/hive/v1/hive/{hiveID} (GetHive)
  const getHiveRes = http.get(`${BASE_URL}/service/api/hive/v1/hive/${hiveID}`, {
    headers: headers,
    tags: { name: 'GetHive' },
  });

  const getHiveCheckSuccess = check(getHiveRes, {
    'GetHive: status is 200': (r) => r.status === 200,
    'GetHive: response data is present': (r) => r.json() && r.json().data !== null,
    'GetHive: returned hiveID matches': (r) => r.json() && r.json().data && r.json().data.documentId === hiveID,
  });

  if (!getHiveCheckSuccess) {
    getHiveError.add(1);
  }
  sleep(1); // Short pause after retrieval

  // Iteration Step 3: DELETE /service/api/hive/v1/hive/{hiveID} (DeleteHive)
  const deleteHiveRes = http.del(`${BASE_URL}/service/api/hive/v1/hive/${hiveID}`, null, {
    headers: headers,
    tags: { name: 'DeleteHive' },
  });

  const deleteHiveCheckSuccess = check(deleteHiveRes, {
    'DeleteHive: status is 200': (r) => r.status === 200,
  });

  if (!deleteHiveCheckSuccess) {
    deleteHiveError.add(1);
  }
  sleep(1); // Short pause after deletion
}

export function handleSummary(data) {
  return {
    'c://xyz/k6.html/data.html': htmlReport(data),
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}