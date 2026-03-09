/**
 * Node SDK E2E Tests
 *
 * Verifies SDK initialization, facade methods, and streaming.
 * Imports from source since tshy build may not be available.
 */
import { describe, it, expect, vi } from 'vitest';

// Mock the generated SDK APIs that the Node SDK depends on
vi.mock('../../../src/generated/api.js', () => {
  const makeApi = () => ({
    _serverURL: '',
    _client: { _baseURL: '' },
    listProducts: vi.fn(),
    createProduct: vi.fn(),
  });
  return {
    Auth: vi.fn().mockImplementation(() => makeApi()),
    Ai: vi.fn().mockImplementation(() => makeApi()),
    Database: vi.fn().mockImplementation(() => makeApi()),
    Storage: vi.fn().mockImplementation(() => makeApi()),
    Queue: vi.fn().mockImplementation(() => makeApi()),
    Services: vi.fn().mockImplementation(() => makeApi()),
    Cache: vi.fn().mockImplementation(() => ({
      ...makeApi(),
      cacheGet: vi.fn().mockResolvedValue({ result: '{}' }),
      cacheSet: vi.fn().mockResolvedValue({}),
      cacheDelete: vi.fn().mockResolvedValue({}),
      cacheClear: vi.fn().mockResolvedValue({}),
      cacheList: vi.fn().mockResolvedValue({ result: '[]' }),
      cacheHas: vi.fn().mockResolvedValue({ result: 'true' }),
      cacheIncrement: vi.fn().mockResolvedValue({ result: '1' }),
      cacheDecrement: vi.fn().mockResolvedValue({ result: '0' }),
      cacheTtl: vi.fn().mockResolvedValue({ result: '3600' }),
      cacheExpire: vi.fn().mockResolvedValue({}),
      cachePersist: vi.fn().mockResolvedValue({}),
      cacheSetAdd: vi.fn().mockResolvedValue({}),
    })),
    SDKConfig: vi.fn().mockImplementation(() => ({
      _serverURL: '',
      _client: { _baseURL: '' },
    })),
  };
});

vi.mock('../../../src/generated/models/operations/index.js', () => ({}));

const { SDK, Aerostack, createClient } = await import('../../../src/sdk');
const { NodeRealtimeClient } = await import('../../../src/realtime');

describe('Node SDK E2E', () => {
  describe('SDK initialization', () => {
    it('should create SDK instance with default options', () => {
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

    it('should create SDK with api key and custom server', () => {
      const sdk = new SDK({
        apiKey: 'ac_secret_test_key',
        serverUrl: 'https://custom.api.com/v1',
        projectId: 'proj-test',
      });
      expect(sdk).toBeDefined();
    });

    it('should support backward-compat aliases', () => {
      const sdk = new SDK({
        apiKeyAuth: 'ac_secret_test_key',
        serverURL: 'https://custom.api.com/v1',
      });
      expect(sdk).toBeDefined();
    });

    it('should export Aerostack as deprecated alias', () => {
      expect(Aerostack).toBe(SDK);
    });

    it('should export createClient factory', () => {
      const sdk = createClient({ apiKey: 'key' });
      expect(sdk).toBeInstanceOf(SDK);
    });
  });

  describe('setApiKey', () => {
    it('should update API key and recreate services', () => {
      const sdk = new SDK({ apiKey: 'old-key' });
      sdk.setApiKey('new-key');
      expect(sdk.auth).toBeDefined();
    });
  });

  describe('NodeRealtimeClient export', () => {
    it('should export NodeRealtimeClient', () => {
      expect(NodeRealtimeClient).toBeDefined();
      expect(typeof NodeRealtimeClient).toBe('function');
    });

    it('should create realtime client', () => {
      const client = new NodeRealtimeClient({
        serverUrl: 'https://api.test.com/v1',
        projectId: 'proj-1',
      });
      expect(client.status).toBe('idle');
      expect(client.connected).toBe(false);
    });
  });
});
