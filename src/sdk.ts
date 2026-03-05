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
