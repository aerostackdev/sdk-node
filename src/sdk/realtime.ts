/**
 * Aerostack Realtime Client for Node.js SDK
 * Provides WebSocket-based real-time data subscription for server-side usage.
 * 
 * This is NOT auto-generated — it is a hand-written extension for the Node SDK.
 */

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface RealtimeMessage {
    type: string;
    topic: string;
    [key: string]: any;
}

interface RealtimeSubscriptionOptions {
    event?: RealtimeEvent;
    filter?: Record<string, any>;
}

type RealtimeCallback = (payload: any) => void;

interface NodeRealtimeOptions {
    /** Base API URL (e.g. https://api.aerostack.ai/v1) */
    serverUrl: string;
    /** Project ID to subscribe to */
    projectId: string;
    /** API Key for authentication (recommended for server-side) */
    apiKey?: string | undefined;
    /** User ID (optional) */
    userId?: string | undefined;
    /** Bearer token (optional, for user-context connections) */
    token?: string | undefined;
}

// Constants for exponential backoff
const BASE_RECONNECT_MS = 1000;
const MAX_RECONNECT_MS = 30000;
const JITTER_FACTOR = 0.3;

export class RealtimeSubscription {
    private client: NodeRealtimeClient;
    private topic: string;
    private options: RealtimeSubscriptionOptions;
    private callbacks: Set<RealtimeCallback> = new Set();
    private _isSubscribed: boolean = false;

    constructor(client: NodeRealtimeClient, topic: string, options: RealtimeSubscriptionOptions = {}) {
        this.client = client;
        this.topic = topic;
        this.options = options;
    }

    on(_event: RealtimeEvent, callback: RealtimeCallback): this {
        this.callbacks.add(callback);
        return this;
    }

    subscribe(): this {
        if (this._isSubscribed) return this;
        this.client._send({
            type: 'subscribe',
            topic: this.topic,
            filter: this.options.filter
        });
        this._isSubscribed = true;
        return this;
    }

    unsubscribe(): void {
        if (!this._isSubscribed) return;
        this.client._send({
            type: 'unsubscribe',
            topic: this.topic
        });
        this._isSubscribed = false;
        this.callbacks.clear();
    }

    get isSubscribed() { return this._isSubscribed; }

    /** @internal */
    _emit(payload: any): void {
        const event = payload.operation as RealtimeEvent;
        const requestedEvent = this.options.event || '*';

        if (requestedEvent === '*' || requestedEvent === event) {
            for (const cb of this.callbacks) {
                try {
                    cb(payload);
                } catch (e) {
                    console.error('Realtime callback error:', e);
                }
            }
        }
    }
}

export class NodeRealtimeClient {
    private wsUrl: string;
    private projectId: string;
    private apiKey: string | undefined;
    private userId: string | undefined;
    private token: string | undefined;
    private ws: any = null; // WebSocket instance (from 'ws' or global)
    private subscriptions: Map<string, RealtimeSubscription> = new Map();
    private reconnectTimer: any = null;
    private heartbeatTimer: any = null;
    private reconnectAttempts: number = 0;
    private _connected: boolean = false;

    constructor(options: NodeRealtimeOptions) {
        // Convert HTTP URL to WS URL
        const base = options.serverUrl.replace(/\/v1\/?$/, '').replace(/^http/, 'ws');
        this.wsUrl = `${base}/api/realtime`;
        this.projectId = options.projectId;
        this.apiKey = options.apiKey;
        this.userId = options.userId;
        this.token = options.token;
    }

    get connected(): boolean { return this._connected; }

    async connect(): Promise<void> {
        if (this.ws) return;

        // Build URL with query params
        const url = new URL(this.wsUrl);
        if (this.apiKey) {
            url.searchParams.set('apiKey', this.apiKey);
        } else {
            url.searchParams.set('projectId', this.projectId);
        }
        if (this.userId) url.searchParams.set('userId', this.userId);
        if (this.token) url.searchParams.set('token', this.token);

        return new Promise(async (resolve, reject) => {
            try {
                // Try native WebSocket first (Bun, Deno, modern Node 22+)
                // Fall back to 'ws' package for older Node versions
                let WsClass: any;
                if (typeof globalThis.WebSocket !== 'undefined') {
                    WsClass = globalThis.WebSocket;
                } else {
                    try {
                        const ws = await import('ws');
                        WsClass = ws.default || ws;
                    } catch {
                        throw new Error(
                            'WebSocket not available. Install the "ws" package: npm install ws'
                        );
                    }
                }

                this.ws = new WsClass(url.toString());

                this.ws.onopen = () => {
                    this._connected = true;
                    this.reconnectAttempts = 0; // Reset backoff on success
                    this.startHeartbeat();
                    // Re-subscribe existing topics
                    for (const sub of this.subscriptions.values()) {
                        if (sub.isSubscribed) sub.subscribe();
                    }
                    resolve();
                };

                this.ws.onmessage = (event: any) => {
                    try {
                        const raw = typeof event === 'string' ? event : event.data;
                        const data: RealtimeMessage = JSON.parse(raw);
                        this.handleMessage(data);
                    } catch (e) {
                        console.error('Realtime message parse error:', e);
                    }
                };

                this.ws.onclose = () => {
                    this._connected = false;
                    this.stopHeartbeat();
                    this.ws = null;
                    this.scheduleReconnect();
                };

                this.ws.onerror = (err: any) => {
                    if (!this._connected) {
                        reject(err);
                    }
                };
            } catch (e) {
                reject(e);
            }
        });
    }

    disconnect(): void {
        this.stopReconnect();
        this.stopHeartbeat();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this._connected = false;
    }

    channel(topic: string, options: RealtimeSubscriptionOptions = {}): RealtimeSubscription {
        const fullTopic = topic.includes('/') ? topic : `table/${topic}/${this.projectId}`;

        let sub = this.subscriptions.get(fullTopic);
        if (!sub) {
            sub = new RealtimeSubscription(this, fullTopic, options);
            this.subscriptions.set(fullTopic, sub);
        }
        return sub;
    }

    /** @internal */
    _send(data: any): void {
        if (this.ws && this._connected) {
            this.ws.send(JSON.stringify(data));
        }
    }

    private handleMessage(data: RealtimeMessage): void {
        if (data.type === 'db_change' || data.type === 'chat_message') {
            const sub = this.subscriptions.get(data.topic);
            if (sub) sub._emit(data);
        }
    }

    private startHeartbeat(): void {
        this.heartbeatTimer = setInterval(() => {
            this._send({ type: 'ping' });
        }, 30000);
    }

    private stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    /** Exponential backoff with jitter */
    private scheduleReconnect(): void {
        this.stopReconnect();
        const delay = Math.min(
            BASE_RECONNECT_MS * Math.pow(2, this.reconnectAttempts),
            MAX_RECONNECT_MS
        );
        const jitter = delay * JITTER_FACTOR * Math.random();
        const finalDelay = delay + jitter;

        this.reconnectAttempts++;
        this.reconnectTimer = setTimeout(() => {
            this.connect().catch(() => { });
        }, finalDelay);
    }

    private stopReconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
}
