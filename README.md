
# K6CodeGen

This is an Accelerator that is used to generate K6 code based on the human instructions. This generates the code for the following cases:-

- Load Testing(with scenarios 50%, 100%, 300% and 1000%)
- Scenarios (n number of scenarios with different exec methods)

## Installation
- Clone the repo to your machine.
- Run `npm install`. This will install necessary dependencies.
- Set up the `.env` file with the necessary variables and secrets.
- Run `npm run dev` if you are running as a developer. If you are executing it on a server use `npm run start`.

## Mandatory varibales in .env file
- LLM_PROVIDER=openai (or) google (or) ollama
- LLM_MODEL=<Specify Provider Model>
- GOOGLE_API_KEY (or) OPENAI_API_KEY (or) OLLAMA_BASE_URL=<api-key>
- OUTPUT_DIR=<path where the code to be generated>
- OUTPUT_SCENARIO_FILE=<name of the file with which the code is created>
- OUTPUT_LOAD_FILE_NAME=<name of the file with which the code is created>
- LOG_DIR=<path where the logs to be stored>
- LOG_MAX_SIZE=<Sets the maximum size of a single log file>
- LOG_MAX_FILES=<Sets the maximum files of a single log file>
- BASE_PATH=<Set the where Swagger file Present>



## Generating K6 for load test
Hit the url `/scenarios/load` with method type `POST`. The JSON body to send is as follows:

```JSON
{
  "scenarios": [
    {
      "virtualUser": "5",
      "startTime": "0",
      "name": "load_50"
    },
    {
      "virtualUser": "10",
      "startTime": "5m",
      "name": "load_100"
    },
    {
      "virtualUser": "30",
      "startTime": "10m",
      "name": "load_300"
    },
    {
      "virtualUser": "100",
      "startTime": "15m",
      "name": "load_1000"
    }
  ],
  "commonFields": {
    "tool" :"k6",
    "htmlReportName": "data",
    "htmlReportFilePath": "c://xyz/k6.html",
    "executor": "constant-vus",
    "iterator": 1,
    "swaggerFile": "c://xyz/swagger.yaml",
    "userInstructions": "Creates a new hive by submitting hive details to the server.  Retrieves the details of a specific hive using its unique ID.  Removes a hive record permanently from the system using its ID.",
    "apis": [
      {
        "id": "post-/service/api/hive/v1/hive",
        "pathName": "/service/api/hive/v1/hive",
        "description": "Creates a new hive",
        "method": "POST"
      },
      {
        "id": "get-/service/api/hive/v1/hive/{hiveID}",
        "pathName": "/service/api/hive/v1/hive/{hiveID}",
        "description": "Retrieves the details of a specific hive",
        "method": "GET"
      },
      {
        "id": "delete-/service/api/hive/v1/hive/{hiveID}",
        "pathName": "/service/api/hive/v1/hive/{hiveID}",
        "description": "Removes a hive record permanently",
        "method": "DELETE"
      }
    ],
    "duration": {
      "hours": 0,
      "minutes": 5,
      "seconds": 0,
      "milliseconds": 0
    },
    "thresholds": {
      "http_req_duration": [
        "p(95)<2000"
      ],
      "http_req_failed": [
        "rate<0.01"
      ]
    }
  }
}

```

## Generating JMeter for load test
Hit the url `/scenarios/load` with method type `POST`. The JSON body to send is as follows:

```JSON
{
    "scenarios": [
        {
            "threads": 50,
            "rampUp": 10,
            "duration": 50,
            "name": "TG_50_percent",
            "delay": 0
        },
        {
            "threads": 100,
            "rampUp": 10,
            "duration": 50,
            "name": "TG_100_percent",
            "delay": 50
        },
        {
            "threads": 200,
            "rampUp": 10,
            "duration": 50,
            "name": "TG_200_percent",
            "delay": 100
        },
        {
            "threads": 1000,
            "rampUp": 20,
            "duration": 50,
            "name": "TG_1000_percent",
            "delay": 150
        }
    ],
    "commonFields": {
        "tool": "jmeter",
        "swaggerFile": "pet.yaml",
        "userInstructions": "Adds a new pet using POST /pet. Fetch pet details using GET /pet/{petId}. Update pet using PUT /pet. Delete pet using DELETE /pet/{petId}. Fetch pets by status using GET /pet/findByStatus.",
        "apis": [
            {
                "method": "POST",
                "path": "/pet"
            },
            {
                "method": "GET",
                "path": "/pet/{petId}"
            },
            {
                "method": "PUT",
                "path": "/pet"
            },
            {
                "method": "DELETE",
                "path": "/pet/{petId}"
            },
            {
                "method": "GET",
                "path": "/pet/findByStatus"
            }
        ]
    }
}

```

