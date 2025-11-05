
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
-
-
-

## Generating K6 for load test
Hit the url `/scenarios/load` with method type `POST`. The JSON body to send is as follows:

```JSON


```

## Generating K6 for Various scenarios
Hit the url `/scenarios/` with method type `POST`. The JSON body to send is as follows:

```JSON


```