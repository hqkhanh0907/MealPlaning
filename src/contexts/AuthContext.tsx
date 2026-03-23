import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import type { AuthUser } from '../types';
import { AuthContext } from './authContextDef';
import type { AuthContextValue, AuthState } from './authContextDef';

export type { AuthContextValue, AuthState } from './authContextDef';

const GOOGLE_WEB_CLIENT_ID = '871833618020-u4bum8ct6lo3a6pcjhhg62e8auiigs68.apps.googleusercontent.com';
const DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

const AUTH_STORAGE_KEY = 'mp-auth-state';

interface PersistedAuth {
  user: AuthUser;
  accessToken: string | null;
}

const persistAuth = (auth: PersistedAuth | null): void => {
  if (auth) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
};

const loadPersistedAuth = (): PersistedAuth | null => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as PersistedAuth;
    if (parsed.user && typeof parsed.user.email === 'string') return parsed;
    return null;
  } catch {
    return null;
  }
};

// --- Google Identity Services (GIS) for Web ---

interface GISTokenResponse {
  access_token: string;
  error?: string;
}

interface GISErrorResponse {
  type: string;
  message?: string;
}

interface GISTokenClient {
  requestAccessToken: (overrides?: { prompt?: string }) => void;
}

interface GoogleAccountsOAuth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (response: GISTokenResponse) => void;
    error_callback?: (error: GISErrorResponse) => void;
  }) => GISTokenClient;
  revoke: (token: string, done?: () => void) => void;
}

interface GoogleAccountsNamespace {
  oauth2: GoogleAccountsOAuth2;
}

declare global {
  interface Window {
    google?: {
      accounts: GoogleAccountsNamespace;
    };
  }
}

const loadGISScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
};

const fetchGoogleUserInfo = async (accessToken: string): Promise<AuthUser> => {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch user info: ${res.status}`);
  const data = await res.json() as { sub: string; email: string; name: string; picture?: string };
  return {
    id: data.sub,
    email: data.email,
    displayName: data.name,
    photoUrl: data.picture ?? null,
  };
};

// --- Capacitor SocialLogin (Native) ---

const extractOnlineProfile = (response: unknown): { user: AuthUser; token: string | null } | null => {
  const res = response as Record<string, unknown>;
  if (res.responseType !== 'online') return null;
  const profile = res.profile as Record<string, string | null> | undefined;
  const accessToken = res.accessToken as { token?: string } | null;
  return {
    user: {
      id: profile?.id ?? '',
      email: profile?.email ?? '',
      displayName: profile?.name ?? '',
      photoUrl: profile?.imageUrl ?? null,
    },
    token: accessToken?.token ?? null,
  };
};

const isNativePlatform = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(() => {
    const persisted = loadPersistedAuth();
    return {
      user: persisted?.user ?? null,
      accessToken: persisted?.accessToken ?? null,
      isLoading: false,
      isInitialized: !!persisted,
    };
  });

  const gisTokenClientRef = useRef<GISTokenClient | null>(null);
  const signInResolverRef = useRef<{
    resolve: (value: void) => void;
    reject: (reason: Error) => void;
  } | null>(null);

  useEffect(() => {
    const init = async () => {
      if (isNativePlatform()) {
        try {
          const { SocialLogin } = await import('@capgo/capacitor-social-login');
          await SocialLogin.initialize({
            google: { webClientId: GOOGLE_WEB_CLIENT_ID, mode: 'online' },
          });
          const { isLoggedIn } = await SocialLogin.isLoggedIn({ provider: 'google' });
          if (isLoggedIn) {
            const loginResult = await SocialLogin.login({
              provider: 'google',
              options: { scopes: ['email', 'profile', DRIVE_APPDATA_SCOPE] },
            });
            const extracted = extractOnlineProfile(loginResult.result);
            if (extracted) {
              const authData = { user: extracted.user, accessToken: extracted.token };
              persistAuth(authData);
              setState({ ...authData, isLoading: false, isInitialized: true });
              return;
            }
          }
        } catch {
          // Not logged in or init failed — continue as guest
        }
      } else {
        // Load GIS script in background — don't block initialization
        loadGISScript().catch(() => {
          // GIS script failed to load — sign-in will check availability
        });
      }
      setState(prev => prev.isInitialized ? prev : { ...prev, isInitialized: true });
    };
    init();
  }, []);

  const signIn = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    if (isNativePlatform()) {
      try {
        const { SocialLogin } = await import('@capgo/capacitor-social-login');
        const loginResult = await SocialLogin.login({
          provider: 'google',
          options: { scopes: ['email', 'profile', DRIVE_APPDATA_SCOPE] },
        });
        const extracted = extractOnlineProfile(loginResult.result);
        if (extracted) {
          const authData = { user: extracted.user, accessToken: extracted.token };
          persistAuth(authData);
          setState({ ...authData, isLoading: false, isInitialized: true });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
          throw new Error('Google sign-in returned offline response');
        }
      } catch {
        setState(prev => ({ ...prev, isLoading: false }));
        throw new Error('Google sign-in failed');
      }
      return;
    }

    // Web: use Google Identity Services
    if (!window.google?.accounts?.oauth2) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw new Error('Google Identity Services not loaded');
    }

    return new Promise<void>((resolve, reject) => {
      signInResolverRef.current = { resolve, reject };

      const tokenClient = window.google!.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_WEB_CLIENT_ID,
        scope: `email profile ${DRIVE_APPDATA_SCOPE}`,
        error_callback: (error: GISErrorResponse) => {
          setState(prev => ({ ...prev, isLoading: false }));
          const err = new Error(
            error.type === 'popup_closed'
              ? 'Sign-in popup was closed'
              : `Google sign-in error: ${error.type}`,
          );
          signInResolverRef.current?.reject(err);
          signInResolverRef.current = null;
        },
        callback: async (tokenResponse: GISTokenResponse) => {
          if (tokenResponse.error) {
            setState(prev => ({ ...prev, isLoading: false }));
            persistAuth(null);
            const err = new Error(`Google sign-in failed: ${tokenResponse.error}`);
            signInResolverRef.current?.reject(err);
            signInResolverRef.current = null;
            return;
          }

          try {
            const user = await fetchGoogleUserInfo(tokenResponse.access_token);
            const authData = { user, accessToken: tokenResponse.access_token };
            persistAuth(authData);
            setState({ ...authData, isLoading: false, isInitialized: true });
            signInResolverRef.current?.resolve();
          } catch (fetchErr) {
            setState(prev => ({ ...prev, isLoading: false }));
            persistAuth(null);
            signInResolverRef.current?.reject(
              fetchErr instanceof Error ? fetchErr : new Error('Failed to fetch user info'),
            );
          }
          signInResolverRef.current = null;
        },
      });

      gisTokenClientRef.current = tokenClient;
      tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }, []);

  const signOut = useCallback(async () => {
    if (isNativePlatform()) {
      try {
        const { SocialLogin } = await import('@capgo/capacitor-social-login');
        await SocialLogin.logout({ provider: 'google' });
      } catch {
        // Logout may fail if session already expired
      }
    } else if (state.accessToken && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(state.accessToken);
    }
    persistAuth(null);
    setState({ user: null, accessToken: null, isLoading: false, isInitialized: true });
  }, [state.accessToken]);

  const value = useMemo<AuthContextValue>(() => ({
    ...state,
    signIn,
    signOut,
  }), [state, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
