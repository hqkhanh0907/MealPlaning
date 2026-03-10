import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { useImperativeHandle, forwardRef } from 'react';
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

interface ContextCaptureHandle {
  getCtx: () => AuthContextValue;
}

const ContextCapture = forwardRef<ContextCaptureHandle>((_props, ref) => {
  const ctx = useAuth();
  useImperativeHandle(ref, () => ({ getCtx: () => ctx }));
  return null;
});
ContextCapture.displayName = 'ContextCapture';

const ctxRef = { current: null as ContextCaptureHandle | null };

const TestConsumer: React.FC = () => {
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
    mockInitialize.mockResolvedValue(undefined);
    mockLogout.mockResolvedValue(undefined);
    mockIsLoggedIn.mockResolvedValue({ isLoggedIn: false });
  });

  describe('initialization', () => {
    it('should initialize with user null when not logged in', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true');
      });

      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('token').textContent).toBe('null');
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    it('should populate user when already logged in', async () => {
      mockIsLoggedIn.mockResolvedValue({ isLoggedIn: true });
      mockLogin.mockResolvedValue(mockOnlineResponse);

      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('test@gmail.com');
      });

      expect(screen.getByTestId('token').textContent).toBe('test-access-token');
      expect(screen.getByTestId('initialized').textContent).toBe('true');
    });

    it('should gracefully handle init error and set isInitialized true', async () => {
      mockInitialize.mockRejectedValue(new Error('Init failed'));

      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true');
      });

      expect(screen.getByTestId('user').textContent).toBe('null');
    });

    it('should set isInitialized true when isLoggedIn returns false', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true');
      });

      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('token').textContent).toBe('null');
    });

    it('should handle login returning offline response during init', async () => {
      mockIsLoggedIn.mockResolvedValue({ isLoggedIn: true });
      mockLogin.mockResolvedValue({
        result: { responseType: 'offline' },
      });

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
          profile: {
            id: 'user123',
            email: 'test@gmail.com',
            name: 'Test User',
            imageUrl: 'https://photo.url',
          },
          accessToken: {},
        },
      });

      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('test@gmail.com');
      });

      expect(screen.getByTestId('token').textContent).toBe('null');
      expect(screen.getByTestId('initialized').textContent).toBe('true');
    });

    it('should handle online response with profile missing all fields', async () => {
      mockIsLoggedIn.mockResolvedValue({ isLoggedIn: true });
      mockLogin.mockResolvedValue({
        result: {
          responseType: 'online',
          profile: {
            id: null,
            email: null,
            name: null,
            imageUrl: null,
          },
          accessToken: { token: 'tok' },
        },
      });

      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true');
        expect(screen.getByTestId('token').textContent).toBe('tok');
      });

      expect(screen.getByTestId('user').textContent).toBe('');
    });
  });

  describe('signIn', () => {
    it('should populate user on successful sign-in', async () => {
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
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    it('should throw when sign-in returns offline response', async () => {
      renderApp();
      await waitFor(() => {
        expect(screen.getByTestId('initialized').textContent).toBe('true');
      });

      mockLogin.mockResolvedValue({
        result: { responseType: 'offline' },
      });

      await act(async () => {
        await expect(ctxRef.current!.getCtx().signIn()).rejects.toThrow('Google sign-in failed');
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
    });

    it('should throw and reset loading when login throws', async () => {
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

  describe('signOut', () => {
    it('should clear user state on successful sign-out', async () => {
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

    it('should still clear user state when logout throws', async () => {
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

      expect(screen.getByTestId('token').textContent).toBe('null');
    });
  });
});
