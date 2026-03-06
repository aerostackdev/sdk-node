import * as gen from './_generated/index.js';
import { NodeRealtimeClient } from './realtime.js';
import { AerostackClient } from '@aerostack/core';

export interface SDKOptions {
    /** 
     * Aerostack API Key. 
     * Use a Secret Key for server-side environments.
     */
    apiKey?: string;
    /** Alias for apiKey for backward compatibility */
    apiKeyAuth?: string;
    serverUrl?: string;
    /** Alias for serverUrl for backward compatibility */
    serverURL?: string;
    maxReconnectAttempts?: number;
    projectId?: string;
}

/** 
 * Compatibility wrapper for Database API 
 */
class DatabaseFacade {
    constructor(private api: gen.DatabaseApi) { }

    /**
     * Run a SQL query against your project database
     */
    async dbQuery(params: {
        dbQueryRequest?: gen.DbQueryRequest,
        requestBody?: gen.DbQueryRequest,
        xSDKVersion?: string,
        xRequestID?: string
    }) {
        return this.api.dbQuery({
            dbQueryRequest: params.dbQueryRequest || params.requestBody!,
            xSDKVersion: params.xSDKVersion,
            xRequestID: params.xRequestID
        });
    }
}

/**
 * Aerostack SDK Facade for Node.js.
 * Provides a clean, ergonomic API for all Aerostack services.
 *
 * Use `sdk.rpc` for the full enterprise API surface (cache bulk ops,
 * storage CRUD, db batch, queue job tracking, vector enhancements).
 * The top-level properties (cache, storage, etc.) use OpenAPI-generated
 * classes and are kept for backward compatibility.
 */
export class SDK {
    public readonly database: DatabaseFacade;
    public readonly auth: gen.AuthenticationApi;
    public readonly cache: gen.CacheApi;
    public readonly queue: gen.QueueApi;
    public readonly storage: gen.StorageApi;
    public readonly ai: gen.AIApi;
    public readonly services: gen.ServicesApi;
    public readonly gateway: gen.GatewayApi;
    public readonly realtime: NodeRealtimeClient;
    /**
     * Full enterprise RPC client — exposes all new methods:
     * cache.list/keys/getMany/setMany/deleteMany/flush/expire/increment
     * storage.get/getUrl/list/delete/exists/getMetadata/copy/move
     * db.batch, queue.getJob/listJobs/cancelJob
     * ai.search.update/get/count
     */
    public readonly rpc: AerostackClient;

    private config: gen.Configuration;

    constructor(options: SDKOptions = {}) {
        const serverUrl = options.serverUrl || options.serverURL || 'https://api.aerocall.ai/v1';
        const apiKey = options.apiKey || options.apiKeyAuth;

        this.config = new gen.Configuration({
            basePath: serverUrl,
            headers: apiKey ? { 'X-Aerostack-Key': apiKey } : {},
            apiKey: apiKey,
        });

        this.database = new DatabaseFacade(new gen.DatabaseApi(this.config));
        this.auth = new gen.AuthenticationApi(this.config);
        this.cache = new gen.CacheApi(this.config);
        this.queue = new gen.QueueApi(this.config);
        this.storage = new gen.StorageApi(this.config);
        this.ai = new gen.AIApi(this.config);
        this.services = new gen.ServicesApi(this.config);
        this.gateway = new gen.GatewayApi(this.config);

        // Enterprise client — full API surface
        this.rpc = new AerostackClient({
            baseUrl: serverUrl,
            apiKey,
            projectId: options.projectId,
        });

        this.realtime = new NodeRealtimeClient({
            serverUrl,
            apiKey: apiKey,
            projectId: options.projectId,
            maxReconnectAttempts: options.maxReconnectAttempts
        });
    }

    /**
     * Stream a gateway chat completion with token-by-token callbacks.
     *
     * @example
     * await sdk.streamGateway({
     *   apiSlug: 'my-chatbot',
     *   messages: [{ role: 'user', content: 'Hello' }],
     *   consumerKey: 'ask_live_...',
     *   onToken: (delta) => process.stdout.write(delta),
     * });
     */
    async streamGateway(opts: {
        apiSlug: string;
        messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
        consumerKey?: string;
        token?: string;
        systemPrompt?: string;
        onToken?: (delta: string) => void;
        onDone?: (usage: { tokensUsed: number }) => void;
        onError?: (error: Error) => void;
        signal?: AbortSignal;
    }): Promise<{ text: string; tokensUsed: number }> {
        const baseUrl = this.config.basePath.replace(/\/v1\/?$/, '');
        const endpoint = `${baseUrl}/api/gateway/${opts.apiSlug}/v1/chat/completions`;

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (opts.consumerKey) {
            headers['Authorization'] = `Bearer ${opts.consumerKey}`;
        } else if (opts.token) {
            headers['Authorization'] = `Bearer ${opts.token}`;
        }

        const messages = opts.systemPrompt
            ? [{ role: 'system' as const, content: opts.systemPrompt }, ...opts.messages]
            : opts.messages;

        let text = '';
        let totalTokens = 0;
        let estimatedTokens = 0;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({ messages, stream: true, stream_options: { include_usage: true } }),
                signal: opts.signal,
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({ error: 'Request failed' }));
                throw new Error((err as any).error || `HTTP ${response.status}`);
            }
            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const payload = line.slice(6).trim();
                    if (payload === '[DONE]') {
                        reader.cancel();
                        const result = { text, tokensUsed: totalTokens || estimatedTokens };
                        opts.onDone?.(result);
                        return result;
                    }
                    try {
                        const parsed = JSON.parse(payload);
                        const delta = parsed.choices?.[0]?.delta?.content;
                        if (delta) {
                            text += delta;
                            opts.onToken?.(delta);
                            estimatedTokens += Math.ceil(delta.length / 4);
                        }
                        if (parsed.usage?.total_tokens) totalTokens = parsed.usage.total_tokens;
                        else if (parsed.usage?.completion_tokens) totalTokens = parsed.usage.completion_tokens;
                    } catch { /* skip malformed frames */ }
                }
            }

            const result = { text, tokensUsed: totalTokens || estimatedTokens };
            opts.onDone?.(result);
            return result;
        } catch (err: any) {
            if (err.name === 'AbortError') return { text, tokensUsed: totalTokens || estimatedTokens };
            const error = err instanceof Error ? err : new Error(String(err));
            opts.onError?.(error);
            throw error;
        }
    }

    /**
     * Update the API key for subsequent requests.
     */
    setApiKey(apiKey: string): void {
        this.config = new gen.Configuration({
            ...this.config,
            headers: { ...this.config.headers, 'X-Aerostack-Key': apiKey },
            apiKey,
        });
        (this as any).database = new DatabaseFacade(new gen.DatabaseApi(this.config));
        (this as any).auth = new gen.AuthenticationApi(this.config);
        (this as any).cache = new gen.CacheApi(this.config);
        (this as any).queue = new gen.QueueApi(this.config);
        (this as any).storage = new gen.StorageApi(this.config);
        (this as any).ai = new gen.AIApi(this.config);
        (this as any).services = new gen.ServicesApi(this.config);
        (this as any).gateway = new gen.GatewayApi(this.config);
        (this as any).rpc = new AerostackClient({
            baseUrl: this.config.basePath,
            apiKey,
        });
    }
}

/** @deprecated Use SDK instead */
export const Aerostack = SDK;

// Export a default instance factory or just the class
export const createClient = (options: SDKOptions) => new SDK(options);
