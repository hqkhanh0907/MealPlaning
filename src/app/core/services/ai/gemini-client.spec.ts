import { TestBed } from '@angular/core/testing';
import { z } from 'zod';

import { Database } from '../database/database';
import { GeminiClient, cleanupOldAiLogs } from './gemini-client';
import { GEMINI_API_KEY } from './gemini-key';
import { GeminiError } from './gemini-types';

/**
 * Tests for GeminiClient — covers the four classes of behavior we promise:
 *   1. Happy path: parse + zod validate + log success
 *   2. HTTP error mapping (400/401/403/429/500) → GeminiError.kind
 *   3. Retry policy (network/5xx/parse retry; others don't)
 *   4. Logging side-effect (ai_chat_log INSERT on every terminal outcome)
 *
 * We mock `globalThis.fetch` with a queue so each test can assert exactly
 * how many HTTP calls happened, and we use a spy `Database` to verify the
 * INSERT calls.
 */
describe('GeminiClient', () => {
  let fakeDb: jasmine.SpyObj<Database>;
  let client: GeminiClient;
  let originalFetch: typeof fetch;
  let originalSetTimeout: typeof setTimeout;

  const SimpleSchema = z.object({ value: z.string() });
  type SimpleResult = z.infer<typeof SimpleSchema>;

  /** Push a fake Response onto fetch queue. */
  let fetchQueue: (() => Response | Promise<Response>)[];

  function makeJsonResponse(payload: unknown, status = 200): Response {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  function makeGeminiCandidate(textPayload: unknown, tokens = 42): unknown {
    return {
      candidates: [
        {
          content: { parts: [{ text: JSON.stringify(textPayload) }] },
          finishReason: 'STOP',
        },
      ],
      usageMetadata: { totalTokenCount: tokens },
    };
  }

  beforeEach(() => {
    fakeDb = jasmine.createSpyObj<Database>('Database', [
      'initialize',
      'execute',
      'query',
      'getOne',
      'withTransaction',
    ]);
    fakeDb.execute.and.resolveTo();

    TestBed.configureTestingModule({
      providers: [
        GeminiClient,
        { provide: Database, useValue: fakeDb },
        { provide: GEMINI_API_KEY, useValue: 'TEST_KEY' },
      ],
    });
    client = TestBed.inject(GeminiClient);

    fetchQueue = [];
    originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      const next = fetchQueue.shift();
      if (!next) throw new Error('fetch queue empty');
      return next();
    }) as typeof fetch;

    // Make retry sleeps instant so tests don't take 7s.
    originalSetTimeout = globalThis.setTimeout;
    spyOn(globalThis, 'setTimeout').and.callFake(((handler: () => void) => {
      handler();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    globalThis.setTimeout = originalSetTimeout;
  });

  // -----------------------------------------------------------------------
  // Happy path
  // -----------------------------------------------------------------------

  it('returns parsed + validated payload on 200 OK', async () => {
    fetchQueue.push(() => makeJsonResponse(makeGeminiCandidate({ value: 'hello' })));

    const result = await client.generateContent<SimpleResult>('prompt', {
      feature: 'ingredient_lookup',
      schema: SimpleSchema,
    });

    expect(result).toEqual({ value: 'hello' });
    expect(fakeDb.execute).toHaveBeenCalledTimes(1);
    const sql = fakeDb.execute.calls.argsFor(0)[0];
    const params = fakeDb.execute.calls.argsFor(0)[1] as unknown[];
    expect(sql).toContain('INSERT INTO ai_chat_log');
    expect(params[1]).toBe('ingredient_lookup'); // feature column
    expect(params[2]).toBe('prompt');
    expect(params[5]).toBe(42); // tokens_used
  });

  it('passes systemInstruction + responseSchema in request body', async () => {
    let capturedBody: Record<string, unknown> | undefined;
    // Replace fetch entirely for this test (overrides beforeEach assignment).
    globalThis.fetch = (async (_url: string, init: RequestInit) => {
      capturedBody = JSON.parse(init.body as string) as Record<string, unknown>;
      return makeJsonResponse(makeGeminiCandidate({ value: 'x' }));
    }) as typeof fetch;

    await client.generateContent<SimpleResult>('prompt', {
      feature: 'dish_autofill',
      schema: SimpleSchema,
      systemInstruction: 'be concise',
      responseSchema: { type: 'object' },
    });

    expect(capturedBody).toBeDefined();
    expect(capturedBody!['systemInstruction']).toEqual({
      parts: [{ text: 'be concise' }],
    });
    const gen = capturedBody!['generationConfig'] as Record<string, unknown>;
    expect(gen['responseSchema']).toEqual({ type: 'object' });
    expect(gen['responseMimeType']).toBe('application/json');
  });

  // -----------------------------------------------------------------------
  // HTTP error mapping
  // -----------------------------------------------------------------------

  const errorCases = [
    { status: 400, kind: 'http_400' as const },
    { status: 401, kind: 'http_401' as const },
    { status: 403, kind: 'http_403' as const },
    { status: 429, kind: 'http_429' as const },
  ];

  errorCases.forEach(({ status, kind }) => {
    it(`maps HTTP ${status} to GeminiError.kind '${kind}' and does NOT retry`, async () => {
      fetchQueue.push(() => new Response('err', { status }));

      await expectAsync(
        client.generateContent<SimpleResult>('p', {
          feature: 'ingredient_lookup',
          schema: SimpleSchema,
        }),
      ).toBeRejectedWith(jasmine.objectContaining({ kind }) as unknown as GeminiError);

      // Only one fetch attempt — non-retryable
      expect(fetchQueue.length).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // Retry policy
  // -----------------------------------------------------------------------

  it('retries on HTTP 500 up to 3 attempts then surfaces http_5xx', async () => {
    fetchQueue.push(() => new Response('e', { status: 500 }));
    fetchQueue.push(() => new Response('e', { status: 502 }));
    fetchQueue.push(() => new Response('e', { status: 503 }));

    await expectAsync(
      client.generateContent<SimpleResult>('p', {
        feature: 'ingredient_lookup',
        schema: SimpleSchema,
      }),
    ).toBeRejectedWith(jasmine.objectContaining({ kind: 'http_5xx' }) as unknown as GeminiError);

    expect(fetchQueue.length).toBe(0); // all 3 used
  });

  it('retries on network error then succeeds on 2nd attempt', async () => {
    fetchQueue.push(() => {
      throw new TypeError('network down');
    });
    fetchQueue.push(() => makeJsonResponse(makeGeminiCandidate({ value: 'recovered' })));

    const result = await client.generateContent<SimpleResult>('p', {
      feature: 'ingredient_lookup',
      schema: SimpleSchema,
    });

    expect(result).toEqual({ value: 'recovered' });
    expect(fetchQueue.length).toBe(0);
  });

  it('does NOT retry on validation failure (zod)', async () => {
    fetchQueue.push(() => makeJsonResponse(makeGeminiCandidate({ wrongField: 'oops' })));
    // Only one in queue — if it retried, we'd get "fetch queue empty"
    await expectAsync(
      client.generateContent<SimpleResult>('p', {
        feature: 'ingredient_lookup',
        schema: SimpleSchema,
      }),
    ).toBeRejectedWith(jasmine.objectContaining({ kind: 'validation' }) as unknown as GeminiError);
  });

  // -----------------------------------------------------------------------
  // Logging
  // -----------------------------------------------------------------------

  it('logs ONCE per call, even when terminal failure', async () => {
    fetchQueue.push(() => new Response('e', { status: 401 }));

    await expectAsync(
      client.generateContent<SimpleResult>('p', {
        feature: 'ingredient_lookup',
        schema: SimpleSchema,
      }),
    ).toBeRejected();

    expect(fakeDb.execute).toHaveBeenCalledTimes(1);
    const params = fakeDb.execute.calls.argsFor(0)[1] as unknown[];
    const responseLog = JSON.parse(params[3] as string);
    expect(responseLog.error.kind).toBe('http_401');
  });

  it('does not crash when ai_chat_log INSERT fails', async () => {
    fakeDb.execute.and.rejectWith(new Error('db locked'));
    fetchQueue.push(() => makeJsonResponse(makeGeminiCandidate({ value: 'ok' })));

    const result = await client.generateContent<SimpleResult>('p', {
      feature: 'ingredient_lookup',
      schema: SimpleSchema,
    });
    expect(result).toEqual({ value: 'ok' });
  });

  // -----------------------------------------------------------------------
  // Empty key
  // -----------------------------------------------------------------------

  it('throws http_401 immediately when API key is empty', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        GeminiClient,
        { provide: Database, useValue: fakeDb },
        { provide: GEMINI_API_KEY, useValue: '' },
      ],
    });
    const c = TestBed.inject(GeminiClient);

    await expectAsync(
      c.generateContent<SimpleResult>('p', {
        feature: 'ingredient_lookup',
        schema: SimpleSchema,
      }),
    ).toBeRejectedWith(jasmine.objectContaining({ kind: 'http_401' }) as unknown as GeminiError);
    // Logged the failure even though we didn't hit the network
    expect(fakeDb.execute).toHaveBeenCalledTimes(1);
    expect(fetchQueue.length).toBe(0);
  });
});

describe('cleanupOldAiLogs', () => {
  it('runs DELETE with retention parameter', async () => {
    const db = jasmine.createSpyObj<Database>('Database', ['execute']);
    db.execute.and.resolveTo();
    await cleanupOldAiLogs(db, 30);
    expect(db.execute).toHaveBeenCalledTimes(1);
    const [sql, params] = db.execute.calls.argsFor(0);
    expect(sql).toContain('DELETE FROM ai_chat_log');
    expect(sql).toContain("datetime('now', '-' || ? || ' days')");
    expect(params).toEqual([30]);
  });

  it('skips invalid retention (0, negative, NaN)', async () => {
    const db = jasmine.createSpyObj<Database>('Database', ['execute']);
    db.execute.and.resolveTo();
    await cleanupOldAiLogs(db, 0);
    await cleanupOldAiLogs(db, -1);
    await cleanupOldAiLogs(db, Number.NaN);
    expect(db.execute).not.toHaveBeenCalled();
  });
});
