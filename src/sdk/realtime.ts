/**
 * Aerostack Realtime Client for Node.js SDK
 * Production-hardened WebSocket client for server-side usage.
 */

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface RealtimeMessage {
    type: string;
    topic: string;
    [key: string]: any;
}

export interface RealtimeSubscriptionOptions {
    event?: RealtimeEvent;
    filter?: Record<string, any>;
}

export type RealtimeCallback<T = any> = (payload: RealtimePayload<T>) => void;

export interface RealtimePayload<T = any> {
    type: 'db_change' | 'chat_message';
    topic: string;
    operation: RealtimeEvent;
    data: T;
    old?: T;
    timestamp?: string;
    [key: string]: any;
}

export interface NodeRealtimeOptions {
    serverUrl: string;
    projectId: string;
    apiKey?: string | undefined;
    userId?: string | undefined;
    token?: string | undefined;
    maxReconnectAttempts?: number;
}

const BASE_RECONNECT_MS = 1000;
const MAX_RECONNECT_MS = 30000;
const JITTER_FACTOR = 0.3;

export class RealtimeSubscription<T = any> {
    private client: NodeRealtimeClient;
    private topic: string;
    private options: RealtimeSubscriptionOptions;
    private callbacks: Map<RealtimeEvent, Set<RealtimeCallback<T>>> = new Map();
    private _isSubscribed: boolean = false;

    constructor(client: NodeRealtimeClient, topic: string, options: RealtimeSubscriptionOptions = {}) {
        this.client = client;
        this.topic = topic;
        this.options = options;
    }

    on(event: RealtimeEvent, callback: RealtimeCallback<T>): this {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, new Set());
        }
        this.callbacks.get(event)!.add(callback);
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
    _emit(payload: RealtimePayload<T>): void {
        const event = payload.operation as RealtimeEvent;
        this.callbacks.get(event)?.forEach(cb => {
            try { cb(payload); } catch (e) { console.error('Realtime callback error:', e); }
        });
        this.callbacks.get('*')?.forEach(cb => {
            try { cb(payload); } catch (e) { console.error('Realtime callback error:', e); }
        });
    }
}

