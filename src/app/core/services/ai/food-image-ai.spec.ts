import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { AiRequestError } from './ai-generation';
import { GROQ_API_KEY } from './groq-client';
import { FoodImageAi } from './food-image-ai';
import type { FoodImageResponse } from './prompts/food-image-analysis.prompt';

describe('FoodImageAi', () => {
  const endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  const image = { data: 'dGVzdA==', mimeType: 'image/png' } as const;
  const payload: FoodImageResponse = {
    overall_confidence: 'medium',
    image_quality_warning: null,
    items: [
      {
        name: 'Cơm',
        estimated_grams: 150,
        calories: 190,
        protein: 4,
        carbs: 39,
        fat: 2,
        fiber: 1,
        confidence: 'medium',
        warning: null,
      },
    ],
  };

  function setup(key = 'test-only'): {
    http: HttpTestingController;
    result: ReturnType<FoodImageAi['analyzeMealPhoto']>;
  } {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GROQ_API_KEY, useValue: key },
      ],
    });
    return {
      http: TestBed.inject(HttpTestingController),
      result: TestBed.inject(FoodImageAi).analyzeMealPhoto(image, 'bữa trưa'),
    };
  }

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('sends the local image with a Vietnamese JSON prompt', async () => {
    const { result, http } = setup();
    const req = http.expectOne(endpoint);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-only');
    expect(req.request.body.model).toBe('qwen/qwen3.8-27b');
    const format = req.request.body.response_format;
    expect(format.type).toBe('json_schema');
    expect(format.json_schema.strict).toBeTrue();
    const schema = format.json_schema.schema;
    expect(schema.required).toEqual(
      jasmine.arrayContaining(['overall_confidence', 'image_quality_warning', 'items']),
    );
    expect(schema.properties.items.items.required).toContain('fiber');
    expect(schema.properties.items.items.additionalProperties).toBeFalse();
    const [prompt, photo] = req.request.body.messages[0].content;
    expect(prompt.text).toContain('bữa trưa');
    expect(photo.image_url.url).toBe('data:image/png;base64,dGVzdA==');
    req.flush({ choices: [{ message: { content: JSON.stringify(payload) } }] });
    expect(await result).toEqual(
      jasmine.objectContaining({ items: [jasmine.objectContaining({ name: 'Cơm' })] }),
    );
  });

  it('reports an absent key before contacting Groq', async () => {
    const { result, http } = setup('');
    http.expectNone(endpoint);
    await expectAsync(result).toBeRejectedWithError(AiRequestError, /chưa có khóa/);
  });

  it('retains long image and portion warnings from a valid analysis', async () => {
    const warning = 'Khó ước lượng khối lượng từ góc chụp này. '.repeat(6).trim();
    const data = {
      ...payload,
      image_quality_warning: warning,
      items: [{ ...payload.items[0], warning }],
    };
    const { result, http } = setup();
    http.expectOne(endpoint).flush({ choices: [{ message: { content: JSON.stringify(data) } }] });
    const analysis = await result;
    expect(analysis.imageQualityWarning).toBe(warning);
    expect(analysis.items[0].warning).toBe(warning);
  });

  for (const [status, expected] of [
    [401, /từ chối khóa/],
    [429, /giới hạn/],
    [500, /thử lại sau/],
  ] as const) {
    it(`translates HTTP ${status}`, async () => {
      const { result, http } = setup();
      http.expectOne(endpoint).flush({}, { status, statusText: 'Failure' });
      await expectAsync(result).toBeRejectedWithError(AiRequestError, expected);
    });
  }

  it('reports a network failure', async () => {
    const { result, http } = setup();
    http.expectOne(endpoint).error(new ProgressEvent('error'));
    await expectAsync(result).toBeRejectedWithError(AiRequestError, /kiểm tra mạng/);
  });

  it('aborts a request after sixty seconds', fakeAsync(() => {
    const { result, http } = setup();
    const req = http.expectOne(endpoint);
    let message = '';
    void result.catch((error: Error) => (message = error.message));
    tick(60_000);
    expect(message).toContain('quá nhiều thời gian');
    expect(req.cancelled).toBeTrue();
  }));

  for (const content of [
    null,
    '{',
    '{}',
    JSON.stringify({ ...payload, items: [{ ...payload.items[0], name: '  ' }] }),
  ]) {
    it(`rejects malformed analysis content ${content}`, async () => {
      const { result, http } = setup();
      http.expectOne(endpoint).flush({ choices: [{ message: { content } }] });
      await expectAsync(result).toBeRejectedWithError(AiRequestError, /không hợp lệ/);
    });
  }

  it('asks for a different photo when no food is visible', async () => {
    const { result, http } = setup();
    http
      .expectOne(endpoint)
      .flush({ choices: [{ message: { content: JSON.stringify({ ...payload, items: [] }) } }] });
    await expectAsync(result).toBeRejectedWithError(AiRequestError, /thử ảnh khác/);
  });
});