## Generating K6 for Various scenarios
Hit the url `/scenarios/` with method type `POST`. The JSON body to send is as follows:

```JSON
{
  "config": {
    "tool" :"k6",
    "testName": "Hive Service Full Load Test",
    "htmlReportName": "data",
    "htmlReportFilePath": "c://xyz/k6.html",
    "thresholds": {
      "http_req_duration": ["p(95)<500"],
      "http_req_failed": ["rate<0.01"]
    }
  },
  "scenarios": [
    {
      "name": "create_hive_shared",
      "description": "Run a fixed total number of hive creation requests shared among VUs",
      "executor": "shared-iterations",
      "exec": "createHive",
      "vus": 5,
      "iterations": 50,
      "startTime": "0s",
      "gracefulStop": "5s",
      "swaggerFile": "c://xyz/swagger.yaml",
      "userInstructions": "Creates a new hive",
      "api": [{
        "method": "POST",
        "path": "/service/api/hive/v1/hive"
       
      }]
    },
    {
      "name": "get_hive_pervu",
      "description": "Each VU runs a fixed number of get hive requests",
      "executor": "per-vu-iterations",
      "exec": "getHive",
      "vus": 3,
      "iterations": 10,
      "startTime": "0s",
      "gracefulStop": "5s",
      "swaggerFile": "c://xyz/swagger.yaml",
      "userInstructions": "Retrieves the details of a specific hive using its unique ID",
      "api":[ {
        "method": "GET",
        "path": "/service/api/hive/v1/hive/{hiveID}"
       
      }]
    },
    {
      "name": "constant_vus_delete",
      "description": "Run constant number of users performing delete operations for a duration",
      "executor": "constant-vus",
      "exec": "deleteHive",
      "vus": 5,
      "duration": "1m",
      "startTime": "0s",
      "gracefulStop": "5s",
    "swaggerFile": "c://xyz/swagger.yaml",
      "userInstructions": "Removes a hive record permanently from the system using its ID",
      "api": [{
        "method": "DELETE",
        "path": "/service/api/hive/v1/hive/{hiveID}"
      }
    ]
    },
    {
      "name": "ramping_vus_create",
      "description": "Ramp VUs up and down to simulate load changes during hive creation",
      "executor": "ramping-vus",
      "exec": "createHive",
      "startTime": "0s",
      "startVUs": 0,
      "stages": [
        { "duration": "30s", "target": 5 },
        { "duration": "1m", "target": 10 },
        { "duration": "30s", "target": 0 }
      ],
      "gracefulRampDown": "10s",
      "swaggerFile": "c://xyz/swagger.yaml",
      "userInstructions": "Creates a new hive",
      "api": {
        "method": "POST",
        "path": "/service/api/hive/v1/hive"
      }
    },
    {
      "name": "constant_rate_get",
      "description": "Run a constant arrival rate of GET hive requests",
      "executor": "constant-arrival-rate",
      "exec": "getHive",
      "rate": 20,
      "timeUnit": "1s",
      "duration": "1m",
      "preAllocatedVUs": 10,
      "startTime": "0s",
      "maxVUs": 50,
      "gracefulStop": "5s",
      "swaggerFile": "c://xyz/swagger.yaml",
      "userInstructions": "Retrieves the details of a specific hive using its unique ID",
      "api":[ {
        "method": "GET",
        "path": "/service/api/hive/v1/hive/{hiveID}"
 
      }]
    },
    {
      "name": "ramping_rate_get",
      "description": "Ramp the request rate gradually for GET hive requests",
      "executor": "ramping-arrival-rate",
      "exec": "getHive",
      "startRate": 10,
      "timeUnit": "1s",
      "preAllocatedVUs": 10,
      "maxVUs": 50,
      "stages": [
        { "target": 20, "duration": "30s" },
        { "target": 50, "duration": "1m" },
        { "target": 0, "duration": "30s" }
      ],
      "gracefulStop": "10s",
    "swaggerFile": "c://xyz/swagger.yaml",
      "userInstructions": "Retrieves the details of a specific hive using its unique ID",
      "api": [{
        "method": "GET",
        "path": "/service/api/hive/v1/hive/{hiveID}"
     
      }]
    },
    {
      "name": "externally_controlled_delete",
      "description": "Externally controlled test for dynamic load changes",
      "executor": "externally-controlled",
      "exec": "deleteHive",
      "vus": 0,
      "startTime": "0s",
      "maxVUs": 100,
      "duration": "5m",
      "swaggerFile": "c://xyz/swagger.yaml",
      "userInstructions": "Removes a hive record permanently from the system using its ID",
      "api": [{
        "method": "DELETE",
        "path": "/service/api/hive/v1/hive/{hiveID}"
       
      }]
    }
  ]
}

```
## Generating JMeter for Various scenarios
Hit the url `/scenarios/` with method type `POST`. The JSON body to send is as follows:

