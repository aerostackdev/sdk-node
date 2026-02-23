# GatewayBillingLogRequestBody

## Example Usage

```typescript
import { GatewayBillingLogRequestBody } from "@aerostack/sdk-node/sdk/models/operations";

let value: GatewayBillingLogRequestBody = {
  consumerId: "usr_123xyz",
  apiId: "api_chat_bot",
  metric: "tokens",
  units: 1500,
};
```

## Fields

| Field                                       | Type                                        | Required                                    | Description                                 | Example                                     |
| ------------------------------------------- | ------------------------------------------- | ------------------------------------------- | ------------------------------------------- | ------------------------------------------- |
| `consumerId`                                | *string*                                    | :heavy_check_mark:                          | The Consumer ID making the request          | usr_123xyz                                  |
| `apiId`                                     | *string*                                    | :heavy_check_mark:                          | The Developer Gateway API ID being consumed | api_chat_bot                                |
| `metric`                                    | *string*                                    | :heavy_minus_sign:                          | Optional metric name (default: 'units')     | tokens                                      |
| `units`                                     | *number*                                    | :heavy_check_mark:                          | Amount of usage to log                      | 1500                                        |