import { describe, it, expect, beforeEach } from 'vitest';
import { tokenManager } from '@/lib/token-manager';

describe('Token Manager (In-Memory Security)', () => {
  beforeEach(() => {
    tokenManager.clearAuth(false);
  });

  it('initializes with null tokens and unauthenticated state', () => {
    expect(tokenManager.getAccessToken()).toBeNull();
    expect(tokenManager.getRefreshToken()).toBeNull();
    expect(tokenManager.getUserSession()).toBeNull();
    expect(tokenManager.isAuthenticated()).toBe(false);
  });

  it('stores tokens in memory and updates auth state', () => {
    tokenManager.setAuth('jwt-access-123', 'jwt-refresh-456', {
      userId: 'user-1',
      email: 'tenant@example.com',
      roles: ['Tenant'],
    });

    expect(tokenManager.getAccessToken()).toBe('jwt-access-123');
    expect(tokenManager.getRefreshToken()).toBe('jwt-refresh-456');
    expect(tokenManager.isAuthenticated()).toBe(true);
    expect(tokenManager.getUserSession()?.email).toBe('tenant@example.com');
  });

  it('clears all tokens and resets session upon clearAuth', () => {
    tokenManager.setAuth('jwt-access-123', 'jwt-refresh-456', {
      userId: 'user-1',
      email: 'tenant@example.com',
      roles: ['Tenant'],
    });

    tokenManager.clearAuth(false);

    expect(tokenManager.getAccessToken()).toBeNull();
    expect(tokenManager.getRefreshToken()).toBeNull();
    expect(tokenManager.getUserSession()).toBeNull();
    expect(tokenManager.isAuthenticated()).toBe(false);
  });

  it('notifies subscribers when auth state transitions', () => {
    let capturedSession = null;
    const unsubscribe = tokenManager.subscribe((session) => {
      capturedSession = session;
    });

    tokenManager.setAuth('token-a', 'token-b', {
      userId: 'user-2',
      email: 'owner@example.com',
      roles: ['Owner'],
    });

    expect(capturedSession).toEqual({
      userId: 'user-2',
      email: 'owner@example.com',
      roles: ['Owner'],
    });

    unsubscribe();
  });
});
