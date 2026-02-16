import { SDK } from "./src/sdk/sdk";

async function main() {
    const sdk = new SDK({
        bearerAuth: "test-token"
    });

    console.log("SDK.ai methods:", Object.keys(Object.getPrototypeOf(sdk.ai)));
    console.log("SDK.ai.search methods:", Object.keys(Object.getPrototypeOf(sdk.ai.search)));

    // Check if ingest exists
    if (typeof sdk.ai.search.ingest === 'function') {
        console.log("✅ search.ingest found");
    } else {
        console.log("❌ search.ingest NOT found");
    }
}

main().catch(console.error);
