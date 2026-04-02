import { describe, expect, it } from 'vitest';

import { AuthContext } from '../contexts/authContextDef';

describe('authContextDef', () => {
  it('should export AuthContext as a defined React context', () => {
    expect(AuthContext).toBeDefined();
  });

  it('should have null as the default context value (no provider)', () => {
    const ctx = AuthContext as unknown as { _currentValue: unknown };
    expect(ctx._currentValue).toBeNull();
  });

  it('should have Provider and Consumer properties', () => {
    expect(AuthContext.Provider).toBeDefined();
    expect(AuthContext.Consumer).toBeDefined();
  });
});
