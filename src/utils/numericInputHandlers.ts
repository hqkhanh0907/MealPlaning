import type React from 'react';

/**
 * Prevents typing minus (-), e, and E characters in numeric inputs.
 * Attach as `onKeyDown` to inputs that should only accept non-negative numbers.
 */
export const blockNegativeKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === '-' || e.key === 'e' || e.key === 'E') {
    e.preventDefault();
  }
};
