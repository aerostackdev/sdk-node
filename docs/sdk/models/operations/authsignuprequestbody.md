# AuthSignupRequestBody

## Example Usage

```typescript
import { AuthSignupRequestBody } from "@aerostack/sdk-node/sdk/models/operations";

let value: AuthSignupRequestBody = {
  email: "user@example.com",
  name: "John Doe",
  password: "SecurePass123!",
};
```

## Fields

| Field                 | Type                  | Required              | Description           | Example               |
| --------------------- | --------------------- | --------------------- | --------------------- | --------------------- |
| `email`               | *string*              | :heavy_check_mark:    | N/A                   | user@example.com      |
| `metadata`            | Record<string, *any*> | :heavy_minus_sign:    | N/A                   |                       |
| `name`                | *string*              | :heavy_minus_sign:    | N/A                   | John Doe              |
| `password`            | *string*              | :heavy_check_mark:    | N/A                   | SecurePass123!        |