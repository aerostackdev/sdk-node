# QueueEnqueueRequestBody

## Example Usage

```typescript
import { QueueEnqueueRequestBody } from "@aerostack/sdk-node/sdk/models/operations";

let value: QueueEnqueueRequestBody = {
  data: {},
  delay: 60,
  type: "send-email",
};
```

## Fields

| Field                              | Type                               | Required                           | Description                        | Example                            |
| ---------------------------------- | ---------------------------------- | ---------------------------------- | ---------------------------------- | ---------------------------------- |
| `data`                             | Record<string, *any*>              | :heavy_check_mark:                 | N/A                                |                                    |
| `delay`                            | *number*                           | :heavy_minus_sign:                 | Delay in seconds before processing | 60                                 |
| `type`                             | *string*                           | :heavy_check_mark:                 | N/A                                | send-email                         |