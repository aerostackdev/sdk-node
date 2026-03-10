import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the generated APIs and realtime
vi.mock('../_generated/index.js', () => {
  const createMockApi = () => ({});
  class MockConfiguration {
    basePath: string;
    headers: Record<string, string>;
    apiKey?: string;
    constructor(opts: any = {}) {
      this.basePath = opts.basePath || '';
      this.headers = opts.headers || {};
      this.apiKey = opts.apiKey;
    }
  }
  return {
    Configuration: MockConfiguration,
    AuthenticationApi: vi.fn().mockImplementation(() => ({ auth: true })),
    CacheApi: vi.fn().mockImplementation(() => ({
      cacheGet: vi.fn().mockResolvedValue({ _exists: true, value: 'cached' }),
      cacheSet: vi.fn().mockResolvedValue({}),
      cacheDelete: vi.fn().mockResolvedValue({}),
      cacheList: vi.fn().mockResolvedValue({ keys: [], cursor: null }),
      cacheKeys: vi.fn().mockResolvedValue({ keys: ['k1', 'k2'] }),
      cacheGetMany: vi.fn().mockResolvedValue({ results: [] }),
      cacheSetMany: vi.fn().mockResolvedValue({}),
      cacheDeleteMany: vi.fn().mockResolvedValue({}),
      cacheFlush: vi.fn().mockResolvedValue({}),
      cacheExpire: vi.fn().mockResolvedValue({}),
      cacheIncrement: vi.fn().mockResolvedValue({ value: 5 }),
    })),
    DatabaseApi: vi.fn().mockImplementation(() => ({
      dbQuery: vi.fn().mockResolvedValue({ results: [] }),
    })),
    QueueApi: vi.fn().mockImplementation(() => ({ queue: true })),
    StorageApi: vi.fn().mockImplementation(() => ({ storage: true })),
    AIApi: vi.fn().mockImplementation(() => ({ ai: true })),
    ServicesApi: vi.fn().mockImplementation(() => ({ services: true })),
    GatewayApi: vi.fn().mockImplementation(() => ({ gateway: true })),
  };
});

vi.mock('../realtime.js', () => {
  return {
    NodeRealtimeClient: vi.fn().mockImplementation(() => ({
      connect: vi.fn(),
      disconnect: vi.fn(),
      channel: vi.fn(),
    })),
  };
});

vi.mock('@aerostack/core', () => {
  return {
    AerostackClient: vi.fn().mockImplementation(() => ({
      db: { query: vi.fn() },
      cache: { get: vi.fn() },
    })),
  };
});

import { SDK, Aerostack, createClient } from '../sdk.js';

