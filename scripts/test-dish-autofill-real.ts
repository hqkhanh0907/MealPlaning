/**
 * Real Gemini API smoke test cho dish-autofill prompt rev 1.5.
 *
 * Mục đích: verify prompt mới (KHÔNG có DB hint) trả về đúng cấu trúc
 * Zod schema flat (không còn is_in_db / matched_ingredient_id).
 *
 * Run: GEMINI_API_KEY=xxx npx ts-node scripts/test-dish-autofill-real.ts "Phở bò"
 */
import { z } from 'zod';
import {
  buildDishAutofillPrompt,
  dishAutofillGeminiSchema,
  dishAutofillResponseSchema,
  DISH_AUTOFILL_SYSTEM_INSTRUCTION,
} from '../src/app/core/services/ai/prompts/dish-autofill.prompt';

const API_KEY = process.env['GEMINI_API_KEY'];
const MODEL = process.env['GEMINI_MODEL'] ?? 'gemini-2.5-flash';
const DISH = process.argv[2] ?? 'Phở bò';

if (!API_KEY) {
  console.error('❌ GEMINI_API_KEY not set');
  process.exit(1);
}

async function main() {
  const prompt = buildDishAutofillPrompt(DISH);
  console.log('━'.repeat(70));
  console.log(`Dish: "${DISH}"`);
  console.log(`Model: ${MODEL}`);
  console.log(`Prompt size: ${prompt.length} chars`);
  console.log('━'.repeat(70));
  console.log('PROMPT (rendered):');
  console.log(prompt);
  console.log('━'.repeat(70));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const body = {
    systemInstruction: { parts: [{ text: DISH_AUTOFILL_SYSTEM_INSTRUCTION }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: dishAutofillGeminiSchema,
      temperature: 0.2,
    },
  };

  const t0 = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const ms = Date.now() - t0;

  if (!res.ok) {
    console.error(`❌ HTTP ${res.status} in ${ms}ms`);
    console.error(await res.text());
    process.exit(2);
  }

  const json = await res.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  };

  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  console.log(`✓ Gemini OK in ${ms}ms`);
  console.log(`Tokens: prompt=${json.usageMetadata?.promptTokenCount} out=${json.usageMetadata?.candidatesTokenCount}`);
  console.log('━'.repeat(70));
  console.log('RAW RESPONSE TEXT:');
  console.log(text);
  console.log('━'.repeat(70));

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(text);
  } catch (e) {
    console.error('❌ Response is not valid JSON');
    process.exit(3);
  }

  const result = dishAutofillResponseSchema.safeParse(parsedJson);
  if (!result.success) {
    console.error('❌ Zod validation FAILED');
    console.error(z.prettifyError(result.error));
    process.exit(4);
  }

  console.log(`✓ Zod schema PASSED — ${result.data.ingredients.length} ingredients`);
  console.log('━'.repeat(70));
  console.log('VALIDATED ROWS:');
  result.data.ingredients.forEach((r, i) => {
    console.log(
      `  ${i + 1}. ${r.name.padEnd(20)} ${String(r.gram_weight).padStart(5)}g  ` +
        `[${r.category}]  ${r.calories_per_100g}kcal/100g  conf=${r.confidence}`,
    );
  });
  console.log('━'.repeat(70));

  // Sanity check: bảo đảm response KHÔNG có field cũ
  const sample = result.data.ingredients[0] as Record<string, unknown> | undefined;
  if (sample) {
    const legacyFields = ['is_in_db', 'matched_ingredient_id'];
    const found = legacyFields.filter((f) => f in sample);
    if (found.length > 0) {
      console.error(`❌ Legacy fields leaked: ${found.join(', ')}`);
      process.exit(5);
    }
    console.log('✓ No legacy fields (is_in_db / matched_ingredient_id)');
  }

  console.log('━'.repeat(70));
  console.log('✅ ALL CHECKS PASSED');
}

main().catch((e) => {
  console.error('💥', e);
  process.exit(99);
});
