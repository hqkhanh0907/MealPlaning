import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { useImperativeHandle } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../contexts/AuthContext';
import { useAuth } from '../hooks/useAuth';
import type { AuthContextValue } from '../contexts/authContextDef';

const mockInitialize = vi.fn();
const mockLogin = vi.fn();
const mockLogout = vi.fn();
const mockIsLoggedIn = vi.fn();

vi.mock('@capgo/capacitor-social-login', () => ({
  SocialLogin: {
    initialize: (...args: unknown[]) => mockInitialize(...args),
    login: (...args: unknown[]) => mockLogin(...args),
    logout: (...args: unknown[]) => mockLogout(...args),
    isLoggedIn: (...args: unknown[]) => mockIsLoggedIn(...args),
  },
}));

let mockIsNative: boolean | 'throw' = false;
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => {
      if (mockIsNative === 'throw') throw new Error('Capacitor not available');
      return mockIsNative;
    },
  },
}));

const mockDb = {} as import('../services/databaseService').DatabaseService;
vi.mock('../contexts/DatabaseContext', () => ({
  useDatabase: () => mockDb,
}));

const mockGetSetting = vi.fn();
const mockSetSetting = vi.fn();
const mockDeleteSetting = vi.fn();
vi.mock('../services/appSettings', () => ({
  getSetting: (...args: unknown[]) => mockGetSetting(...args),
  setSetting: (...args: unknown[]) => mockSetSetting(...args),
  deleteSetting: (...args: unknown[]) => mockDeleteSetting(...args),
}));

interface ContextCaptureHandle {
  getCtx: () => AuthContextValue;
}

const ContextCapture = ({ ref }: { ref?: React.Ref<ContextCaptureHandle> }) => {
  const ctx = useAuth();
  useImperativeHandle(ref, () => ({ getCtx: () => ctx }));
  return null;
};

const ctxRef = { current: null as ContextCaptureHandle | null };

const TestConsumer = () => {
  const { user, accessToken, isLoading, isInitialized, signIn, signOut } = useAuth();
  return (
    <div>
      <span data-testid="user">{user ? user.email : 'null'}</span>
      <span data-testid="token">{accessToken ?? 'null'}</span>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="initialized">{String(isInitialized)}</span>
      <button onClick={() => signIn().catch(() => {})}>sign-in</button>
      <button onClick={() => signOut()}>sign-out</button>
    </div>
  );
};

const mockOnlineResponse = {
  result: {
    responseType: 'online',
    profile: {
      id: 'user123',
      email: 'test@gmail.com',
      name: 'Test User',
      imageUrl: 'https://photo.url',
    },
    accessToken: { token: 'test-access-token' },
  },
};

