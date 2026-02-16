# AiChatRequestBody

## Example Usage

```typescript
import { AiChatRequestBody } from "@aerostack/sdk-node/sdk/models/operations";

let value: AiChatRequestBody = {
  model: "@cf/meta/llama-3-8b-instruct",
  messages: [
    {},
  ],
};
```

## Fields

| Field                                                               | Type                                                                | Required                                                            | Description                                                         | Example                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `model`                                                             | *string*                                                            | :heavy_minus_sign:                                                  | N/A                                                                 | @cf/meta/llama-3-8b-instruct                                        |
| `messages`                                                          | [operations.Messages](../../../sdk/models/operations/messages.md)[] | :heavy_check_mark:                                                  | N/A                                                                 |                                                                     |