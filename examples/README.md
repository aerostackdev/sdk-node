# @aerostack/sdk-node Examples

This directory contains example scripts demonstrating how to use the @aerostack/sdk-node SDK.

## Prerequisites

- Node.js (v18 or higher)
- npm

## Setup

1. Copy `.env.template` to `.env`:
   ```bash
   cp .env.template .env
   ```

2. Edit `.env` and add your actual credentials

## Available Examples

| Example | Description |
|---------|-------------|
| [**Express Integration**](./express-integration.ts) | Using SDK as middleware in an Express app. |
| [**Next.js API Route**](./next-api-route.ts) | Using SDK in Next.js (Pages Router) API handlers. |
| [**Standalone Auth**](./standalone-auth.ts) | Simple script for signup/login without a framework. |
| [**AI Chat**](./aiAIChat.example.ts) | Generated example for AI chat. |
| [**Database Query**](./databaseDbQuery.example.ts) | Generated example for DB usage. |

## Running the Examples

To run an example file from the examples directory:

```bash
npm run build && npx tsx example.ts
```

## Creating new examples

Duplicate an existing example file, they won't be overwritten by the generation process.


