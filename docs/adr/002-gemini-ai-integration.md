# ADR 002: Gemini AI Integration for Nutrition Analysis

## Status
Accepted

## Date
2025-01-01

## Context
The app needs AI capabilities for:
1. Analyzing food images → extracting dish name, ingredients, and nutritional data.
2. Suggesting daily meal plans based on calorie/protein targets.
3. Looking up ingredient nutritional information via web search.

Options considered:
1. **OpenAI GPT-4 Vision** — mature, expensive, no built-in search.
2. **Google Gemini** — competitive pricing, multimodal (vision), built-in Google Search tool, structured JSON output.
3. **Self-hosted model** — full control, high infrastructure cost, lower accuracy.

## Decision
Use **Google Gemini API** (`gemini-3-flash-preview` model) via `@google/genai` SDK.

## Rationale
- **Multimodal**: Handles both text prompts and image analysis in one API.
- **Structured output**: Native `responseMimeType: "application/json"` + `responseSchema` ensures type-safe responses validated by runtime type guards.
- **Google Search tool**: `suggestIngredientInfo` uses `googleSearch` tool for real-time nutritional data lookup.
- **Cost-effective**: Flash model provides good quality at lower cost for a personal app.
- **Thinking mode**: `ThinkingLevel.HIGH` for meal plan suggestions improves reasoning quality.

## Trade-offs
- API key is bundled client-side (see security note — should be proxied in production).
- Vendor lock-in to Google AI platform.
- Model availability may change (using preview model).

## Consequences
- All AI calls centralized in `src/services/geminiService.ts`.
- Shared `callWithTimeout` utility provides consistent timeout (30s) across all 3 API endpoints.
- Runtime type guards (`isMealPlanSuggestion`, `isAnalyzedDishResult`, `isIngredientSuggestion`) validate every AI response.
- `useAISuggestion` hook manages suggestion lifecycle in the UI layer.
