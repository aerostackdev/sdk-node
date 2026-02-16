# Queue

## Overview

Background job queue

### Available Operations

* [queueEnqueue](#queueenqueue) - Add job to queue

## queueEnqueue

Add job to queue

### Example Usage

<!-- UsageSnippet language="typescript" operationID="queueEnqueue" method="post" path="/queue/enqueue" -->
```typescript
import { SDK } from "@aerostack/sdk-node";

const sdk = new SDK({
  apiKeyAuth: "<YOUR_API_KEY_HERE>",
});

async function run() {
  const result = await sdk.queue.queueEnqueue({
    type: "send-email",
    data: {
      "key": "<value>",
    },
    delay: 60,
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { SDKCore } from "@aerostack/sdk-node/core.js";
import { queueQueueEnqueue } from "@aerostack/sdk-node/funcs/queueQueueEnqueue.js";

// Use `SDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const sdk = new SDKCore({
  apiKeyAuth: "<YOUR_API_KEY_HERE>",
});

async function run() {
  const res = await queueQueueEnqueue(sdk, {
    type: "send-email",
    data: {
      "key": "<value>",
    },
    delay: 60,
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("queueQueueEnqueue failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.QueueEnqueueRequestBody](../../sdk/models/operations/queueenqueuerequestbody.md)                                                                                   | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.QueueEnqueueResponseBody](../../sdk/models/operations/queueenqueueresponsebody.md)\>**

### Errors

| Error Type      | Status Code     | Content Type    |
| --------------- | --------------- | --------------- |
| errors.SDKError | 4XX, 5XX        | \*/\*           |