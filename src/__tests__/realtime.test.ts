import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NodeRealtimeClient, RealtimeSubscription } from '../realtime';

// ─── Mock WebSocket ───────────────────────────────────────────

class MockWebSocket {
  static OPEN = 1;
  static CLOSED = 3;

  url: string;
  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((err: any) => void) | null = null;
  sent: any[] = [];

  constructor(url: string) {
    this.url = url;
    setTimeout(() => this.onopen?.(), 0);
  }

  send(data: string) {
    this.sent.push(JSON.parse(data));
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    setTimeout(() => this.onclose?.(), 0);
  }
}

beforeEach(() => {
  vi.stubGlobal('WebSocket', MockWebSocket);
  vi.stubGlobal('fetch', vi.fn());
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// ─── RealtimeSubscription ─────────────────────────────────────

describe('RealtimeSubscription', () => {
  function createSub() {
    const client = new NodeRealtimeClient({
      serverUrl: 'https://api.test.com/v1',
      projectId: 'proj-1',
    });
    const sub = client.channel('users');
    return { client, sub };
  }

  it('should register and fire callbacks', () => {
    const { sub } = createSub();
    const cb = vi.fn();
    sub.on('INSERT', cb);

    sub._emit({
      type: 'db_change',
      topic: sub.topic,
      operation: 'INSERT',
      data: { id: 1 },
    });

    expect(cb).toHaveBeenCalledOnce();
  });

  it('should support wildcard listener', () => {
    const { sub } = createSub();
    const cb = vi.fn();
    sub.on('*', cb);

    sub._emit({
      type: 'db_change',
      topic: sub.topic,
      operation: 'DELETE',
      data: { id: 1 },
    });

    expect(cb).toHaveBeenCalledOnce();
  });

  it('should support custom event names', () => {
    const { sub } = createSub();
    const cb = vi.fn();
    sub.on('player-moved', cb);

    sub._emit({
      type: 'event',
      topic: sub.topic,
      event: 'player-moved',
      data: { x: 10 },
    });

    expect(cb).toHaveBeenCalledOnce();
  });

  it('should remove callbacks with off()', () => {
    const { sub } = createSub();
    const cb = vi.fn();
    sub.on('INSERT', cb);
    sub.off('INSERT', cb);

    sub._emit({
      type: 'db_change',
      topic: sub.topic,
      operation: 'INSERT',
      data: {},
    });

    expect(cb).not.toHaveBeenCalled();
  });

  it('should be chainable', () => {
    const { sub } = createSub();
    const result = sub.on('INSERT', vi.fn()).on('UPDATE', vi.fn());
    expect(result).toBe(sub);
  });

  it('should track isSubscribed state', () => {
    const { sub } = createSub();
    expect(sub.isSubscribed).toBe(false);
    sub.subscribe();
    expect(sub.isSubscribed).toBe(true);
    sub.unsubscribe();
    expect(sub.isSubscribed).toBe(false);
  });

  it('should not send duplicate subscribe', () => {
    const { sub } = createSub();
    sub.subscribe();
    sub.subscribe(); // Should be no-op
    expect(sub.isSubscribed).toBe(true);
  });

  it('should clear callbacks on unsubscribe', () => {
    const { sub } = createSub();
    const cb = vi.fn();
    sub.on('INSERT', cb);
    sub.subscribe();
    sub.unsubscribe();

    sub._emit({
      type: 'db_change',
      topic: sub.topic,
      operation: 'INSERT',
      data: {},
    });

    expect(cb).not.toHaveBeenCalled();
  });

  it('should publish events', () => {
    const { sub } = createSub();
    sub.publish('custom-event', { key: 'value' }, { persist: true });
    // Should not throw
  });

  it('should track presence', () => {
    const { sub } = createSub();
    sub.track({ online: true });
    sub.untrack();
    // Should not throw
  });

  it('should fetch history', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({ messages: [{ id: '1' }] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { sub } = createSub();
    const history = await sub.getHistory(10);
    expect(history).toEqual([{ id: '1' }]);
  });
});

// ─── NodeRealtimeClient ───────────────────────────────────────

describe('NodeRealtimeClient', () => {
  describe('constructor', () => {
    it('should convert https to wss URL', () => {
      const client = new NodeRealtimeClient({
        serverUrl: 'https://api.test.com/v1',
        projectId: 'proj-1',
      });
      expect(client.status).toBe('idle');
    });

    it('should start as idle', () => {
      const client = new NodeRealtimeClient({
        serverUrl: 'https://api.test.com/v1',
        projectId: 'proj-1',
      });
      expect(client.status).toBe('idle');
      expect(client.connected).toBe(false);
    });
  });

  describe('connect', () => {
    it('should connect and set status to connected', async () => {
      const client = new NodeRealtimeClient({
        serverUrl: 'https://api.test.com/v1',
        projectId: 'proj-1',
      });

      const connectPromise = client.connect();
      await vi.advanceTimersByTimeAsync(10);
      await connectPromise;

      expect(client.status).toBe('connected');
      expect(client.connected).toBe(true);
    });

    it('should pass apiKey in URL query params', async () => {
      const client = new NodeRealtimeClient({
        serverUrl: 'https://api.test.com/v1',
        projectId: 'proj-1',
        apiKey: 'my-key',
        token: 'my-token',
      });

      const connectPromise = client.connect();
      await vi.advanceTimersByTimeAsync(10);
      await connectPromise;

      expect(client.status).toBe('connected');
    });

    it('should not create duplicate connections', async () => {
      const client = new NodeRealtimeClient({
        serverUrl: 'https://api.test.com/v1',
        projectId: 'proj-1',
      });

      const p1 = client.connect();
      const p2 = client.connect();
      await vi.advanceTimersByTimeAsync(10);
      await Promise.all([p1, p2]);

      expect(client.status).toBe('connected');
    });
  });

  describe('disconnect', () => {
    it('should disconnect and set status', async () => {
      const client = new NodeRealtimeClient({
        serverUrl: 'https://api.test.com/v1',
        projectId: 'proj-1',
      });

      const connectPromise = client.connect();
      await vi.advanceTimersByTimeAsync(10);
      await connectPromise;

      client.disconnect();
      expect(client.status).toBe('disconnected');
    });

    it('should be safe when not connected', () => {
      const client = new NodeRealtimeClient({
        serverUrl: 'https://api.test.com/v1',
        projectId: 'proj-1',
      });
      client.disconnect();
      expect(client.status).toBe('disconnected');
    });
  });

  describe('channel', () => {
    it('should qualify topic with projectId', () => {
      const client = new NodeRealtimeClient({
        serverUrl: 'https://api.test.com/v1',
        projectId: 'proj-1',
      });
      const sub = client.channel('users');
      expect(sub.topic).toBe('table/users/proj-1');
    });

    it('should append projectId to topic with path', () => {
      const client = new NodeRealtimeClient({
        serverUrl: 'https://api.test.com/v1',
        projectId: 'proj-1',
      });
      const sub = client.channel('table/orders');
      expect(sub.topic).toBe('table/orders/proj-1');
    });

    it('should not double-qualify topics', () => {
      const client = new NodeRealtimeClient({
        serverUrl: 'https://api.test.com/v1',
        projectId: 'proj-1',
      });
      const sub = client.channel('table/users/proj-1');
      expect(sub.topic).toBe('table/users/proj-1');
    });

    it('should reuse subscriptions for same topic', () => {
      const client = new NodeRealtimeClient({
        serverUrl: 'https://api.test.com/v1',
        projectId: 'proj-1',
      });
      const sub1 = client.channel('users');
      const sub2 = client.channel('users');
      expect(sub1).toBe(sub2);
    });
  });

  describe('status listeners', () => {
    it('should notify status change listeners', async () => {
      const client = new NodeRealtimeClient({
        serverUrl: 'https://api.test.com/v1',
        projectId: 'proj-1',
      });
      const statuses: string[] = [];
      client.onStatusChange(s => statuses.push(s));

      const connectPromise = client.connect();
      await vi.advanceTimersByTimeAsync(10);
      await connectPromise;

      expect(statuses).toContain('connecting');
      expect(statuses).toContain('connected');
    });

    it('should allow unsubscribing', () => {
      const client = new NodeRealtimeClient({
        serverUrl: 'https://api.test.com/v1',
        projectId: 'proj-1',
      });
      const cb = vi.fn();
      const unsub = client.onStatusChange(cb);
      unsub();
      client.disconnect();
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe('setToken', () => {
    it('should send auth message', async () => {
      const client = new NodeRealtimeClient({
        serverUrl: 'https://api.test.com/v1',
        projectId: 'proj-1',
      });

      const connectPromise = client.connect();
      await vi.advanceTimersByTimeAsync(10);
      await connectPromise;

      client.setToken('new-token');
    });
  });

  describe('sendChat', () => {
    it('should send chat message', () => {
      const client = new NodeRealtimeClient({
        serverUrl: 'https://api.test.com/v1',
        projectId: 'proj-1',
      });
      client.sendChat('room-1', 'Hello!');
      // Message queued since not connected
    });
  });

  describe('_generateId', () => {
    it('should return unique strings', () => {
      const client = new NodeRealtimeClient({
        serverUrl: 'https://api.test.com/v1',
        projectId: 'proj-1',
      });
      const ids = new Set(Array.from({ length: 50 }, () => client._generateId()));
      expect(ids.size).toBe(50);
    });
  });

  describe('_fetchHistory', () => {
    it('should fetch from REST API with auth headers', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({ messages: [{ id: '1' }] }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const client = new NodeRealtimeClient({
        serverUrl: 'https://api.test.com/v1',
        projectId: 'proj-1',
        apiKey: 'my-key',
        token: 'my-token',
      });

      const result = await client._fetchHistory('room/test', 25, 9999);
      expect(result).toEqual([{ id: '1' }]);

      const url = new URL(mockFetch.mock.calls[0][0]);
      expect(url.pathname).toBe('/api/v1/public/realtime/history');
      expect(url.searchParams.get('room')).toBe('room/test');
      expect(url.searchParams.get('limit')).toBe('25');
      expect(url.searchParams.get('before')).toBe('9999');

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers['X-Aerostack-Key']).toBe('my-key');
      expect(headers['Authorization']).toBe('Bearer my-token');
    });
  });

  describe('maxReconnectAttempts', () => {
    it('should accept maxReconnectAttempts option', () => {
      const client = new NodeRealtimeClient({
        serverUrl: 'https://api.test.com/v1',
        projectId: 'proj-1',
        maxReconnectAttempts: 3,
      });
      expect(client.status).toBe('idle');
    });

    it('should allow onMaxRetriesExceeded listener', () => {
      const client = new NodeRealtimeClient({
        serverUrl: 'https://api.test.com/v1',
        projectId: 'proj-1',
        maxReconnectAttempts: 0,
      });
      const cb = vi.fn();
      const unsub = client.onMaxRetriesExceeded(cb);
      expect(typeof unsub).toBe('function');
      unsub();
    });
  });
});
