import express, { Request, Response, NextFunction } from 'express';
import { Aerostack } from '@aerostack/node';

/**
 * Express Integration Example
 * 
 * Demonstrates how to use the Aerostack Node.js SDK with Express.
 */

const app = express();
const port = 3000;

// Initialize SDK
const sdk = new Aerostack({
    // security: { apiKeyAuth: process.env.AEROSTACK_API_KEY } // Optional for public endpoints
});

// Middleware to add SDK to request
const withAerostack = (req: Request, res: Response, next: NextFunction) => {
    (req as any).aerostack = sdk;
    next();
};

app.use(express.json());
app.use(withAerostack);

// Endpoint to signup a user
app.post('/signup', async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

    try {
        const result = await sdk.authentication.authSignup({
            email,
            password,
            name
        });

        if (result.ok) {
            res.status(201).json(result.value);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to query database
app.get('/users', async (req: Request, res: Response) => {
    try {
        const result = await sdk.database.dbQuery({
            query: "SELECT * FROM users LIMIT 10"
        });

        if (result.ok) {
            res.json(result.value);
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
