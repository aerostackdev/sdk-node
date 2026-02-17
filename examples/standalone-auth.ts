import { Aerostack } from '@aerostack/node';

/**
 * Standalone Auth Example
 * 
 * Simple script to demonstrate authentication flow.
 */

const sdk = new Aerostack();

async function main() {
    const email = `node-user-${Date.now()}@example.com`;
    const password = 'Password123!';

    console.log(`Attempting to register ${email}...`);

    const signupRes = await sdk.authentication.authSignup({
        email,
        password,
        name: "NodeJS User"
    });

    if (!signupRes.ok) {
        console.error("Signup failed:", signupRes.error);
        return;
    }

    console.log("Signup success:", signupRes.value);

    console.log("Attempting to login...");
    const loginRes = await sdk.authentication.authSignin({
        email,
        password
    });

    if (!loginRes.ok) {
        console.error("Login failed:", loginRes.error);
        return;
    }

    console.log("Login success. Token:", loginRes.value.token);
}

main();