const renderApp = () =>
  render(
    <AuthProvider>
      <TestConsumer />
      <ContextCapture ref={ctxRef} />
    </AuthProvider>,
  );

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsNative = false;
    mockInitialize.mockResolvedValue(undefined);
    mockLogout.mockResolvedValue(undefined);
    mockIsLoggedIn.mockResolvedValue({ isLoggedIn: false });
    mockGetSetting.mockResolvedValue(null);
    mockSetSetting.mockResolvedValue(undefined);
    mockDeleteSetting.mockResolvedValue(undefined);
  });

  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).google;
  });

  describe('initialization — native platform', () => {
    beforeEach(() => {
      mockIsNative = true;
    });

    it('should initialize with user null when not logged in on native', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true');
      });

      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('token').textContent).toBe('null');
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    it('should populate user when already logged in on native', async () => {
      mockIsLoggedIn.mockResolvedValue({ isLoggedIn: true });
      mockLogin.mockResolvedValue(mockOnlineResponse);

      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('test@gmail.com');
      });

      expect(screen.getByTestId('token').textContent).toBe('test-access-token');
      expect(screen.getByTestId('initialized').textContent).toBe('true');
    });

    it('should gracefully handle init error on native', async () => {
      mockInitialize.mockRejectedValue(new Error('Init failed'));

      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true');
      });

      expect(screen.getByTestId('user').textContent).toBe('null');
    });

    it('should handle login returning offline response during init', async () => {
      mockIsLoggedIn.mockResolvedValue({ isLoggedIn: true });
      mockLogin.mockResolvedValue({ result: { responseType: 'offline' } });

      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true');
      });

      expect(screen.getByTestId('user').textContent).toBe('null');
    });

    it('should handle online response with no accessToken.token', async () => {
      mockIsLoggedIn.mockResolvedValue({ isLoggedIn: true });
      mockLogin.mockResolvedValue({
        result: {
          responseType: 'online',
          profile: { id: 'u1', email: 'e@g.com', name: 'N', imageUrl: 'url' },
          accessToken: {},
        },
      });

      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('e@g.com');
      });

      expect(screen.getByTestId('token').textContent).toBe('null');
    });

    it('should handle online response with profile missing all fields', async () => {
      mockIsLoggedIn.mockResolvedValue({ isLoggedIn: true });
      mockLogin.mockResolvedValue({
        result: {
          responseType: 'online',
          profile: { id: null, email: null, name: null, imageUrl: null },
          accessToken: { token: 'tok' },
        },
      });

      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId('token').textContent).toBe('tok');
      });

      expect(screen.getByTestId('user').textContent).toBe('');
    });

    it('should persist auth state to SQLite on native login', async () => {
      mockIsLoggedIn.mockResolvedValue({ isLoggedIn: true });
      mockLogin.mockResolvedValue(mockOnlineResponse);

      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('test@gmail.com');
      });

      expect(mockSetSetting).toHaveBeenCalledWith(
        mockDb,
        'auth_state',
        expect.stringContaining('test@gmail.com'),
      );
    });
  });

  describe('initialization — web platform', () => {
    it('should initialize as guest on web when no persisted auth', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true');
      });

      expect(screen.getByTestId('user').textContent).toBe('null');
    });

    it('should restore persisted auth from SQLite on web', async () => {
      mockGetSetting.mockResolvedValue(JSON.stringify({
        user: { id: 'u1', email: 'saved@g.com', displayName: 'Saved', photoUrl: null },
        accessToken: 'saved-token',
      }));

      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('saved@g.com');
      });
      expect(screen.getByTestId('token').textContent).toBe('saved-token');
      expect(screen.getByTestId('initialized').textContent).toBe('true');
    });

    it('should handle corrupt persisted auth gracefully', async () => {
      mockGetSetting.mockResolvedValue('not-json');

      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true');
      });

      expect(screen.getByTestId('user').textContent).toBe('null');
    });

    it('should handle persisted auth with missing user fields', async () => {
      mockGetSetting.mockResolvedValue(JSON.stringify({ user: null, accessToken: null }));

      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true');
      });

      expect(screen.getByTestId('user').textContent).toBe('null');
    });

    it('should handle getSetting rejection gracefully', async () => {
      mockGetSetting.mockRejectedValue(new Error('DB read failed'));

      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true');
      });

      expect(screen.getByTestId('user').textContent).toBe('null');
    });
  });

  describe('signIn — native platform', () => {
    beforeEach(() => {
      mockIsNative = true;
    });

    it('should populate user on successful native sign-in', async () => {
      renderApp();
      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true');
      });

      mockLogin.mockResolvedValue(mockOnlineResponse);

      const user = userEvent.setup();
      await user.click(screen.getByText('sign-in'));

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('test@gmail.com');
      });

      expect(screen.getByTestId('token').textContent).toBe('test-access-token');
    });

    it('should throw when native sign-in returns offline response', async () => {
      renderApp();
      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true');
      });

      mockLogin.mockResolvedValue({ result: { responseType: 'offline' } });

      await act(async () => {
        await expect(ctxRef.current!.getCtx().signIn()).rejects.toThrow('Google sign-in failed');
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
    });

    it('should throw and reset loading when native login throws', async () => {
      renderApp();
      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true');
      });

      mockLogin.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await expect(ctxRef.current!.getCtx().signIn()).rejects.toThrow('Google sign-in failed');
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
    });
  });

  describe('signIn — web platform (GIS)', () => {
    it('should throw when GIS is not loaded on web', async () => {
      renderApp();
      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true');
      });

      await act(async () => {
        await expect(ctxRef.current!.getCtx().signIn()).rejects.toThrow('Google Identity Services not loaded');
      });
    });

    it('should sign in via GIS token client on web', async () => {
      let gisCallback: ((resp: { access_token: string; error?: string }) => void) | null = null;
      (window as unknown as Record<string, unknown>).google = {
        accounts: {
          oauth2: {
            initTokenClient: (config: { callback: typeof gisCallback }) => {
              gisCallback = config.callback;
              return { requestAccessToken: vi.fn() };
            },
            revoke: vi.fn(),
          },
        },
      };

      const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({
          sub: 'gis-id',
          email: 'gis@gmail.com',
          name: 'GIS User',
          picture: 'https://pic.url',
        })),
      );

      renderApp();
      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true');
      });

      let signInPromise: Promise<void>;
      await act(async () => {
        signInPromise = ctxRef.current!.getCtx().signIn();
      });

      expect(gisCallback).toBeTruthy();

      await act(async () => {
        gisCallback!({ access_token: 'gis-token' });
        await signInPromise!;
      });

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('gis@gmail.com');
      });
      expect(screen.getByTestId('token').textContent).toBe('gis-token');

      mockFetch.mockRestore();
    });

    it('should handle GIS error response', async () => {
      let gisCallback: ((resp: { access_token: string; error?: string }) => void) | null = null;
      (window as unknown as Record<string, unknown>).google = {
        accounts: {
          oauth2: {
            initTokenClient: (config: { callback: typeof gisCallback }) => {
              gisCallback = config.callback;
              return { requestAccessToken: vi.fn() };
            },
            revoke: vi.fn(),
          },
        },
      };

      renderApp();
      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true');
      });

      let signInError: Error | null = null;
      await act(async () => {
        const promise = ctxRef.current!.getCtx().signIn();
        // Simulate GIS error after a tick
        await new Promise<void>(r => setTimeout(r, 0));
        gisCallback!({ access_token: '', error: 'access_denied' });
        try {
          await promise;
        } catch (e) {
          signInError = e as Error;
        }
      });

      expect(signInError).toBeTruthy();
      expect(signInError!.message).toContain('access_denied');
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    it('should handle GIS user info fetch failure', async () => {
      let gisCallback: ((resp: { access_token: string; error?: string }) => void) | null = null;
      (window as unknown as Record<string, unknown>).google = {
        accounts: {
          oauth2: {
            initTokenClient: (config: { callback: typeof gisCallback }) => {
              gisCallback = config.callback;
              return { requestAccessToken: vi.fn() };
            },
            revoke: vi.fn(),
          },
        },
      };

      const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(null, { status: 401 }),
      );

      renderApp();
      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true');
      });

      let signInError: Error | null = null;
      await act(async () => {
        const promise = ctxRef.current!.getCtx().signIn();
        await new Promise<void>(r => setTimeout(r, 0));
        gisCallback!({ access_token: 'bad-token' });
        try {
          await promise;
        } catch (e) {
          signInError = e as Error;
        }
      });

      expect(signInError).toBeTruthy();
      expect(signInError!.message).toContain('Failed to fetch user info');
      expect(screen.getByTestId('loading').textContent).toBe('false');

      mockFetch.mockRestore();
    });

    it('should reset loading state when popup is closed (error_callback)', async () => {
      let gisErrorCallback: ((error: { type: string }) => void) | null = null;
      (window as unknown as Record<string, unknown>).google = {
        accounts: {
          oauth2: {
            initTokenClient: (config: { callback: unknown; error_callback?: typeof gisErrorCallback }) => {
              gisErrorCallback = config.error_callback ?? null;
              return { requestAccessToken: vi.fn() };
            },
            revoke: vi.fn(),
          },
        },
      };

      renderApp();
      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true');
      });

      let signInError: Error | null = null;
      await act(async () => {
        const promise = ctxRef.current!.getCtx().signIn();
        await new Promise<void>(r => setTimeout(r, 0));
        gisErrorCallback!({ type: 'popup_closed' });
        try {
          await promise;
        } catch (e) {
          signInError = e as Error;
        }
      });

      expect(signInError).toBeTruthy();
      expect(signInError!.message).toContain('popup was closed');
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    it('should reset loading state on popup_failed_to_open error', async () => {
      let gisErrorCallback: ((error: { type: string }) => void) | null = null;
      (window as unknown as Record<string, unknown>).google = {
        accounts: {
          oauth2: {
            initTokenClient: (config: { callback: unknown; error_callback?: typeof gisErrorCallback }) => {
              gisErrorCallback = config.error_callback ?? null;
              return { requestAccessToken: vi.fn() };
            },
            revoke: vi.fn(),
          },
        },
      };

      renderApp();
      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true');
      });

      let signInError: Error | null = null;
      await act(async () => {
        const promise = ctxRef.current!.getCtx().signIn();
        await new Promise<void>(r => setTimeout(r, 0));
        gisErrorCallback!({ type: 'popup_failed_to_open' });
        try {
          await promise;
        } catch (e) {
          signInError = e as Error;
        }
      });

      expect(signInError).toBeTruthy();
      expect(signInError!.message).toContain('popup_failed_to_open');
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
  });

  describe('signOut — native platform', () => {
    beforeEach(() => {
      mockIsNative = true;
    });

    it('should clear user state on successful native sign-out', async () => {
      mockIsLoggedIn.mockResolvedValue({ isLoggedIn: true });
      mockLogin.mockResolvedValue(mockOnlineResponse);

      renderApp();
      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('test@gmail.com');
      });

      const user = userEvent.setup();
      await user.click(screen.getByText('sign-out'));

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('null');
      });

      expect(screen.getByTestId('token').textContent).toBe('null');
    });

    it('should still clear user state when native logout throws', async () => {
      mockIsLoggedIn.mockResolvedValue({ isLoggedIn: true });
      mockLogin.mockResolvedValue(mockOnlineResponse);

      renderApp();
      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('test@gmail.com');
      });

      mockLogout.mockRejectedValue(new Error('Session expired'));

      const user = userEvent.setup();
      await user.click(screen.getByText('sign-out'));

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('null');
      });
    });

    it('should delete persisted auth from SQLite on sign-out', async () => {
      mockIsLoggedIn.mockResolvedValue({ isLoggedIn: true });
      mockLogin.mockResolvedValue(mockOnlineResponse);

      renderApp();
      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('test@gmail.com');
      });

      expect(mockSetSetting).toHaveBeenCalledWith(
        mockDb,
        'auth_state',
        expect.any(String),
      );

      const user = userEvent.setup();
      await user.click(screen.getByText('sign-out'));

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('null');
      });

      expect(mockDeleteSetting).toHaveBeenCalledWith(mockDb, 'auth_state');
    });
  });

  describe('signOut — web platform', () => {
    it('should revoke token via GIS on web sign-out', async () => {
      const mockRevoke = vi.fn();
      (window as unknown as Record<string, unknown>).google = {
        accounts: {
          oauth2: {
            initTokenClient: vi.fn(),
            revoke: mockRevoke,
          },
        },
      };

      mockGetSetting.mockResolvedValue(JSON.stringify({
        user: { id: 'u1', email: 'web@g.com', displayName: 'Web', photoUrl: null },
        accessToken: 'web-token',
      }));

      renderApp();
      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('web@g.com');
      });

      const user = userEvent.setup();
      await user.click(screen.getByText('sign-out'));

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('null');
      });

      expect(mockRevoke).toHaveBeenCalledWith('web-token');
      expect(mockDeleteSetting).toHaveBeenCalledWith(mockDb, 'auth_state');
    });

    it('should handle sign-out when no google namespace on window', async () => {
      mockGetSetting.mockResolvedValue(JSON.stringify({
        user: { id: 'u1', email: 'web@g.com', displayName: 'Web', photoUrl: null },
        accessToken: 'web-token',
      }));

      renderApp();
      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('web@g.com');
      });

      const user = userEvent.setup();
      await user.click(screen.getByText('sign-out'));

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('null');
      });
    });
  });

  describe('edge cases', () => {
    it('should fall back to web flow when Capacitor throws', async () => {
      mockIsNative = 'throw';

      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true');
      });

      expect(screen.getByTestId('user').textContent).toBe('null');
    });
  });
});
