# DbQueryRequestBody

## Example Usage

```typescript
import { DbQueryRequestBody } from "@aerostack/sdk-node/sdk/models/operations";

let value: DbQueryRequestBody = {
  sql: "SELECT * FROM users WHERE active = ?",
  params: [
    true,
  ],
};
```

## Fields

| Field                                    | Type                                     | Required                                 | Description                              | Example                                  |
| ---------------------------------------- | ---------------------------------------- | ---------------------------------------- | ---------------------------------------- | ---------------------------------------- |
| `sql`                                    | *string*                                 | :heavy_check_mark:                       | SQL query to execute                     | SELECT * FROM users WHERE active = ?     |
| `params`                                 | *any*[]                                  | :heavy_minus_sign:                       | Query parameters for prepared statements | [<br/>true<br/>]                         |