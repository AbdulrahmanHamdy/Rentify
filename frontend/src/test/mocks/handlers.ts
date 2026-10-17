import { http, HttpResponse } from 'msw';

const API_BASE_URL = 'http://localhost:5261';

export const handlers = [
  // Auth login
  http.post(`${API_BASE_URL}/api/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    if (body.email === 'test@example.com' && body.password === 'Password123!') {
      return HttpResponse.json({
        userId: 'test-user-id',
        email: 'test@example.com',
        roles: ['Tenant'],
        accessToken: 'mock-access-token',
        accessTokenExpiresAtUtc: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        refreshToken: 'mock-refresh-token',
        refreshTokenExpiresAtUtc: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
    return HttpResponse.json(
      {
        statusCode: 401,
        message: 'Invalid email or password.',
      },
      { status: 401 }
    );
  }),

  // Auth refresh
  http.post(`${API_BASE_URL}/api/auth/refresh`, async ({ request }) => {
    const body = (await request.json()) as { refreshToken?: string };
    if (body.refreshToken === 'valid-refresh-token' || body.refreshToken === 'mock-refresh-token') {
      return HttpResponse.json({
        userId: 'test-user-id',
        email: 'test@example.com',
        roles: ['Tenant'],
        accessToken: 'new-mock-access-token',
        accessTokenExpiresAtUtc: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        refreshToken: 'new-mock-refresh-token',
        refreshTokenExpiresAtUtc: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
    return HttpResponse.json(
      {
        statusCode: 401,
        message: 'Refresh token is expired or invalid.',
      },
      { status: 401 }
    );
  }),

  // Protected properties endpoint
  http.get(`${API_BASE_URL}/api/properties`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader === 'Bearer expired-token') {
      return HttpResponse.json(
        { statusCode: 401, message: 'Unauthorized access token.' },
        { status: 401 }
      );
    }
    return HttpResponse.json({
      items: [
        {
          id: 1,
          name: 'Al-Nour Plaza',
          address: '15 El-Tahrir Street',
          city: 'Cairo',
          unitCount: 4,
          createdAt: new Date().toISOString(),
        },
      ],
      page: 1,
      pageSize: 10,
      totalCount: 1,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    });
  }),
];
