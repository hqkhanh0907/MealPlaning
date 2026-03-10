import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, renderHook } from '@testing-library/react';
import { AuthContext } from '../contexts/authContextDef';
import type { AuthContextValue } from '../contexts/authContextDef';
import { useAuth } from '../hooks/useAuth';

describe('useAuth', () => {
  it('should throw when used outside AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const BadComponent: React.FC = () => {
      useAuth();
      return null;
    };

    expect(() => render(<BadComponent />)).toThrow(
      'useAuth must be used within AuthProvider',
    );

    spy.mockRestore();
  });

  it('should return context value when used inside provider', () => {
    const mockValue: AuthContextValue = {
      user: { id: '1', email: 'a@b.com', displayName: 'A', photoUrl: null },
      accessToken: 'tok',
      isLoading: false,
      isInitialized: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    };

    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <AuthContext.Provider value={mockValue}>{children}</AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toBe(mockValue);
    expect(result.current.user?.email).toBe('a@b.com');
    expect(result.current.accessToken).toBe('tok');
    expect(result.current.isInitialized).toBe(true);
  });
});
