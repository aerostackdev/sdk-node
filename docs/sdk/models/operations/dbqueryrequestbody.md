# DbQueryRequestBody

## Example Usage

```typescript
import { DbQueryRequestBody } from "@aerostack/sdk-node/sdk/models/operations";

let value: DbQueryRequestBody = {
  params: [
    true,
  ],
  sql: "SELECT * FROM users WHERE active = ?",
};
```

## Fields

| Field                                    | Type                                     | Required                                 | Description                              | Example                                  |
| ---------------------------------------- | ---------------------------------------- | ---------------------------------------- | ---------------------------------------- | ---------------------------------------- |
| `params`                                 | *any*[]                                  | :heavy_minus_sign:                       | Query parameters for prepared statements | [<br/>true<br/>]                         |
| `sql`                                    | *string*                                 | :heavy_check_mark:                       | SQL query to execute                     | SELECT * FROM users WHERE active = ?     |