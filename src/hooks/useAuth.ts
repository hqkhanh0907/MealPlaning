import { useContext } from 'react';

import type { AuthContextValue } from '../contexts/authContextDef';
import { AuthContext } from '../contexts/authContextDef';

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
