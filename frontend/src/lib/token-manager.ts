import type { UserSession, UserRole } from '@/types';

type AuthListener = (session: UserSession | null) => void;

let inMemoryAccessToken: string | null = null;
let inMemoryRefreshToken: string | null = null;
let inMemoryUserSession: UserSession | null = null;
let inFlightRefreshPromise: Promise<string | null> | null = null;

const listeners: Set<AuthListener> = new Set();

// Cross-tab logout synchronization (without storing tokens)
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('rentify_auth_sync');
    broadcastChannel.onmessage = (event) => {
      if (event.data?.type === 'LOGOUT') {
        clearAuth(false);
      }
    };
  }
} catch {
  // BroadcastChannel not available or restricted
}

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener(inMemoryUserSession);
    } catch {
      // Ignore listener error
    }
  });
}

export const tokenManager = {
  getAccessToken(): string | null {
    return inMemoryAccessToken;
  },

  getRefreshToken(): string | null {
    return inMemoryRefreshToken;
  },

  getUserSession(): UserSession | null {
    return inMemoryUserSession;
  },

  isAuthenticated(): boolean {
    return inMemoryAccessToken !== null && inMemoryUserSession !== null;
  },

  setAuth(
    accessToken: string,
    refreshToken: string,
    user: { userId: string; email: string; roles: string[] }
  ): void {
    inMemoryAccessToken = accessToken;
    inMemoryRefreshToken = refreshToken;
    inMemoryUserSession = {
      userId: user.userId,
      email: user.email,
      roles: user.roles as UserRole[],
    };
    notifyListeners();
  },

  clearAuth(broadcast = true): void {
    inMemoryAccessToken = null;
    inMemoryRefreshToken = null;
    inMemoryUserSession = null;
    inFlightRefreshPromise = null;

    if (broadcast && broadcastChannel) {
      try {
        broadcastChannel.postMessage({ type: 'LOGOUT' });
      } catch {
        // Ignore channel error
      }
    }

    notifyListeners();
  },

  getInFlightRefresh(): Promise<string | null> | null {
    return inFlightRefreshPromise;
  },

  setInFlightRefresh(promise: Promise<string | null> | null): void {
    inFlightRefreshPromise = promise;
  },

  subscribe(listener: AuthListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export const clearAuth = tokenManager.clearAuth;
