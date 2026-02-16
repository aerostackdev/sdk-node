# QueryRequestBody

## Example Usage

```typescript
import { QueryRequestBody } from "@aerostack/sdk-node/sdk/models/operations";

let value: QueryRequestBody = {
  text: "<value>",
};
```

## Fields

| Field                 | Type                  | Required              | Description           |
| --------------------- | --------------------- | --------------------- | --------------------- |
| `text`                | *string*              | :heavy_check_mark:    | N/A                   |
| `topK`                | *number*              | :heavy_minus_sign:    | N/A                   |
| `types`               | *string*[]            | :heavy_minus_sign:    | N/A                   |
| `filter`              | Record<string, *any*> | :heavy_minus_sign:    | N/A                   |