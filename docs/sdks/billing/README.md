# Gateway.Billing

## Overview

### Available Operations

* [gatewayBillingLog](#gatewaybillinglog) - Log Gateway usage

## gatewayBillingLog

Manually log tokens or custom metric usage for a Gateway API

### Example Usage

<!-- UsageSnippet language="typescript" operationID="gatewayBillingLog" method="post" path="/gateway/billing/log" -->
```typescript
import { SDK } from "@aerostack/sdk-node";

const sdk = new SDK({
  apiKeyAuth: "<YOUR_API_KEY_HERE>",
});

async function run() {
  const result = await sdk.gateway.billing.gatewayBillingLog({
    consumerId: "usr_123xyz",
    apiId: "api_chat_bot",
    metric: "tokens",
    units: 1500,
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { SDKCore } from "@aerostack/sdk-node/core.js";
import { gatewayBillingGatewayBillingLog } from "@aerostack/sdk-node/funcs/gatewayBillingGatewayBillingLog.js";

// Use `SDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const sdk = new SDKCore({
  apiKeyAuth: "<YOUR_API_KEY_HERE>",
});

async function run() {
  const res = await gatewayBillingGatewayBillingLog(sdk, {
    consumerId: "usr_123xyz",
    apiId: "api_chat_bot",
    metric: "tokens",
    units: 1500,
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("gatewayBillingGatewayBillingLog failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.GatewayBillingLogRequestBody](../../sdk/models/operations/gatewaybillinglogrequestbody.md)                                                                         | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.GatewayBillingLogResponse](../../sdk/models/operations/gatewaybillinglogresponse.md)\>**

### Errors

| Error Type      | Status Code     | Content Type    |
| --------------- | --------------- | --------------- |
| errors.SDKError | 4XX, 5XX        | \*/\*           |