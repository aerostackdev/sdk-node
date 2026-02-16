# Storage

## Overview

File storage

### Available Operations

* [storageUpload](#storageupload) - Upload file to storage

## storageUpload

Upload file to storage

### Example Usage

<!-- UsageSnippet language="typescript" operationID="storageUpload" method="post" path="/storage/upload" -->
```typescript
import { SDK } from "@aerostack/sdk-node";
import { openAsBlob } from "node:fs";

const sdk = new SDK({
  apiKeyAuth: "<YOUR_API_KEY_HERE>",
});

async function run() {
  const result = await sdk.storage.storageUpload({
    file: await openAsBlob("example.file"),
    key: "avatars/user-123.jpg",
    contentType: "image/jpeg",
  });

  console.log(result);
}

run();
```

### Standalone function

The standalone function version of this method:

```typescript
import { SDKCore } from "@aerostack/sdk-node/core.js";
import { storageStorageUpload } from "@aerostack/sdk-node/funcs/storageStorageUpload.js";
import { openAsBlob } from "node:fs";

// Use `SDKCore` for best tree-shaking performance.
// You can create one instance of it to use across an application.
const sdk = new SDKCore({
  apiKeyAuth: "<YOUR_API_KEY_HERE>",
});

async function run() {
  const res = await storageStorageUpload(sdk, {
    file: await openAsBlob("example.file"),
    key: "avatars/user-123.jpg",
    contentType: "image/jpeg",
  });
  if (res.ok) {
    const { value: result } = res;
    console.log(result);
  } else {
    console.log("storageStorageUpload failed:", res.error);
  }
}

run();
```

### Parameters

| Parameter                                                                                                                                                                      | Type                                                                                                                                                                           | Required                                                                                                                                                                       | Description                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `request`                                                                                                                                                                      | [operations.StorageUploadRequestBody](../../sdk/models/operations/storageuploadrequestbody.md)                                                                                 | :heavy_check_mark:                                                                                                                                                             | The request object to use for the request.                                                                                                                                     |
| `options`                                                                                                                                                                      | RequestOptions                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                             | Used to set various options for making HTTP requests.                                                                                                                          |
| `options.fetchOptions`                                                                                                                                                         | [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request#options)                                                                                        | :heavy_minus_sign:                                                                                                                                                             | Options that are passed to the underlying HTTP request. This can be used to inject extra headers for examples. All `Request` options, except `method` and `body`, are allowed. |
| `options.retries`                                                                                                                                                              | [RetryConfig](../../lib/utils/retryconfig.md)                                                                                                                                  | :heavy_minus_sign:                                                                                                                                                             | Enables retrying HTTP requests under certain failure conditions.                                                                                                               |

### Response

**Promise\<[operations.StorageUploadResponseBody](../../sdk/models/operations/storageuploadresponsebody.md)\>**

### Errors

| Error Type      | Status Code     | Content Type    |
| --------------- | --------------- | --------------- |
| errors.SDKError | 4XX, 5XX        | \*/\*           |