# ErrorResponse

Invalid request

## Example Usage

```typescript
import { ErrorResponse } from "@aerostack/sdk-node/sdk/models/shared";

let value: ErrorResponse = {
  code: "VALIDATION_ERROR",
  message: "<value>",
};
```

## Fields

| Field                                             | Type                                              | Required                                          | Description                                       |
| ------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------- |
| `code`                                            | [shared.Code](../../../sdk/models/shared/code.md) | :heavy_check_mark:                                | N/A                                               |
| `message`                                         | *string*                                          | :heavy_check_mark:                                | N/A                                               |
| `details`                                         | Record<string, *any*>                             | :heavy_minus_sign:                                | N/A                                               |