export type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export class NodeRealtimeClient {
    private wsUrl: string;
    private projectId: string;
    private apiKey: string | undefined;
    private userId: string | undefined;
    private token: string | undefined;
    private ws: any = null;
    private subscriptions: Map<string, RealtimeSubscription> = new Map();
    private reconnectTimer: any = null;
    private heartbeatTimer: any = null;
    private reconnectAttempts: number = 0;
    private _sendQueue: any[] = [];
    private _connectingPromise: Promise<void> | null = null;
    private _status: RealtimeStatus = 'idle';
    private _statusListeners: Set<(s: RealtimeStatus) => void> = new Set();
    private _lastPong: number = 0;
    private _maxReconnectAttempts: number;
    private _maxRetriesListeners: Set<() => void> = new Set();

    constructor(options: NodeRealtimeOptions) {
        const base = options.serverUrl.replace(/\/v1\/?$/, '').replace(/^http/, 'ws');
        this.wsUrl = `${base}/api/realtime`;
        this.projectId = options.projectId;
        this.apiKey = options.apiKey;
        this.userId = options.userId;
        this.token = options.token;
        this._maxReconnectAttempts = options.maxReconnectAttempts ?? Infinity;
    }

    get status(): RealtimeStatus { return this._status; }
    get connected(): boolean { return this._status === 'connected'; }

    onStatusChange(cb: (status: RealtimeStatus) => void): () => void {
        this._statusListeners.add(cb);
        return () => this._statusListeners.delete(cb);
    }

    onMaxRetriesExceeded(cb: () => void): () => void {
        this._maxRetriesListeners.add(cb);
        return () => this._maxRetriesListeners.delete(cb);
    }

    private _setStatus(s: RealtimeStatus) {
        this._status = s;
        this._statusListeners.forEach(cb => cb(s));
    }

    setToken(newToken: string): void {
        this.token = newToken;
        this._send({ type: 'auth', token: newToken });
    }

    async connect(): Promise<void> {
        if (this.ws && this._status === 'connected') return;
        if (this._connectingPromise) return this._connectingPromise;
        this._connectingPromise = this._doConnect().finally(() => {
            this._connectingPromise = null;
        });
        return this._connectingPromise;
    }

    private async _doConnect(): Promise<void> {
        this._setStatus('connecting');
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
                let WsClass: any;
                if (typeof globalThis.WebSocket !== 'undefined') {
                    WsClass = globalThis.WebSocket;
                } else {
                    try {
                        const ws = await import('ws');
                        WsClass = ws.default || ws;
                    } catch {
                        throw new Error('WebSocket not available. Install "ws" package.');
                    }
                }

                this.ws = new WsClass(url.toString());

                this.ws.onopen = () => {
                    this._setStatus('connected');
                    this.reconnectAttempts = 0;
                    this._lastPong = Date.now();
                    this.startHeartbeat();
                    while (this._sendQueue.length > 0) {
                        this.ws.send(JSON.stringify(this._sendQueue.shift()));
                    }
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
                    this._setStatus('reconnecting');
                    this.stopHeartbeat();
                    this.ws = null;
                    this.scheduleReconnect();
                };

                this.ws.onerror = (err: any) => {
                    console.error('Realtime connection error:', err);
                    this._setStatus('disconnected');
                    reject(err);
                };
            } catch (e) {
                this._setStatus('disconnected');
                reject(e);
            }
        });
    }

    disconnect(): void {
        this._setStatus('disconnected');
        this.stopReconnect();
        this.stopHeartbeat();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this._sendQueue = [];
    }

    channel<T = any>(topic: string, options: RealtimeSubscriptionOptions = {}): RealtimeSubscription<T> {
        const fullTopic = topic.includes('/') ? topic : `table/${topic}/${this.projectId}`;
        let sub = this.subscriptions.get(fullTopic);
        if (!sub) {
            sub = new RealtimeSubscription<T>(this, fullTopic, options);
            this.subscriptions.set(fullTopic, sub);
        }
        return sub as RealtimeSubscription<T>;
    }

    sendChat(roomId: string, text: string): void {
        this._send({ type: 'chat', roomId, text });
    }

    chatRoom(roomId: string): RealtimeSubscription {
        return this.channel(`chat/${roomId}/${this.projectId}`);
    }

    /** @internal */
    _send(data: any): void {
        if (this.ws && this._status === 'connected') {
            this.ws.send(JSON.stringify(data));
        } else {
            this._sendQueue.push(data);
        }
    }

    private handleMessage(data: RealtimeMessage): void {
        if (data.type === 'pong') {
            this._lastPong = Date.now();
            return;
        }
        if (data.type === 'db_change' || data.type === 'chat_message') {
            const sub = this.subscriptions.get(data.topic);
            if (sub) sub._emit(data as any);
        }
    }

    private startHeartbeat(): void {
        this.heartbeatTimer = setInterval(() => {
            this._send({ type: 'ping' });
            if (this._lastPong > 0 && Date.now() - this._lastPong > 70000) {
                console.warn('Realtime: no pong received, forcing reconnect');
                this.ws?.close();
            }
        }, 30000);
    }

    private stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    private scheduleReconnect(): void {
        this.stopReconnect();
        if (this.reconnectAttempts >= this._maxReconnectAttempts) {
            this._setStatus('disconnected');
            this._maxRetriesListeners.forEach(cb => cb());
            return;
        }
        const delay = Math.min(BASE_RECONNECT_MS * Math.pow(2, this.reconnectAttempts), MAX_RECONNECT_MS);
        const jitter = delay * JITTER_FACTOR * Math.random();
        this.reconnectAttempts++;
        this.reconnectTimer = setTimeout(() => {
            this.connect().catch(() => { });
        }, delay + jitter);
    }

    private stopReconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
}