describe('SDK', () => {
  describe('constructor', () => {
    it('should initialize with default options', () => {
      const sdk = new SDK();
      expect(sdk).toBeDefined();
      expect(sdk.database).toBeDefined();
      expect(sdk.auth).toBeDefined();
      expect(sdk.cache).toBeDefined();
      expect(sdk.queue).toBeDefined();
      expect(sdk.storage).toBeDefined();
      expect(sdk.ai).toBeDefined();
      expect(sdk.services).toBeDefined();
      expect(sdk.gateway).toBeDefined();
      expect(sdk.realtime).toBeDefined();
      expect(sdk.rpc).toBeDefined();
    });

    it('should accept apiKey option', () => {
      const sdk = new SDK({ apiKey: 'my-key' });
      expect(sdk).toBeDefined();
    });

    it('should accept apiKeyAuth alias', () => {
      const sdk = new SDK({ apiKeyAuth: 'my-key' });
      expect(sdk).toBeDefined();
    });

    it('should accept serverUrl option', () => {
      const sdk = new SDK({ serverUrl: 'https://custom.com/v1' });
      expect(sdk).toBeDefined();
    });

    it('should accept serverURL alias', () => {
      const sdk = new SDK({ serverURL: 'https://custom.com/v1' });
      expect(sdk).toBeDefined();
    });

    it('should accept projectId', () => {
      const sdk = new SDK({ projectId: 'proj-1' });
      expect(sdk).toBeDefined();
    });

    it('should accept maxReconnectAttempts', () => {
      const sdk = new SDK({ maxReconnectAttempts: 5 });
      expect(sdk).toBeDefined();
    });
  });

  describe('CacheFacade', () => {
    it('should get a cached value', async () => {
      const sdk = new SDK({ apiKey: 'key' });
      const result = await sdk.cache.get('test-key');
      expect(result).toBe('cached');
    });

    it('should return null when key not found', async () => {
      const sdk = new SDK({ apiKey: 'key' });
      // Override the mock for this test
      const cacheApi = (sdk.cache as any).api;
      cacheApi.cacheGet.mockResolvedValueOnce({ _exists: false });
      const result = await sdk.cache.get('missing');
      expect(result).toBeNull();
    });

    it('should set a value', async () => {
      const sdk = new SDK({ apiKey: 'key' });
      await sdk.cache.set('key', 'value');
      const cacheApi = (sdk.cache as any).api;
      expect(cacheApi.cacheSet).toHaveBeenCalled();
    });

    it('should set a value with TTL', async () => {
      const sdk = new SDK({ apiKey: 'key' });
      await sdk.cache.set('key', 'value', 3600);
      const cacheApi = (sdk.cache as any).api;
      const call = cacheApi.cacheSet.mock.calls[0][0];
      expect(call.cacheSetRequest.ttl).toBe(3600);
    });

    it('should delete a key', async () => {
      const sdk = new SDK({ apiKey: 'key' });
      await sdk.cache.delete('key');
      const cacheApi = (sdk.cache as any).api;
      expect(cacheApi.cacheDelete).toHaveBeenCalled();
    });

    it('should check if key exists', async () => {
      const sdk = new SDK({ apiKey: 'key' });
      const result = await sdk.cache.exists('key');
      expect(result).toBe(true);
    });

    it('should list keys', async () => {
      const sdk = new SDK({ apiKey: 'key' });
      await sdk.cache.list('prefix:', 10, 'cursor');
    });

    it('should get all keys', async () => {
      const sdk = new SDK({ apiKey: 'key' });
      const keys = await sdk.cache.keys('prefix:');
      expect(keys).toEqual(['k1', 'k2']);
    });

    it('should get many keys', async () => {
      const sdk = new SDK({ apiKey: 'key' });
      const result = await sdk.cache.getMany(['k1', 'k2']);
      expect(result).toEqual([]);
    });

    it('should set many entries', async () => {
      const sdk = new SDK({ apiKey: 'key' });
      await sdk.cache.setMany([{ key: 'k1', value: 'v1' }]);
    });

    it('should delete many keys', async () => {
      const sdk = new SDK({ apiKey: 'key' });
      await sdk.cache.deleteMany(['k1', 'k2']);
    });

    it('should flush cache', async () => {
      const sdk = new SDK({ apiKey: 'key' });
      await sdk.cache.flush('prefix:');
    });

    it('should expire a key', async () => {
      const sdk = new SDK({ apiKey: 'key' });
      await sdk.cache.expire('key', 300);
    });

    it('should increment a counter', async () => {
      const sdk = new SDK({ apiKey: 'key' });
      const result = await sdk.cache.increment('counter', 1, 0, 3600);
      expect(result).toBe(5);
    });
  });

  describe('DatabaseFacade', () => {
    it('should execute a query', async () => {
      const sdk = new SDK({ apiKey: 'key' });
      const result = await sdk.database.dbQuery({
        dbQueryRequest: { sql: 'SELECT 1', params: [] },
      });
      expect(result).toEqual({ results: [] });
    });

    it('should accept requestBody alias', async () => {
      const sdk = new SDK({ apiKey: 'key' });
      await sdk.database.dbQuery({
        requestBody: { sql: 'SELECT 1', params: [] },
      });
    });
  });

  describe('setApiKey', () => {
    it('should update all service instances', () => {
      const sdk = new SDK({ apiKey: 'old-key' });
      sdk.setApiKey('new-key');
      // After setApiKey, all services should be recreated
      expect(sdk.database).toBeDefined();
      expect(sdk.auth).toBeDefined();
      expect(sdk.cache).toBeDefined();
    });
  });

  describe('streamGateway', () => {
    it('should make POST request to gateway endpoint', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: createMockStream('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\ndata: [DONE]\n\n'),
      });
      vi.stubGlobal('fetch', mockFetch);

      const sdk = new SDK({ apiKey: 'key', serverUrl: 'https://api.test.com/v1' });
      const result = await sdk.streamGateway({
        apiSlug: 'my-chatbot',
        messages: [{ role: 'user', content: 'Hi' }],
        consumerKey: 'ask_live_123',
      });

      expect(result.text).toBe('Hello');
      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.test.com/api/gateway/my-chatbot/v1/chat/completions');
      expect(opts.headers.Authorization).toBe('Bearer ask_live_123');
    });

    it('should use token when consumerKey not provided', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: createMockStream('data: [DONE]\n\n'),
      });
      vi.stubGlobal('fetch', mockFetch);

      const sdk = new SDK({ serverUrl: 'https://api.test.com/v1' });
      await sdk.streamGateway({
        apiSlug: 'bot',
        messages: [{ role: 'user', content: 'Hi' }],
        token: 'jwt-token',
      });

      expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer jwt-token');
    });

    it('should prepend system prompt', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: createMockStream('data: [DONE]\n\n'),
      });
      vi.stubGlobal('fetch', mockFetch);

      const sdk = new SDK({ serverUrl: 'https://api.test.com/v1' });
      await sdk.streamGateway({
        apiSlug: 'bot',
        messages: [{ role: 'user', content: 'Hi' }],
        systemPrompt: 'You are helpful',
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.messages[0]).toEqual({ role: 'system', content: 'You are helpful' });
      expect(body.messages[1]).toEqual({ role: 'user', content: 'Hi' });
    });

    it('should call onToken callback', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: createMockStream('data: {"choices":[{"delta":{"content":"Hi"}}]}\n\ndata: {"choices":[{"delta":{"content":" there"}}]}\n\ndata: [DONE]\n\n'),
      });
      vi.stubGlobal('fetch', mockFetch);

      const tokens: string[] = [];
      const sdk = new SDK({ serverUrl: 'https://api.test.com/v1' });
      await sdk.streamGateway({
        apiSlug: 'bot',
        messages: [{ role: 'user', content: 'Hi' }],
        onToken: (delta: string) => tokens.push(delta),
      });

      expect(tokens).toEqual(['Hi', ' there']);
    });

    it('should call onDone callback', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        body: createMockStream('data: {"choices":[{"delta":{"content":"Hi"}}],"usage":{"total_tokens":10}}\n\ndata: [DONE]\n\n'),
      });
      vi.stubGlobal('fetch', mockFetch);

      let doneResult: any;
      const sdk = new SDK({ serverUrl: 'https://api.test.com/v1' });
      await sdk.streamGateway({
        apiSlug: 'bot',
        messages: [{ role: 'user', content: 'Hi' }],
        onDone: (result: any) => { doneResult = result; },
      });

      expect(doneResult.tokensUsed).toBe(10);
    });

    it('should throw on non-OK response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ error: 'Server error' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const sdk = new SDK({ serverUrl: 'https://api.test.com/v1' });
      await expect(sdk.streamGateway({
        apiSlug: 'bot',
        messages: [{ role: 'user', content: 'Hi' }],
      })).rejects.toThrow('Server error');
    });

    it('should call onError on failure', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ error: 'boom' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      let capturedError: Error | null = null;
      const sdk = new SDK({ serverUrl: 'https://api.test.com/v1' });

      try {
        await sdk.streamGateway({
          apiSlug: 'bot',
          messages: [{ role: 'user', content: 'Hi' }],
          onError: (err: Error) => { capturedError = err; },
        });
      } catch {
        // Expected
      }

      expect(capturedError).not.toBeNull();
      expect(capturedError!.message).toBe('boom');
    });

    it('should handle abort gracefully', async () => {
      const abortController = new AbortController();
      const mockFetch = vi.fn().mockRejectedValue(
        Object.assign(new Error('Aborted'), { name: 'AbortError' })
      );
      vi.stubGlobal('fetch', mockFetch);

      const sdk = new SDK({ serverUrl: 'https://api.test.com/v1' });
      const result = await sdk.streamGateway({
        apiSlug: 'bot',
        messages: [{ role: 'user', content: 'Hi' }],
        signal: abortController.signal,
      });

      expect(result.text).toBe('');
      expect(result.tokensUsed).toBe(0);
    });
  });

  describe('Aerostack alias', () => {
    it('should be the same as SDK', () => {
      expect(Aerostack).toBe(SDK);
    });
  });

  describe('createClient', () => {
    it('should return an SDK instance', () => {
      const client = createClient({ apiKey: 'key' });
      expect(client).toBeInstanceOf(SDK);
    });
  });
});

// Helper to create a mock ReadableStream
function createMockStream(text: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  let read = false;
  return {
    getReader: () => ({
      read: async () => {
        if (!read) {
          read = true;
          return { done: false, value: data };
        }
        return { done: true, value: undefined };
      },
      cancel: vi.fn(),
    }),
  };
}
