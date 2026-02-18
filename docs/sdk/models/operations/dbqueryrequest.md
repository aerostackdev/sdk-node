# DbQueryRequest

## Example Usage

```typescript
import { DbQueryRequest } from "@aerostack/sdk-node/sdk/models/operations";

let value: DbQueryRequest = {
  xSDKVersion: "0.1.0",
  requestBody: {
    sql: "SELECT * FROM users WHERE active = ?",
    params: [
      true,
    ],
  },
};
```

## Fields

| Field                                                                                 | Type                                                                                  | Required                                                                              | Description                                                                           | Example                                                                               |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `xRequestID`                                                                          | *string*                                                                              | :heavy_minus_sign:                                                                    | Unique request tracing ID                                                             |                                                                                       |
| `xSDKVersion`                                                                         | *string*                                                                              | :heavy_minus_sign:                                                                    | SDK version string                                                                    | 0.1.0                                                                                 |
| `requestBody`                                                                         | [operations.DbQueryRequestBody](../../../sdk/models/operations/dbqueryrequestbody.md) | :heavy_check_mark:                                                                    | N/A                                                                                   |                                                                                       |