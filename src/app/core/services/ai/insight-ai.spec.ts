import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { GeminiClient } from './gemini-client';
import { GEMINI_API_KEY } from './gemini-key';
import { GeminiError } from './gemini-types';
import { GROQ_API_KEY } from './groq-client';
import { DailyInsightError, InsightAi, type DailyInsightAiInput } from './insight-ai';

describe('InsightAi provider routing', () => {
  const totals = { calories: 450, protein: 20, carbs: 60, fat: 10, fiber: 4 };
  const input: DailyInsightAiInput = {
    date: '2026-05-10',
    level: 'beginner',
    totals,
    logged: totals,
    targets: totals,
    workoutVolumeKg: 0,
    workoutStreakWeeks: 0,
  };
  const endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  const response = {
    title: 'Bữa trưa',
    body: 'Bạn đã ghi đủ bữa.',
    action: 'Ghi bữa tối.',
    tone: 'success' as const,
  };

  function setup(
    groqKey: string,
    geminiKey: string,
  ): {
    gemini: jasmine.SpyObj<GeminiClient>;
    ai: InsightAi;
    http: HttpTestingController;
  } {
    const gemini = jasmine.createSpyObj<GeminiClient>('GeminiClient', ['generateContent']);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GROQ_API_KEY, useValue: groqKey },
        { provide: GEMINI_API_KEY, useValue: geminiKey },
        { provide: GeminiClient, useValue: gemini },
      ],
    });
    return { gemini, ai: TestBed.inject(InsightAi), http: TestBed.inject(HttpTestingController) };
  }

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('uses only Groq when both providers are configured', async () => {
    const { gemini, ai, http } = setup('sample-groq', 'sample-gemini');
    expect(ai.providerName).toBe('Groq');
    const result = ai.generateDailyInsight(input);
    const req = http.expectOne(endpoint);
    expect(req.request.headers.get('Authorization')).toBe('Bearer sample-groq');
    expect(req.request.body.response_format.json_schema.strict).toBeTrue();
    expect(req.request.body.response_format.json_schema.schema.required).toContain('action');
    expect(req.request.body.messages[0].content).toContain('tiếng Việt');
    expect(req.request.body.messages[1].content).toContain('450 kcal');
    req.flush({ choices: [{ message: { content: JSON.stringify(response) } }] });
    expect(await result).toEqual(response);
    expect(gemini.generateContent).not.toHaveBeenCalled();
  });

  it('rejects a blank action without sending data to Gemini', async () => {
    const { gemini, ai, http } = setup('sample-groq', 'sample-gemini');
    const result = ai.generateDailyInsight(input);
    http.expectOne(endpoint).flush({
      choices: [{ message: { content: JSON.stringify({ ...response, action: '  ' }) } }],
    });
    await expectAsync(result).toBeRejectedWithError(DailyInsightError, /không hợp lệ/);
    expect(gemini.generateContent).not.toHaveBeenCalled();
  });

  it('fails locally when neither provider is configured', async () => {
    const { gemini, ai } = setup('', '');
    expect(ai.providerName).toBeNull();
    await expectAsync(ai.generateDailyInsight(input)).toBeRejectedWithError(
      DailyInsightError,
      /cấu hình khóa/,
    );
    expect(gemini.generateContent).not.toHaveBeenCalled();
  });

  for (const [status, message] of [
    [401, /quyền truy cập/],
    [403, /quyền truy cập/],
    [402, /thanh toán/],
    [429, /giới hạn/],
  ] as const) {
    it(`explains Groq HTTP ${status} without switching providers`, async () => {
      const { ai, gemini, http } = setup('sample-groq', 'sample-gemini');
      const result = ai.generateDailyInsight(input);
      http.expectOne(endpoint).flush({}, { status, statusText: 'test' });
      await expectAsync(result).toBeRejectedWithError(DailyInsightError, message);
      expect(gemini.generateContent).not.toHaveBeenCalled();
    });

    it(`explains Gemini HTTP ${status} when only Gemini is configured`, async () => {
      const { ai, gemini } = setup('', 'sample-gemini');
      expect(ai.providerName).toBe('Gemini');
      gemini.generateContent.and.rejectWith(new GeminiError('http_400', 'test', undefined, status));
      await expectAsync(ai.generateDailyInsight(input)).toBeRejectedWithError(
        DailyInsightError,
        message,
      );
    });
  }
});
