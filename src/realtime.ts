/**
 * Aerostack Realtime Client for Node.js SDK
 */

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*' | string;

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

/** Typed payload for realtime events */
export interface RealtimePayload<T = any> {
    type: 'db_change' | 'chat_message' | 'event';
    topic: string;
    operation?: RealtimeEvent;
    event?: string;
    data: T;
    old?: T;
    userId?: string;
    timestamp?: number | string;
    [key: string]: any;
}

/** Chat history message returned from REST API */
export interface HistoryMessage {
    id: string;
    room_id: string;
    user_id: string;
    event: string;
    data: any;
    created_at: number;
}

export interface NodeRealtimeOptions {
    serverUrl: string;
    apiKey?: string;
    token?: string;
    projectId?: string;
    maxReconnectAttempts?: number;
}

const BASE_RECONNECT_MS = 1000;
const MAX_RECONNECT_MS = 30000;
const JITTER_FACTOR = 0.3;

export class RealtimeSubscription<T = any> {
    private client: NodeRealtimeClient;
    topic: string;
    private options: RealtimeSubscriptionOptions;
    private callbacks: Map<string, Set<RealtimeCallback<T>>> = new Map();
    private _isSubscribed: boolean = false;

    constructor(client: NodeRealtimeClient, topic: string, options: RealtimeSubscriptionOptions = {}) {
        this.client = client;
        this.topic = topic;
        this.options = options;
    }

    /** Listen for DB change events (INSERT/UPDATE/DELETE/*) or custom named events */
    on(event: RealtimeEvent | string, callback: RealtimeCallback<T>): this {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, new Set());
        }
        this.callbacks.get(event)!.add(callback);
        return this;
    }

    /** Remove a specific callback for an event */
    off(event: RealtimeEvent | string, callback: RealtimeCallback<T>): this {
        this.callbacks.get(event)?.delete(callback);
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
        this.client._removeSubscription(this.topic);
    }

    get isSubscribed() { return this._isSubscribed; }

    // ─── Phase 1: Pub/Sub — Publish custom events ─────────────────────────
    /** Publish a custom event to all subscribers on this channel */
    publish(event: string, data: any, options?: { persist?: boolean }): void {
        this.client._send({
            type: 'publish',
            topic: this.topic,
            event,
            data,
            persist: options?.persist,
            id: this.client._generateId(),
        });
    }

    // ─── Phase 2: Chat History ────────────────────────────────────────────
    /** Fetch persisted message history for this channel (requires persist: true on publish) */
    async getHistory(limit: number = 50, before?: number): Promise<HistoryMessage[]> {
        return this.client._fetchHistory(this.topic, limit, before);
    }

    // ─── Phase 3: Presence ────────────────────────────────────────────────
    /** Track this user's presence state on this channel (auto-synced to subscribers) */
    track(state: Record<string, any>): void {
        this.client._send({
            type: 'track',
            topic: this.topic,
            state,
        });
    }

    /** Stop tracking presence on this channel */
    untrack(): void {
        this.client._send({
            type: 'untrack',
            topic: this.topic,
        });
    }

    /** @internal */
    _emit(payload: RealtimePayload<T>): void {
        // DB change events (INSERT/UPDATE/DELETE)
        if (payload.operation) {
            const event = payload.operation as string;
            this.callbacks.get(event)?.forEach(cb => cb(payload));
        }
        // Custom named events ('player-moved', 'presence:join', etc.)
        if (payload.event) {
            this.callbacks.get(payload.event)?.forEach(cb => cb(payload));
        }
        // Catch-all
        this.callbacks.get('*')?.forEach(cb => {
            try { cb(payload); } catch (e) { console.error('Realtime callback error:', e); }
        });
    }
}

