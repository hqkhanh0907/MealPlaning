import { Capacitor } from '@capacitor/core';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { deleteSetting, getSetting, setSetting } from '../services/appSettings';
import type { DatabaseService } from '../services/databaseService';
import type { AuthUser } from '../types';
import { logger } from '../utils/logger';
import type { AuthContextValue, AuthState } from './authContextDef';
import { AuthContext } from './authContextDef';
import { useDatabase } from './DatabaseContext';

export type { AuthContextValue, AuthState } from './authContextDef';

const GOOGLE_WEB_CLIENT_ID = '871833618020-u4bum8ct6lo3a6pcjhhg62e8auiigs68.apps.googleusercontent.com';
const DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

const AUTH_SETTING_KEY = 'auth_state';

interface PersistedAuth {
  user: AuthUser;
  accessToken: string | null;
}

const persistAuth = (db: DatabaseService, auth: PersistedAuth | null): void => {
  if (auth) {
    setSetting(db, AUTH_SETTING_KEY, JSON.stringify(auth)).catch(e =>
      logger.warn({ component: 'AuthContext', action: 'persistAuth' }, String(e)),
    );
  } else {
    deleteSetting(db, AUTH_SETTING_KEY).catch(e =>
      logger.warn({ component: 'AuthContext', action: 'clearAuth' }, String(e)),
    );
  }
};

const loadPersistedAuth = async (db: DatabaseService): Promise<PersistedAuth | null> => {
  try {
    const stored = await getSetting(db, AUTH_SETTING_KEY);
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
  // Typed global for globalThis access
  var google:
    | {
        accounts: GoogleAccountsNamespace;
      }
    | undefined;
}

const loadGISScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (globalThis.google?.accounts?.oauth2) {
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
  const data = (await res.json()) as { sub: string; email: string; name: string; picture?: string };
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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const db = useDatabase();

  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: false,
    isInitialized: false,
  });

  const gisTokenClientRef = useRef<GISTokenClient | null>(null);
  const signInResolverRef = useRef<{
    resolve: (value: void) => void;
    reject: (reason: Error) => void;
  } | null>(null);

  useEffect(() => {
    const init = async () => {
      const persisted = await loadPersistedAuth(db);
      if (persisted) {
        setState({
          user: persisted.user,
          accessToken: persisted.accessToken,
          isLoading: false,
          isInitialized: true,
        });
      }

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
              persistAuth(db, authData);
              setState({ ...authData, isLoading: false, isInitialized: true });
              return;
            }
          }
        } catch {
          // Not logged in or init failed — continue as guest
        }
      } else {
        void loadGISScript();
      }
      setState(prev => (prev.isInitialized ? prev : { ...prev, isInitialized: true }));
    };
    void init();
  }, [db]);

  const processTokenResponse = useCallback(
    async (tokenResponse: GISTokenResponse) => {
      try {
        const user = await fetchGoogleUserInfo(tokenResponse.access_token);
        const authData = { user, accessToken: tokenResponse.access_token };
        persistAuth(db, authData);
        setState({ ...authData, isLoading: false, isInitialized: true });
        signInResolverRef.current?.resolve();
      } catch (error_) {
        setState(prev => ({ ...prev, isLoading: false }));
        persistAuth(db, null);
        signInResolverRef.current?.reject(error_ instanceof Error ? error_ : new Error('Failed to fetch user info'));
      }
      signInResolverRef.current = null;
    },
    [db],
  );

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
          persistAuth(db, authData);
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
    if (!globalThis.google?.accounts?.oauth2) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw new Error('Google Identity Services not loaded');
    }

    const handleTokenError = (error: GISErrorResponse) => {
      setState(prev => ({ ...prev, isLoading: false }));
      const err = new Error(
        error.type === 'popup_closed' ? 'Sign-in popup was closed' : `Google sign-in error: ${error.type}`,
      );
      signInResolverRef.current?.reject(err);
      signInResolverRef.current = null;
    };

    const handleTokenSuccess = (tokenResponse: GISTokenResponse) => {
      if (tokenResponse.error) {
        setState(prev => ({ ...prev, isLoading: false }));
        persistAuth(db, null);
        const err = new Error(`Google sign-in failed: ${tokenResponse.error}`);
        signInResolverRef.current?.reject(err);
        signInResolverRef.current = null;
        return;
      }

      void processTokenResponse(tokenResponse);
    };

    return new Promise<void>((resolve, reject) => {
      signInResolverRef.current = { resolve, reject };

      const tokenClient = globalThis.google!.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_WEB_CLIENT_ID,
        scope: `email profile ${DRIVE_APPDATA_SCOPE}`,
        error_callback: handleTokenError,
        callback: handleTokenSuccess,
      });

      gisTokenClientRef.current = tokenClient;
      tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }, [db, processTokenResponse]);

  const signOut = useCallback(async () => {
    if (isNativePlatform()) {
      try {
        const { SocialLogin } = await import('@capgo/capacitor-social-login');
        await SocialLogin.logout({ provider: 'google' });
      } catch {
        // Logout may fail if session already expired
      }
    } else if (state.accessToken && globalThis.google?.accounts?.oauth2) {
      globalThis.google.accounts.oauth2.revoke(state.accessToken);
    }
    persistAuth(db, null);
    setState({ user: null, accessToken: null, isLoading: false, isInitialized: true });
  }, [state.accessToken, db]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signIn,
      signOut,
    }),
    [state, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
