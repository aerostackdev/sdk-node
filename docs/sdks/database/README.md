# Database

## Overview

SQL database operations

### Available Operations

* [dbQuery](#dbquery) - Execute SQL query

## dbQuery

Run a SQL query against your project database

### Example Usage

<!-- UsageSnippet language="typescript" operationID="dbQuery" method="post" path="/db/query" -->
```typescript
import { SDK } from "@aerostack/sdk-node";

const sdk = new SDK({
  apiKeyAuth: "<YOUR_API_KEY_HERE>",
});

async function run() {
  const result = await sdk.database.dbQuery({
    sql: "SELECT * FROM users WHERE active = ?",
    params: [
      true,
    ],
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { SDKCore } from "@aerostack/sdk-node/core.js";
import { databaseDbQuery } from "@aerostack/sdk-node/funcs/databaseDbQuery.js";

// Use `SDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const sdk = new SDKCore({
  apiKeyAuth: "<YOUR_API_KEY_HERE>",
});

async function run() {
  const res = await databaseDbQuery(sdk, {
    sql: "SELECT * FROM users WHERE active = ?",
    params: [
      true,
    ],
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("databaseDbQuery failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.DbQueryRequestBody](../../sdk/models/operations/dbqueryrequestbody.md)                                                                                             | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.DbQueryResponse](../../sdk/models/operations/dbqueryresponse.md)\>**

### Errors

| Error Type      | Status Code     | Content Type    |
| --------------- | --------------- | --------------- |
| errors.SDKError | 4XX, 5XX        | \*/\*           |