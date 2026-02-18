<!-- Start SDK Example Usage [usage] -->
```typescript
import { SDK } from "@aerostack/sdk-node";

const sdk = new SDK({
  apiKeyAuth: "<YOUR_API_KEY_HERE>",
});

async function run() {
  const result = await sdk.database.dbQuery({
    xSDKVersion: "0.1.0",
    requestBody: {
      sql: "SELECT * FROM users WHERE active = ?",
      params: [
        true,
      ],
    },
  });

  console.log(result);
}

run();

```
<!-- End SDK Example Usage [usage] -->