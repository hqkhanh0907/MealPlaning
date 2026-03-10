import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SocialLogin } from '@capgo/capacitor-social-login';
import type { AuthUser } from '../types';
import { AuthContext } from './authContextDef';
import type { AuthContextValue, AuthState } from './authContextDef';

export type { AuthContextValue, AuthState } from './authContextDef';

const GOOGLE_WEB_CLIENT_ID = '871833618020-u4bum8ct6lo3a6pcjhhg62e8auiigs68.apps.googleusercontent.com';
const DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: false,
    isInitialized: false,
  });

  useEffect(() => {
    const init = async () => {
      try {
        await SocialLogin.initialize({
          google: {
            webClientId: GOOGLE_WEB_CLIENT_ID,
            mode: 'online',
          },
        });
        const { isLoggedIn } = await SocialLogin.isLoggedIn({ provider: 'google' });
        if (isLoggedIn) {
          const loginResult = await SocialLogin.login({
            provider: 'google',
            options: {
              scopes: ['email', 'profile', DRIVE_APPDATA_SCOPE],
            },
          });
          const extracted = extractOnlineProfile(loginResult.result);
          if (extracted) {
            setState({
              user: extracted.user,
              accessToken: extracted.token,
              isLoading: false,
              isInitialized: true,
            });
            return;
          }
        }
      } catch {
        // Not logged in or init failed — continue as guest
      }
      setState(prev => ({ ...prev, isInitialized: true }));
    };
    init();
  }, []);

  const signIn = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const loginResult = await SocialLogin.login({
        provider: 'google',
        options: {
          scopes: ['email', 'profile', DRIVE_APPDATA_SCOPE],
        },
      });
      const extracted = extractOnlineProfile(loginResult.result);
      if (extracted) {
        setState({
          user: extracted.user,
          accessToken: extracted.token,
          isLoading: false,
          isInitialized: true,
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
        throw new Error('Google sign-in returned offline response');
      }
    } catch {
      setState(prev => ({ ...prev, isLoading: false }));
      throw new Error('Google sign-in failed');
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await SocialLogin.logout({ provider: 'google' });
    } catch {
      // Logout may fail if session already expired
    }
    setState({ user: null, accessToken: null, isLoading: false, isInitialized: true });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    ...state,
    signIn,
    signOut,
  }), [state, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
