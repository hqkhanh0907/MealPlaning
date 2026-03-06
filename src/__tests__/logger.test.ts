import { describe, it, expect, vi, afterEach } from 'vitest';
import { logger, generateTraceId } from '../utils/logger';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('logger.error', () => {
  it('should call console.error with formatted prefix and sanitized Error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Something broke');
    logger.error({ component: 'AIImageAnalyzer', action: 'analyzeImage' }, error);

    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toBe('[AIImageAnalyzer] analyzeImage');
    expect(spy.mock.calls[0][1]).toEqual(
      expect.objectContaining({ message: 'Something broke', name: 'Error' })
    );
  });

  it('should sanitize non-Error values into { raw: value }', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error({ component: 'TestComp', action: 'fail' }, 'plain string error');

    expect(spy.mock.calls[0][1]).toEqual({ raw: 'plain string error' });
  });

  it('should sanitize null/undefined errors', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error({ component: 'TestComp', action: 'nullErr' }, null);
    expect(spy.mock.calls[0][1]).toEqual({ raw: null });

    logger.error({ component: 'TestComp', action: 'undefinedErr' }, undefined);
    expect(spy.mock.calls[1][1]).toEqual({ raw: undefined });
  });
});

describe('logger.warn', () => {
  it('should call console.warn with formatted prefix and message', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn({ component: 'DataService', action: 'migrate' }, 'Legacy format detected');

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith('[DataService] migrate', 'Legacy format detected');
  });
});

describe('logger.info', () => {
  it('should call console.info with formatted prefix and message', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.info({ component: 'App', action: 'init' }, 'App started');

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith('[App] init', 'App started');
  });
});

describe('logger.debug', () => {
  it('should call console.debug in DEV mode', () => {
    // vitest runs with import.meta.env.DEV = true by default
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    logger.debug({ component: 'Tips', action: 'compute' }, 'Recalculating tips');

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith('[Tips] compute', 'Recalculating tips');
  });

  it('should NOT call console.debug when import.meta.env.DEV is false', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const originalDev = import.meta.env.DEV;
    import.meta.env.DEV = false;
    logger.debug({ component: 'Tips', action: 'compute' }, 'Should not log');
    expect(spy).not.toHaveBeenCalled();
    import.meta.env.DEV = originalDev;
  });
});

describe('traceId support', () => {
  it('should include [trace:xxx] in prefix when traceId is provided', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn({ component: 'DataService', action: 'migrate', traceId: 'abc123' }, 'test');

    expect(spy).toHaveBeenCalledWith('[DataService] migrate [trace:abc123]', 'test');
  });

  it('should include traceId in error prefix', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error({ component: 'AI', action: 'call', traceId: 'tr99' }, new Error('fail'));

    expect(spy.mock.calls[0][0]).toBe('[AI] call [trace:tr99]');
  });

  it('should include traceId in info prefix', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.info({ component: 'App', action: 'load', traceId: 'id7' }, 'loaded');

    expect(spy).toHaveBeenCalledWith('[App] load [trace:id7]', 'loaded');
  });

  it('should include traceId in debug prefix', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    logger.debug({ component: 'Hook', action: 'run', traceId: 'dbg1' }, 'debug msg');

    expect(spy).toHaveBeenCalledWith('[Hook] run [trace:dbg1]', 'debug msg');
  });

  it('should NOT include [trace:] when traceId is omitted', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.info({ component: 'App', action: 'init' }, 'no trace');

    expect(spy).toHaveBeenCalledWith('[App] init', 'no trace');
  });
});

describe('generateTraceId', () => {
  it('should return an 8-character alphanumeric string', () => {
    const id = generateTraceId();
    expect(id).toHaveLength(8);
    expect(id).toMatch(/^[a-z0-9]+$/);
  });

  it('should return unique values on subsequent calls', () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateTraceId()));
    // With 36^8 possibilities, 20 unique is virtually certain
    expect(ids.size).toBe(20);
  });
});