export type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export class NodeRealtimeClient {
    private wsUrl: string;
    private apiKey?: string;
    private token?: string;
    private projectId?: string;
    private ws: WebSocket | null = null;
    private subscriptions: Map<string, RealtimeSubscription> = new Map();
    private reconnectTimer: any = null;
    private heartbeatTimer: any = null;
    private reconnectAttempts: number = 0;
    private _sendQueue: any[] = [];
    private _connectingPromise: Promise<void> | null = null;
    private _status: RealtimeStatus = 'idle';
    private _statusListeners: Set<(s: RealtimeStatus) => void> = new Set();
    // HTTP base URL for REST endpoints (history, etc.)
    private _httpBaseUrl: string;
    private _lastPong: number = 0;
    private _maxReconnectAttempts: number;
    private _maxRetriesListeners: Set<() => void> = new Set();

    constructor(options: NodeRealtimeOptions) {
        const uri = new URL(options.serverUrl);
        uri.protocol = uri.protocol === 'https:' ? 'wss:' : 'ws:';
        uri.pathname = uri.pathname.replace(/\/v1\/?$/, '') + '/api/realtime';
        this.wsUrl = uri.toString();
        this._httpBaseUrl = options.serverUrl.replace(/\/v1\/?$/, '');
        this.apiKey = options.apiKey;
        this.token = options.token;
        this.projectId = options.projectId;
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
        if (this.projectId) url.searchParams.set('projectId', this.projectId);

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

                // SECURITY: Pass credentials via Sec-WebSocket-Protocol header — never as URL query params
                // (URL params appear in CDN logs, browser history, and Referer headers).
                const protocols: string[] = [];
                if (this.apiKey) protocols.push(`aerostack-key.${this.apiKey}`);
                if (this.token) protocols.push(`aerostack-token.${this.token}`);
                if (protocols.length > 0) protocols.push('aerostack-v1');
                const protocolsArg = protocols.length > 0 ? protocols : undefined;
                this.ws = protocolsArg ? new WsClass(url.toString(), protocolsArg) : new WsClass(url.toString());

                this.ws!.onopen = () => {
                    this._setStatus('connected');
                    this.reconnectAttempts = 0;
                    this._lastPong = Date.now();
                    this.startHeartbeat();
                    while (this._sendQueue.length > 0) {
                        this.ws!.send(JSON.stringify(this._sendQueue.shift()));
                    }
                    for (const sub of this.subscriptions.values()) {
                        if (sub.isSubscribed) sub.subscribe();
                    }
                    resolve();
                };

                this.ws!.onmessage = (event: any) => {
                    try {
                        const raw = typeof event === 'string' ? event : event.data;
                        const data: RealtimeMessage = JSON.parse(raw);
                        this.handleMessage(data);
                    } catch (e) {
                        console.error('Realtime message parse error:', e);
                    }
                };

                this.ws!.onclose = () => {
                    this._setStatus('reconnecting');
                    this.stopHeartbeat();
                    this.ws = null;
                    this.scheduleReconnect();
                };

                this.ws!.onerror = (err: any) => {
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
        if (!this.projectId) {
            throw new Error('projectId is required for channel subscriptions. Set it in NodeRealtimeOptions.');
        }
        let fullTopic: string;
        if (!topic.includes('/')) {
            fullTopic = `table/${topic}/${this.projectId}`;
        } else if (this.projectId && topic.endsWith(`/${this.projectId}`)) {
            fullTopic = topic; // already fully qualified
        } else {
            fullTopic = `${topic}/${this.projectId}`; // e.g. 'table/orders' → 'table/orders/<projectId>'
        }
        let sub = this.subscriptions.get(fullTopic);
        if (!sub) {
            sub = new RealtimeSubscription<T>(this, fullTopic, options);
            this.subscriptions.set(fullTopic, sub);
        }
        return sub as RealtimeSubscription<T>;
    }

    /** Legacy: send a chat message (now persisted to DB) */
    sendChat(roomId: string, text: string, metadata?: Record<string, any>): void {
        this._send({ type: 'chat', roomId, text, metadata });
    }

    /** @internal — Generate unique message ID for ack tracking */
    _generateId(): string {
        return Math.random().toString(36).slice(2) + Date.now().toString(36);
    }

    /** @internal — Remove a subscription from the map (called on unsubscribe) */
    _removeSubscription(topic: string): void {
        this.subscriptions.delete(topic);
    }

    /** @internal */
    _send(data: any): void {
        if (this.ws && this._status === 'connected') {
            this.ws.send(JSON.stringify(data));
        } else {
            this._sendQueue.push(data);
        }
    }

    /** @internal — Fetch chat/event history via REST API */
    async _fetchHistory(room: string, limit: number = 50, before?: number): Promise<HistoryMessage[]> {
        const url = new URL(`${this._httpBaseUrl}/api/v1/public/realtime/history`);
        url.searchParams.set('room', room);
        url.searchParams.set('limit', String(limit));
        if (before) url.searchParams.set('before', String(before));

        const headers: Record<string, string> = {};
        if (this.apiKey) headers['X-Aerostack-Key'] = this.apiKey;
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

        const res = await fetch(url.toString(), { headers });
        const json = await res.json() as any;
        return json.messages || [];
    }

    private handleMessage(data: RealtimeMessage): void {
        // Track pong for liveness
        if (data.type === 'pong') {
            this._lastPong = Date.now();
            return;
        }

        // Ack (fire-and-forget acknowledgment from server)
        if (data.type === 'ack') {
            return;
        }

        // Route to subscription: db_change, chat_message, event, presence:*
        if (data.type === 'db_change' || data.type === 'chat_message' || data.type === 'event') {
            const sub = this.subscriptions.get(data.topic);
            if (sub) sub._emit(data as any);
        }

        // Re-key subscription on server-confirmed topic (for non-TS SDKs compatibility)
        if (data.type === 'subscribed' && data.topic) {
            for (const [origTopic, sub] of this.subscriptions.entries()) {
                if (data.topic !== origTopic && data.topic.startsWith(origTopic)) {
                    this.subscriptions.delete(origTopic);
                    sub.topic = data.topic;
                    this.subscriptions.set(data.topic, sub);
                    break;
                }
            }
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
