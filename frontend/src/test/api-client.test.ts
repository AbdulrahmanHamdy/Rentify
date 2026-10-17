import { describe, it, expect, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api-client';
import { tokenManager } from '@/lib/token-manager';
import { server } from './mocks/server';
import { http, HttpResponse } from 'msw';

const API_BASE_URL = 'http://localhost:5261';

describe('API Client & Token Refresh Interceptor', () => {
  beforeEach(() => {
    tokenManager.clearAuth(false);
  });

  it('attaches in-memory Bearer token to request Authorization header', async () => {
    tokenManager.setAuth('valid-test-token', 'mock-refresh-token', {
      userId: '1',
      email: 'test@example.com',
      roles: ['Tenant'],
    });

    let receivedAuthHeader: string | null = null;
    server.use(
      http.get(`${API_BASE_URL}/api/test-auth`, ({ request }) => {
        receivedAuthHeader = request.headers.get('Authorization');
        return HttpResponse.json({ success: true });
      })
    );

    await apiClient.get('/api/test-auth');
    expect(receivedAuthHeader).toBe('Bearer valid-test-token');
  });

  it('refreshes expired access token on 401 and replays the original request', async () => {
    tokenManager.setAuth('expired-token', 'mock-refresh-token', {
      userId: '1',
      email: 'test@example.com',
      roles: ['Tenant'],
    });

    let attempts = 0;
    server.use(
      http.get(`${API_BASE_URL}/api/protected-data`, ({ request }) => {
        attempts++;
        const authHeader = request.headers.get('Authorization');
        if (authHeader === 'Bearer new-mock-access-token') {
          return HttpResponse.json({ message: 'Success with new token' });
        }
        return HttpResponse.json({ statusCode: 401, message: 'Expired token' }, { status: 401 });
      })
    );

    const res = await apiClient.get('/api/protected-data');
    expect(res.status).toBe(200);
    expect(res.data.message).toBe('Success with new token');
    expect(tokenManager.getAccessToken()).toBe('new-mock-access-token');
    expect(attempts).toBe(2);
  });

  it('handles multiple concurrent 401s with a single refresh call and queues pending requests', async () => {
    tokenManager.setAuth('expired-token', 'mock-refresh-token', {
      userId: '1',
      email: 'test@example.com',
      roles: ['Tenant'],
    });

    let refreshCallCount = 0;
    server.use(
      http.post(`${API_BASE_URL}/api/auth/refresh`, () => {
        refreshCallCount++;
        return HttpResponse.json({
          userId: '1',
          email: 'test@example.com',
          roles: ['Tenant'],
          accessToken: 'fresh-token',
          accessTokenExpiresAtUtc: new Date().toISOString(),
          refreshToken: 'fresh-refresh-token',
          refreshTokenExpiresAtUtc: new Date().toISOString(),
        });
      }),
      http.get(`${API_BASE_URL}/api/concurrent-test`, ({ request }) => {
        const auth = request.headers.get('Authorization');
        if (auth === 'Bearer fresh-token') {
          return HttpResponse.json({ ok: true });
        }
        return HttpResponse.json({ statusCode: 401 }, { status: 401 });
      })
    );

    // Launch 3 simultaneous requests with the expired token
    const [res1, res2, res3] = await Promise.all([
      apiClient.get('/api/concurrent-test'),
      apiClient.get('/api/concurrent-test'),
      apiClient.get('/api/concurrent-test'),
    ]);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res3.status).toBe(200);
    // Refresh endpoint was only called once, avoiding token race condition
    expect(refreshCallCount).toBe(1);
    expect(tokenManager.getAccessToken()).toBe('fresh-token');
  });

  it('propagates 403, 404, 409, and 500 error responses appropriately', async () => {
    server.use(
      http.get(`${API_BASE_URL}/api/forbidden`, () =>
        HttpResponse.json({ statusCode: 403, message: 'Forbidden' }, { status: 403 })
      ),
      http.get(`${API_BASE_URL}/api/not-found`, () =>
        HttpResponse.json({ statusCode: 404, message: 'Not Found' }, { status: 404 })
      ),
      http.get(`${API_BASE_URL}/api/conflict`, () =>
        HttpResponse.json({ statusCode: 409, message: 'Conflict state' }, { status: 409 })
      ),
      http.get(`${API_BASE_URL}/api/server-error`, () =>
        HttpResponse.json({ statusCode: 500, message: 'Internal Server Error' }, { status: 500 })
      )
    );

    await expect(apiClient.get('/api/forbidden')).rejects.toMatchObject({
      response: { status: 403 },
    });
    await expect(apiClient.get('/api/not-found')).rejects.toMatchObject({
      response: { status: 404 },
    });
    await expect(apiClient.get('/api/conflict')).rejects.toMatchObject({
      response: { status: 409 },
    });
    await expect(apiClient.get('/api/server-error')).rejects.toMatchObject({
      response: { status: 500 },
    });
  });
});
