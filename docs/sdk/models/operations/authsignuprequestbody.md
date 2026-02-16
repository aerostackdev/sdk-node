# AuthSignupRequestBody

## Example Usage

```typescript
import { AuthSignupRequestBody } from "@aerostack/sdk-node/sdk/models/operations";

let value: AuthSignupRequestBody = {
  email: "user@example.com",
  password: "SecurePass123!",
  name: "John Doe",
};
```

## Fields

| Field                 | Type                  | Required              | Description           | Example               |
| --------------------- | --------------------- | --------------------- | --------------------- | --------------------- |
| `email`               | *string*              | :heavy_check_mark:    | N/A                   | user@example.com      |
| `password`            | *string*              | :heavy_check_mark:    | N/A                   | SecurePass123!        |
| `name`                | *string*              | :heavy_minus_sign:    | N/A                   | John Doe              |
| `metadata`            | Record<string, *any*> | :heavy_minus_sign:    | N/A                   |                       |