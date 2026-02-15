# CacheSetRequestBody

## Example Usage

```typescript
import { CacheSetRequestBody } from "@aerostack/sdk-node/sdk/models/operations";

let value: CacheSetRequestBody = {
  key: "<key>",
  ttl: 3600,
  value: "<value>",
};
```

## Fields

| Field                   | Type                    | Required                | Description             | Example                 |
| ----------------------- | ----------------------- | ----------------------- | ----------------------- | ----------------------- |
| `key`                   | *string*                | :heavy_check_mark:      | N/A                     |                         |
| `ttl`                   | *number*                | :heavy_minus_sign:      | Time to live in seconds | 3600                    |
| `value`                 | *any*                   | :heavy_check_mark:      | N/A                     |                         |