```JSON

{
    "config": {
        "tool": "jmeter"
    },
  
  "scenarios": [
    {
      "name": "browse_all_products",
      "threads": 10,
      "rampUp": 10,
	  "duration": "5m",
      "delay": "0s",
      "swaggerFile": "StoreAPI.yaml",
      "userInstructions": "Fetch all available products from FakeStoreAPI,Fetch product details by ID ,Register a new user on the platform,Login an existing user,Create a new shopping cart for a logged-in user,Retrieve cart information by user ID",
      "api": [
        {
          "method": "GET",
          "path": "/products"
        },
		{
          "method": "GET",
          "path": "/products/{id}"
        },
		{
          "method": "POST",
          "path": "/users"
        },
		{
          "method": "POST",
          "path": "/auth/login"
        },
		{
          "method": "POST",
          "path": "/carts"
        },
		{
          "method": "GET",
          "path": "/carts/user/{userId}"
        }

      ]
    },
	{
      "name": "create_object_load_50",
      "threads": 5,
      "duration": "5m",
	  "rampUp": 10,
      "delay": "0s",
      "swaggerFile": "restful-api.yaml",
      "userInstructions": "Creates a demo object, retrieves its details, updates the object, and finally deletes it to simulate a full CRUD workflow on the RESTful API.",
      "api": [
        {
          "method": "POST",
          "path": "/objects"
        },
		{
          "method": "GET",
          "path": "/objects/{id}"
        },
		 {
          "method": "PUT",
          "path": "/objects/{id}"
        },
		{
          "method": "DELETE",
          "path": "/objects/{id}"
        }
		
      ]
    },
    {
      "name": "ramping_vus_add_pet",
       "threads": 5,
      "duration": "5m",
	  "rampUp": 10,
      "delay": "0s",
      "swaggerFile": "pet.yaml",
      "userInstructions": "Adds a new pet to the store using POST /pet.Retrieves details of a specific pet using GET /pet/{petId}.Updates existing pet data using PUT /pet.Deletes a pet from the store using DELETE /pet/{petId}.Fetches pets by status using GET /pet/findByStatus with query params.",
      "api": [{
        "method": "POST",
        "path": "/pet"
      },
	  {
        "method": "GET",
        "path": "/pet/{petId}"
      },
	   {
        "method": "PUT",
        "path": "/pet"
      },
	  {
        "method": "DELETE",
        "path": "/pet/{petId}"
      },
	  {
        "method": "GET",
        "path": "/pet/findByStatus"
      }
	  ]
    }
  ]
}

```

## Supported K6 Executors
Each executor defines how the load test will run and what parameters are required.

| **Executor**                 | **Mandatory Fields**                                                               | **Optional Fields**                                                                                  | **Description / Notes**                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 🟢 **shared-iterations**     | `executor`, `exec`, `vus`, `iterations`                                            | `gracefulStop`, `startTime`, `description`, `swaggerFile`, `userInstructions`, `api`                 | All VUs share a fixed total number of iterations. Ends when all iterations are completed. |
| 🟢 **per-vu-iterations**     | `executor`, `exec`, `vus`, `iterations`                                            | `gracefulStop`, `startTime`, `description`, `swaggerFile`, `userInstructions`, `api`                 | Each VU executes the same number of iterations independently.                        |
| 🟢 **constant-vus**          | `executor`, `exec`, `vus`, `duration`                                              | `gracefulStop`, `startTime`, `description`, `swaggerFile`, `userInstructions`, `api`                 | Runs a fixed number of VUs for a specific duration.                                  |
| 🟢 **ramping-vus**           | `executor`, `exec`, `stages`                                                       | `startVUs`, `gracefulRampDown`, `startTime`, `description`, `swaggerFile`, `userInstructions`, `api` | Adjusts the number of VUs dynamically over defined stages.                           |
| 🟢 **constant-arrival-rate** | `executor`, `exec`, `rate`, `timeUnit`, `duration`, `preAllocatedVUs`, `maxVUs`    | `gracefulStop`, `startTime`, `description`, `swaggerFile`, `userInstructions`, `api`                 | Maintains a constant request rate per time unit. Useful for RPS-based tests.         |
| 🟢 **ramping-arrival-rate**  | `executor`, `exec`, `startRate`, `timeUnit`, `stages`, `preAllocatedVUs`, `maxVUs` | `gracefulStop`, `startTime`, `description`, `swaggerFile`, `userInstructions`, `api`                 | Ramps request rate up/down over time. Useful for stress tests.                       |
| 🟢 **externally-controlled** | `executor`, `exec`,`duration`, `maxVUs`                                                       | `vus`,  `startTime`, `description`, `swaggerFile`, `userInstructions`, `api`              | Controlled via external API at runtime; no internal ramping or timing.               |


