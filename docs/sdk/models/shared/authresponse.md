# AuthResponse

## Example Usage

```typescript
import { AuthResponse } from "@aerostack/sdk-node/sdk/models/shared";

let value: AuthResponse = {};
```

## Fields

| Field                                                                                         | Type                                                                                          | Required                                                                                      | Description                                                                                   |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `expiresAt`                                                                                   | [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) | :heavy_minus_sign:                                                                            | N/A                                                                                           |
| `token`                                                                                       | *string*                                                                                      | :heavy_minus_sign:                                                                            | JWT authentication token                                                                      |
| `user`                                                                                        | [shared.User](../../../sdk/models/shared/user.md)                                             | :heavy_minus_sign:                                                                            | N/A                                                                                           |