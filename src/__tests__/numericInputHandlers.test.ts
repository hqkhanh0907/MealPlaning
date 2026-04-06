import { describe, expect, it, vi } from 'vitest';

import { blockNegativeKeys } from '@/utils/numericInputHandlers';

function createKeyEvent(key: string) {
  return {
    key,
    preventDefault: vi.fn(),
  } as unknown as React.KeyboardEvent<HTMLInputElement>;
}

describe('blockNegativeKeys', () => {
  it('blocks minus key', () => {
    const e = createKeyEvent('-');
    blockNegativeKeys(e);
    expect(e.preventDefault).toHaveBeenCalled();
  });

  it('blocks lowercase e key', () => {
    const e = createKeyEvent('e');
    blockNegativeKeys(e);
    expect(e.preventDefault).toHaveBeenCalled();
  });

  it('blocks uppercase E key', () => {
    const e = createKeyEvent('E');
    blockNegativeKeys(e);
    expect(e.preventDefault).toHaveBeenCalled();
  });

  it('allows digit keys', () => {
    const e = createKeyEvent('5');
    blockNegativeKeys(e);
    expect(e.preventDefault).not.toHaveBeenCalled();
  });

  it('allows decimal point', () => {
    const e = createKeyEvent('.');
    blockNegativeKeys(e);
    expect(e.preventDefault).not.toHaveBeenCalled();
  });

  it('allows Backspace', () => {
    const e = createKeyEvent('Backspace');
    blockNegativeKeys(e);
    expect(e.preventDefault).not.toHaveBeenCalled();
  });

  it('allows Tab', () => {
    const e = createKeyEvent('Tab');
    blockNegativeKeys(e);
    expect(e.preventDefault).not.toHaveBeenCalled();
  });

  it('allows Enter', () => {
    const e = createKeyEvent('Enter');
    blockNegativeKeys(e);
    expect(e.preventDefault).not.toHaveBeenCalled();
  });
});
