import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal, type Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';
import { z } from 'zod';

import { AccountSession, type AccountIdentity } from '../../account/account-session';
import { AiGeneration, AiRequestError } from './ai-generation';
import { GeminiClient } from './gemini-client';
import { GEMINI_API_KEY } from './gemini-key';
import { GROQ_API_KEY } from './groq-client';
import { GroqCredentials, NATIVE_GROQ, type NativeGroq } from './groq-credentials';
import { InsightAi } from './insight-ai';
import { NutritionAi } from './nutrition-ai';
import { foodImageResponseSchema } from './prompts/food-image-analysis.prompt';
import { aiTrainingPlanResponseSchema } from './prompts/training-plan.prompt';

describe('AiGeneration', () => {
  const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

  function setup(
    groqKey: string,
    geminiKey: string,
    extraProviders: Provider[] = [],
  ): { ai: AiGeneration; http: HttpTestingController; gemini: jasmine.SpyObj<GeminiClient> } {
    const gemini = jasmine.createSpyObj<GeminiClient>('GeminiClient', ['generateContent']);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GROQ_API_KEY, useValue: groqKey },
        { provide: GEMINI_API_KEY, useValue: geminiKey },
        { provide: GeminiClient, useValue: gemini },
        ...extraProviders,
      ],
    });
    return {
      ai: TestBed.inject(AiGeneration),
      http: TestBed.inject(HttpTestingController),
      gemini,
    };
  }

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  for (const [groq, gemini, text, photo] of [
    ['  ', '  ', null, null],
    ['groq', '', 'Groq', 'Groq'],
    ['', 'gemini', 'Gemini', null],
    ['groq', 'gemini', 'Groq', 'Groq'],
  ] as const) {
    it(`selects text ${text} and photo ${photo} with keys "${groq}/${gemini}"`, () => {
      const { ai } = setup(groq, gemini);
      expect(ai.providerFor('text')).toBe(text);
      expect(ai.providerFor('photo')).toBe(photo);
      expect(ai.configurationIssue('text') === null).toBe(text !== null);
      expect(ai.configurationIssue('photo') === null).toBe(photo !== null);
    });
  }

  it('keeps development credentials out of Android provider selection', () => {
    spyOn(Capacitor, 'getPlatform').and.returnValue('android');
    const { ai } = setup('development-groq', 'development-gemini');
    expect(ai.providerFor('text')).toBeNull();
    expect(ai.providerFor('photo')).toBeNull();
  });

  const ownerA = { id: 'aaaaaaaaaaaaaaa', username: 'alpha', name: 'Alpha' };
  const ownerB = { id: 'bbbbbbbbbbbbbbb', username: 'bravo', name: 'Bravo' };

  function setupAndroid() {
    spyOn(Capacitor, 'getPlatform').and.returnValue('android');
    const current = signal<AccountIdentity | null>(ownerA);
    const native = jasmine.createSpyObj<NativeGroq>('MealPlanGroq', [
      'status',
      'configure',
      'clear',
      'generate',
    ]);
    native.status.and.resolveTo({ configured: false });
    native.configure.and.resolveTo({ configured: true });
    native.clear.and.resolveTo({ configured: false });
    const services = setup('development-groq', 'development-gemini', [
      { provide: AccountSession, useValue: { current } },
      { provide: NATIVE_GROQ, useValue: native },
    ]);
    return { ...services, native, current, credentials: TestBed.inject(GroqCredentials) };
  }

  it('refreshes Android provider status on restore and updates after save or removal', async () => {
    const { ai, native, current, credentials } = setupAndroid();
    const insight = TestBed.inject(InsightAi);
    current.set(null);
    TestBed.tick();
    expect(native.status).not.toHaveBeenCalled();
    expect(insight.providerName).toBeNull();

    native.status.and.resolveTo({ configured: true });
    current.set({ ...ownerA });
    TestBed.tick();
    await Promise.resolve();
    expect(native.status).toHaveBeenCalledWith({ ownerId: ownerA.id });
    expect(insight.providerName).toBe('Groq');
    expect(ai.providerFor('photo')).toBe('Groq');

    await credentials.remove();
    expect(native.clear).toHaveBeenCalledOnceWith({ ownerId: ownerA.id });
    expect(insight.providerName).toBeNull();
    expect(await credentials.configure()).toBeTrue();
    expect(native.configure).toHaveBeenCalledOnceWith({ ownerId: ownerA.id });
    expect(insight.providerName).toBe('Groq');

    native.configure.and.resolveTo({ configured: true, cancelled: true });
    expect(await credentials.configure()).toBeFalse();
    expect(insight.providerName).toBe('Groq');
  });

  it('ignores a late configuration result after sign-out and relogin', async () => {
    const { credentials, native, current } = setupAndroid();
    let complete!: (value: { configured: boolean }) => void;
    native.configure.and.returnValue(new Promise((resolve) => (complete = resolve)));
    const oldChange = credentials.configure();

    current.set(null);
    current.set(ownerB);
    await credentials.refresh();
    expect(credentials.configured()).toBeFalse();
    current.set({ ...ownerA });
    await credentials.refresh();
    complete({ configured: true });

    expect(await oldChange).toBeFalse();
    expect(credentials.configured()).toBeFalse();
  });

  it('uses the same owner-scoped Android bridge for strict text and photo payloads', async () => {
    const { ai, credentials, gemini, http, native } = setupAndroid();
    await credentials.configure();
    const schema = z.object({ result: z.string() }).strict();
    native.generate.and.resolveTo({ status: 200, content: '{"result":"restored"}' });

    expect(
      await ai.generateText('text fixture', {
        feature: 'daily_insight',
        schema,
        systemInstruction: 'system fixture',
        timeoutMs: 30_000,
        maxOutputTokens: 1024,
      }),
    ).toEqual({ result: 'restored' });
    expect(
      await ai.generatePhoto('photo fixture', { mimeType: 'image/png', data: 'AA==' }, schema),
    ).toEqual({ result: 'restored' });

    const [[text], [photo]] = native.generate.calls.allArgs();
    expect(text).toEqual({
      ownerId: ownerA.id,
      timeoutMs: 30_000,
      payload: jasmine.objectContaining({
        model: 'qwen/qwen3.8-27b',
        max_completion_tokens: 1024,
        messages: [
          { role: 'system', content: 'system fixture' },
          { role: 'user', content: 'text fixture' },
        ],
        response_format: jasmine.objectContaining({
          json_schema: jasmine.objectContaining({ name: 'daily_insight', strict: true }),
        }),
      }),
    });
    expect(photo).toEqual({
      ownerId: ownerA.id,
      timeoutMs: 60_000,
      payload: jasmine.objectContaining({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'photo fixture' },
              { type: 'image_url', image_url: { url: 'data:image/png;base64,AA==' } },
            ],
          },
        ],
        response_format: jasmine.objectContaining({
          json_schema: jasmine.objectContaining({ name: 'food_photo_analysis', strict: true }),
        }),
      }),
    });
    http.expectNone(endpoint);
    expect(gemini.generateContent).not.toHaveBeenCalled();
  });

  it('discards an Android report if the app account changes while it is generated', async () => {
    const { ai, credentials, current, native } = setupAndroid();
    await credentials.configure();
    let complete!: (value: { status: number; content: string }) => void;
    native.generate.and.returnValue(new Promise((resolve) => (complete = resolve)));
    const pending = ai.generateText('synthetic', {
      feature: 'daily_insight',
      schema: z.object({ result: z.string() }),
    });
    current.set(ownerB);
    complete({ status: 200, content: '{"result":"old account"}' });

    await expectAsync(pending).toBeRejectedWithError(AiRequestError, /Tài khoản đã thay đổi/);
  });

  it('maps Android timeout and HTTP rejection without exposing native or provider details', async () => {
    const { ai, credentials, gemini, native } = setupAndroid();
    await credentials.configure();
    const generate = () =>
      ai.generateText('synthetic', {
        feature: 'daily_insight',
        schema: z.object({ result: z.string() }),
      });

    native.generate.and.rejectWith({ code: 'groq_timeout', message: 'Any native detail' });
    await expectAsync(generate()).toBeRejectedWithError(
      AiRequestError,
      'Groq mất quá nhiều thời gian để phản hồi. Hãy thử lại.',
    );
    native.generate.and.resolveTo({ status: 401, content: 'Any provider detail' });
    await expectAsync(generate()).toBeRejectedWithError(AiRequestError, /quyền truy cập/);
    expect(gemini.generateContent).not.toHaveBeenCalled();
  });

  it('keeps photo local for a Gemini-only installation', async () => {
    const { ai, http, gemini } = setup('', 'gemini');
    await expectAsync(
      ai.generatePhoto('ảnh mẫu', { mimeType: 'image/png', data: 'AA==' }, foodImageResponseSchema),
    ).toBeRejectedWithError(AiRequestError, ai.configurationIssue('photo')!);
    http.expectNone(endpoint);
    expect(gemini.generateContent).not.toHaveBeenCalled();
  });

  it('preserves local ingredient matching for Groq-only autofill', async () => {
    const { http } = setup(' groq ', '');
    const result = TestBed.inject(NutritionAi).autofillDish('Cơm', [
      { id: 'private-local-id', name: 'Gạo tẻ' },
    ]);
    const request = http.expectOne(endpoint);
    expect(request.request.headers.get('Authorization')).toBe('Bearer groq');
    expect(request.request.body.max_completion_tokens).toBe(8192);
    expect(JSON.stringify(request.request.body)).not.toContain('private-local-id');
    const schema = request.request.body.response_format.json_schema.schema;
    expect(schema.additionalProperties).toBeFalse();
    expect(schema.properties.ingredients.items.required).toContain('fiber_per_100g');
    request.flush({
      choices: [
        {
          message: {
            content: JSON.stringify({
              ingredients: [
                {
                  name: 'Gạo tẻ',
                  gram_weight: 60,
                  category: 'Ngũ cốc',
                  calories_per_100g: 350,
                  protein_per_100g: 7,
                  carbs_per_100g: 78,
                  fat_per_100g: 1,
                  fiber_per_100g: 2,
                  confidence: 'medium',
                },
              ],
            }),
          },
        },
      ],
    });
    expect((await result).rows[0]).toEqual(
      jasmine.objectContaining({
        kind: 'existing',
        matchedIngredientId: 'private-local-id',
        gramWeight: 60,
      }),
    );
  });

  it('retains required but nullable notes inside nested exercises for Gemini', async () => {
    const { ai, gemini } = setup('', 'gemini');
    await ai.generateText('synthetic', {
      feature: 'training_plan',
      schema: aiTrainingPlanResponseSchema,
    });
    const options = gemini.generateContent.calls.mostRecent().args[1];
    expect(options.responseSchema).toEqual(
      jasmine.objectContaining({
        properties: jasmine.objectContaining({
          days: jasmine.objectContaining({
            items: jasmine.objectContaining({
              properties: jasmine.objectContaining({
                exercises: jasmine.objectContaining({
                  items: jasmine.objectContaining({
                    required: jasmine.arrayContaining(['notes']),
                    properties: jasmine.objectContaining({
                      notes: { type: 'STRING', nullable: true },
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
    );
  });
});
