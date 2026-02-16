# IngestRequestBody

## Example Usage

```typescript
import { IngestRequestBody } from "@aerostack/sdk-node/sdk/models/operations";

let value: IngestRequestBody = {
  content: "<value>",
  type: "<value>",
};
```

## Fields

| Field                    | Type                     | Required                 | Description              |
| ------------------------ | ------------------------ | ------------------------ | ------------------------ |
| `content`                | *string*                 | :heavy_check_mark:       | Text content to index    |
| `id`                     | *string*                 | :heavy_minus_sign:       | Optional custom ID       |
| `type`                   | *string*                 | :heavy_check_mark:       | Category/type of content |
| `metadata`               | Record<string, *any*>    | :heavy_minus_sign:       | N/A                      |