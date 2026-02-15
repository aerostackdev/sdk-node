<!-- Start SDK Example Usage [usage] -->
```typescript
import { SDK } from "@aerostack/sdk-node";

const sdk = new SDK({
  apiKeyAuth: "<YOUR_API_KEY_HERE>",
});

async function run() {
  const result = await sdk.ai.aiChat({
    messages: [
      {},
    ],
    model: "@cf/meta/llama-3-8b-instruct",
  });

  console.log(result);
}

run();

```
<!-- End SDK Example Usage [usage] -->