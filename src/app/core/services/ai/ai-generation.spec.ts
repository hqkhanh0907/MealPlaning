import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AiGeneration, AiRequestError } from './ai-generation';
import { GeminiClient } from './gemini-client';
import { GEMINI_API_KEY } from './gemini-key';
import { GROQ_API_KEY } from './groq-client';
import { NutritionAi } from './nutrition-ai';
import { foodImageResponseSchema } from './prompts/food-image-analysis.prompt';
import { aiTrainingPlanResponseSchema } from './prompts/training-plan.prompt';

describe('AiGeneration', () => {
  const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

  function setup(
    groqKey: string,
    geminiKey: string,
  ): { ai: AiGeneration; http: HttpTestingController; gemini: jasmine.SpyObj<GeminiClient> } {
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
