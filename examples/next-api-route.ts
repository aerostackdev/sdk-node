import { Aerostack } from '@aerostack/node';
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Next.js API Route Example
 * 
 * Demonstrates how to use the Aerostack Node.js SDK in a Next.js API route.
 * (Pages Router style, but concepts apply to App Router too)
 */

const sdk = new Aerostack({
    // security: { apiKeyAuth: process.env.AEROSTACK_API_KEY }
});

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'POST') {
        // Handle Signup
        const { email, password } = req.body;

        const result = await sdk.authentication.authSignup({
            email,
            password,
            name: email.split('@')[0]
        });

        if (!result.ok) {
            return res.status(400).json({ error: result.error });
        }

        return res.status(200).json(result.value);
    } else {
        // Handle GET - e.g. list some data
        const result = await sdk.database.dbQuery({
            query: "SELECT count(*) as count FROM users"
        });

        if (!result.ok) {
            return res.status(500).json({ error: result.error });
        }

        return res.status(200).json(result.value);
    }
}
