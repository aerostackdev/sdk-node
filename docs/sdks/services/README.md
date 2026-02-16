# Services

## Overview

Cross-service invocation

### Available Operations

* [servicesInvoke](#servicesinvoke) - Invoke another service

## servicesInvoke

Invoke another service

### Example Usage

<!-- UsageSnippet language="typescript" operationID="servicesInvoke" method="post" path="/services/invoke" -->
```typescript
import { SDK } from "@aerostack/sdk-node";

const sdk = new SDK({
  apiKeyAuth: "<YOUR_API_KEY_HERE>",
});

async function run() {
  const result = await sdk.services.servicesInvoke({
    serviceName: "billing-webhook",
    data: {
      "key": "<value>",
      "key1": "<value>",
    },
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { SDKCore } from "@aerostack/sdk-node/core.js";
import { servicesServicesInvoke } from "@aerostack/sdk-node/funcs/servicesServicesInvoke.js";

// Use `SDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const sdk = new SDKCore({
  apiKeyAuth: "<YOUR_API_KEY_HERE>",
});

async function run() {
  const res = await servicesServicesInvoke(sdk, {
    serviceName: "billing-webhook",
    data: {
      "key": "<value>",
      "key1": "<value>",
    },
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("servicesServicesInvoke failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.ServicesInvokeRequestBody](../../sdk/models/operations/servicesinvokerequestbody.md)                                                                               | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.ServicesInvokeResponseBody](../../sdk/models/operations/servicesinvokeresponsebody.md)\>**

### Errors

| Error Type      | Status Code     | Content Type    |
| --------------- | --------------- | --------------- |
| errors.SDKError | 4XX, 5XX        | \*/\*           |