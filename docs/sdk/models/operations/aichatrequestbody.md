# AiChatRequestBody

## Example Usage

```typescript
import { AiChatRequestBody } from "@aerostack/sdk-node/sdk/models/operations";

let value: AiChatRequestBody = {
  messages: [
    {},
  ],
  model: "@cf/meta/llama-3-8b-instruct",
};
```

## Fields

| Field                                                               | Type                                                                | Required                                                            | Description                                                         | Example                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `messages`                                                          | [operations.Messages](../../../sdk/models/operations/messages.md)[] | :heavy_check_mark:                                                  | N/A                                                                 |                                                                     |
| `model`                                                             | *string*                                                            | :heavy_minus_sign:                                                  | N/A                                                                 | @cf/meta/llama-3-8b-instruct                                        |