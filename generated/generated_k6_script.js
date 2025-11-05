import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import { SharedArray } from 'k6/data';
import { Counter } from 'k6/metrics';

// --- K6 Metrics ---
const apiErrorCreateHive = new Counter('api_error_create_hive_total');
const apiErrorGetHive = new Counter('api_error_get_hive_total');
const apiErrorDeleteHive = new Counter('api_error_delete_hive_total');

// --- Global Test Configuration ---
const TEST_NAME = 'Hive Service Full Load Test';
const BASE_URL = 'https://app.hivemindd.com'; // From Swagger servers
const HTML_REPORT_PATH = 'c://xyz/k6.html/data.html';

// Get Bearer Token from environment variable
// Example: k6 run script.js -e BEARER_TOKEN="YOUR_JWT_TOKEN"
const BEARER_TOKEN = __ENV.BEARER_TOKEN || 'YOUR_MOCK_JWT_TOKEN_HERE';

// Helper function to generate random string
function randomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper function to generate a random number within a range
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- K6 Options ---
export const options = {
  scenarios: {
    create_hive_shared: {
      executor: 'shared-iterations',
      exec: 'createHive',
      gracefulStop: '5s',
      vus: 5,
      iterations: 50,
      startTime: '0s'
    },
    get_hive_pervu: {
      executor: 'per-vu-iterations',
      exec: 'getHive',
      gracefulStop: '5s',
      vus: 3,
      iterations: 10,
      startTime: '0s'
    },
    constant_vus_delete: {
      executor: 'constant-vus',
      exec: 'deleteHive',
      gracefulStop: '5s',
      vus: 5,
      startTime: '0s',
      duration: '1m'
    },
    ramping_vus_create: {
      executor: 'ramping-vus',
      exec: 'createHive',
      startTime: '0s',
      startVUs: 0,
      gracefulRampDown: '10s',
      stages: [
        {
          duration: '30s',
          target: 5
        },
        {
          duration: '1m',
          target: 10
        },
        {
          duration: '30s',
          target: 0
        }
      ]
    },
    constant_rate_get: {
      executor: 'constant-arrival-rate',
      exec: 'getHive',
      gracefulStop: '5s',
      startTime: '0s',
      duration: '1m',
      rate: 20,
      timeUnit: '1s',
      preAllocatedVUs: 10,
      maxVUs: 50
    },
    ramping_rate_get: {
      executor: 'ramping-arrival-rate',
      exec: 'getHive',
      gracefulStop: '10s',
      timeUnit: '1s',
      preAllocatedVUs: 10,
      maxVUs: 50,
      stages: [
        {
          target: 20,
          duration: '30s'
        },
        {
          target: 50,
          duration: '1m'
        },
        {
          target: 0,
          duration: '30s'
        }
      ],
      startRate: 10
    },
    externally_controlled_delete: {
      executor: 'externally-controlled',
      exec: 'deleteHive',
      vus: 0, // VUs are controlled externally
      startTime: '0s',
      duration: '5m',
      maxVUs: 100
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01']
  },
  ext: {
    load: {
      project: TEST_NAME,
      name: TEST_NAME,
    },
  },
};

// --- Setup Function ---
export function setup() {
  const setupHiveIDs = [];
  const headers = {
    'Authorization': `Bearer ${BEARER_TOKEN}`,
  };

  // Create some initial hives for GET and DELETE scenarios
  const numberOfInitialHives = 10;
  for (let i = 0; i < numberOfInitialHives; i++) {
    const hiveName = `SetupHive-${randomString(8)}`;
    const hiveDescription = `Description for ${hiveName}`;
    const boundary = '------------------------abcdef1234567890'; // Unique boundary

    const multipartHeaders = {
      ...headers,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    };

    const formData = `
--${boundary}
Content-Disposition: form-data; name="name"

${hiveName}
--${boundary}
Content-Disposition: form-data; name="description"

${hiveDescription}
--${boundary}
Content-Disposition: form-data; name="status"

public
--${boundary}
Content-Disposition: form-data; name="mandatoryRulesAccepted"

true
--${boundary}
Content-Disposition: form-data; name="profileImage"; filename="profile.png"
Content-Type: image/png

${http.file('dummy_profile_image_data', 'profile.png', 'image/png').data}
--${boundary}
Content-Disposition: form-data; name="coverImage"; filename="cover.jpeg"
Content-Type: image/jpeg

${http.file('dummy_cover_image_data', 'cover.jpeg', 'image/jpeg').data}
--${boundary}
Content-Disposition: form-data; name="honeycombs"

["honeycomb1","honeycomb2"]
--${boundary}
Content-Disposition: form-data; name="resources"

{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Setup hive resources."}]}]}
--${boundary}--
`;

    const res = http.post(`${BASE_URL}/service/api/hive/v1/hive`, formData, { headers: multipartHeaders });

    const success = check(res, {
      'Setup: Create Hive status is 200': (r) => r.status === 200,
      'Setup: Create Hive response has documentId': (r) => r.json() && r.json().data && r.json().data.documentId,
    });

    if (success) {
      setupHiveIDs.push(res.json().data.documentId);
      console.log(`Setup: Created hive with ID: ${res.json().data.documentId}`);
    } else {
      console.error(`Setup: Failed to create hive. Status: ${res.status}, Body: ${res.body}`);
      apiErrorCreateHive.add(1);
    }
    sleep(1); // Small delay to avoid hammering during setup
  }

  console.log(`Setup completed. Initial Hives created: ${setupHiveIDs.length}`);

  return {
    baseURL: BASE_URL,
    bearerToken: BEARER_TOKEN,
    hiveIDs: new SharedArray('seedHiveIds', function () { return setupHiveIDs; }), // Pass SharedArray to VUs
  };
}

// --- Teardown Function ---
export function teardown(data) {
  console.log('Teardown: Deleting setup hives...');
  const headers = {
    'Authorization': `Bearer ${data.bearerToken}`,
  };

  // Access the SharedArray for deletion
  const hiveIDsToDelete = data.hiveIDs;

  for (const hiveID of hiveIDsToDelete) {
    const res = http.del(`${data.baseURL}/service/api/hive/v1/hive/${hiveID}`, null, { headers: headers });

    check(res, {
      [`Teardown: Delete Hive ${hiveID} status is 200`]: (r) => r.status === 200,
    });

    if (res.status === 200) {
      console.log(`Teardown: Deleted hive with ID: ${hiveID}`);
    } else {
      console.error(`Teardown: Failed to delete hive ${hiveID}. Status: ${res.status}, Body: ${res.body}`);
      apiErrorDeleteHive.add(1);
    }
    sleep(0.5); // Small delay
  }
  console.log('Teardown completed.');
}

// --- Scenario Functions ---

// Scenario: Create Hive
// Instruction: Creates a new hive
export function createHive(data) {
  const hiveName = `TestHive-${randomString(8)}`;
  const hiveDescription = `Description for ${hiveName} - VU:${__VU} Iter:${__ITER}`;
  const statusOptions = ['public', 'private'];
  const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
  const autoArchiveDurationOptions = ["days", "weeks", "months", "years"];
  const autoArchiveDuration = autoArchiveDurationOptions[Math.floor(Math.random() * autoArchiveDurationOptions.length)];

  const boundary = '------------------------abcdef1234567890'; // Unique boundary
  const headers = {
    'Authorization': `Bearer ${data.bearerToken}`,
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
  };

  // Dummy image data for multipart/form-data
  const profileImageContent = http.file('dummy_profile_image_data', 'profile.png', 'image/png');
  const coverImageContent = http.file('dummy_cover_image_data', 'cover.jpeg', 'image/jpeg');

  const formData = `
--${boundary}
Content-Disposition: form-data; name="name"

${hiveName}
--${boundary}
Content-Disposition: form-data; name="description"

${hiveDescription}
--${boundary}
Content-Disposition: form-data; name="status"

${status}
--${boundary}
Content-Disposition: form-data; name="profileImage"; filename="profile.png"
Content-Type: image/png

${profileImageContent.data}
--${boundary}
Content-Disposition: form-data; name="coverImage"; filename="cover.jpeg"
Content-Type: image/jpeg

${coverImageContent.data}
--${boundary}
Content-Disposition: form-data; name="mandatoryRulesAccepted"

true
--${boundary}
Content-Disposition: form-data; name="optionalRules"

[{"documentId":"rule1-${randomString(4)}","name":"Optional Rule One","description":"Desc for Optional Rule One","selected":true}]
--${boundary}
Content-Disposition: form-data; name="rules"

{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Some custom rules for the hive: ${randomString(5)}."}]}]}
--${boundary}
Content-Disposition: form-data; name="autoArchiveAfter"

${getRandomInt(1, 30)}
--${boundary}
Content-Disposition: form-data; name="autoArchiveDuration"

${autoArchiveDuration}
--${boundary}
Content-Disposition: form-data; name="honeycombs"

["honeycomb_alpha_${randomString(3)}","honeycomb_beta_${randomString(3)}"]
--${boundary}
Content-Disposition: form-data; name="resources"

{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Resources for new hive: ${hiveName} - ${randomString(5)}"}]}]}
--${boundary}--
`;

  const res = http.post(`${data.baseURL}/service/api/hive/v1/hive`, formData, { headers: headers });

  const success = check(res, {
    'Create Hive status is 200': (r) => r.status === 200,
    'Create Hive response has documentId': (r) => r.json() && r.json().data && r.json().data.documentId,
  });

  if (!success) {
    apiErrorCreateHive.add(1);
    console.error(`VU ${__VU}: Create Hive failed. Status: ${res.status}, Body: ${res.body}`);
  }
  sleep(1);
}

// Scenario: Get Hive
// Instruction: Retrieves the details of a specific hive using its unique ID
export function getHive(data) {
  const headers = {
    'Authorization': `Bearer ${data.bearerToken}`, // Although not explicitly defined in swagger for GetHive, often useful for consistency.
  };

  const hiveIDs = data.hiveIDs;
  if (!hiveIDs || hiveIDs.length === 0) {
    console.warn(`VU ${__VU}: No hive IDs available for Get Hive. Skipping.`);
    sleep(1);
    return;
  }

  const hiveID = hiveIDs[Math.floor(Math.random() * hiveIDs.length)]; // Pick a random hive ID

  const res = http.get(`${data.baseURL}/service/api/hive/v1/hive/${hiveID}`, { headers: headers });

  const success = check(res, {
    'Get Hive status is 200': (r) => r.status === 200,
    'Get Hive response has data': (r) => r.json() && r.json().data,
    'Get Hive response data has documentId': (r) => r.json().data.documentId === hiveID,
  });

  if (!success) {
    apiErrorGetHive.add(1);
    console.error(`VU ${__VU}: Get Hive ${hiveID} failed. Status: ${res.status}, Body: ${res.body}`);
  }
  sleep(1);
}

// Scenario: Delete Hive
// Instruction: Removes a hive record permanently from the system using its ID
export function deleteHive(data) {
  const headers = {
    'Authorization': `Bearer ${data.bearerToken}`,
  };

  const hiveIDs = data.hiveIDs;
  if (!hiveIDs || hiveIDs.length === 0) {
    console.warn(`VU ${__VU}: No hive IDs available for Delete Hive. Skipping.`);
    sleep(1);
    return;
  }

  const hiveID = hiveIDs[Math.floor(Math.random() * hiveIDs.length)]; // Pick a random hive ID

  const res = http.del(`${data.baseURL}/service/api/hive/v1/hive/${hiveID}`, null, { headers: headers });

  const success = check(res, {
    'Delete Hive status is 200': (r) => r.status === 200,
    'Delete Hive response error is false': (r) => r.json() && r.json().error === false,
  });

  if (!success) {
    apiErrorDeleteHive.add(1);
    console.error(`VU ${__VU}: Delete Hive ${hiveID} failed. Status: ${res.status}, Body: ${res.body}`);
  }
  sleep(1);
}

// --- Summary Report Function ---
export function handleSummary(data) {
  console.log('Generating summary report...');

  const htmlOutput = htmlReport(data);
  const textOutput = textSummary(data, { indent: ' ', enableColors: true });

  return {
    'stdout': textOutput,
    [HTML_REPORT_PATH]: htmlOutput, // HTML report to the specified path
    'summary.json': JSON.stringify(data), // Optional: full JSON data report
  };
}

// The default function is not used by scenarios when `exec` functions are defined.
// Keeping it empty or removing it entirely is fine.
export default function () {
  // No operations here as scenarios define their own 'exec' functions.
  sleep(0.1);
}