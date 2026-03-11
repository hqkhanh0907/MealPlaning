# AI Image Analysis - Test Scenarios Quick Reference

## CRITICAL TEST MATRICES

### INPUT METHOD TESTING (3 paths × 4 scenarios each = 12 tests)

#### Camera Path
- ✓ Start → Capture → Compress → Return (happy path)
- ✓ Start → Permission denied → Show error
- ✓ Start → Switch camera → Capture → Compress
- ✓ Compression fails → Use uncompressed image

#### File Upload Path
- ✓ Select file → Read → Compress → Return
- ✓ Select file → Compression fails → Use uncompressed
- ✓ Multiple uploads → Latest replaces previous
- ✓ File cleared → Previous image removed

#### Clipboard Paste Path
- ✓ Paste image → Read → Compress → Return
- ✓ Paste image → Compression fails → Use uncompressed
- ✓ Paste non-image → Ignored (silent)
- ✓ Multiple pastes → Latest used

---

### IMAGE COMPRESSION TESTING (8 tests)

```typescript
// Test dimensions & aspect ratio preservation
cases: [
  { input: 500x400, maxW: 1024, maxH: 1024, expect: 500x400 (no resize) },
  { input: 2048x1024, maxW: 1024, maxH: 1024, expect: 1024x512 (50% scale) },
  { input: 4096x4096, maxW: 1024, maxH: 1024, expect: 1024x1024 (25% scale) },
  { input: 3000x1500, maxW: 1024, maxH: 1024, expect: 1024x512 (33% scale) },
]

// Test quality settings
qualities: [0.6, 0.8, 0.95]
// Expect: JPEG format with respective quality applied

// Error cases
canvas.getContext() → null // Reject with error
Image.onerror fires // Reject with error
```

---

### GEMINI ANALYSIS TESTING (25+ tests)

#### Happy Paths (4 tests)
```typescript
1. Dish image → AnalyzedDishResult { name, description, totalNutrition, ingredients[] }
2. Field validation:
   - name: string (non-empty)
   - description: string (1-2 sentences)
   - totalNutrition: { calories, protein, fat, carbs } (numbers)
   - ingredients[].nutritionPerStandardUnit: { calories, protein, fat, carbs, fiber }

3. Nutrition calculations verified:
   - Per-ingredient nutrition matches unit type (100g for "g", per 1 for "cái")
   - Total nutrition = sum of (ingredient[i].nutritionPerStandardUnit × amount)

4. Field name correctness: "carbs" (NOT "carbohydrates")
```

#### NotFoodImageError Path (4 tests)
```typescript
1. Non-food image (landscape photo) → throws NotFoodImageError("Đây là ảnh phong cảnh...")
2. Non-food object (phone, shoe) → throws NotFoodImageError("...")
3. Empty image → throws NotFoodImageError
4. NotFoodImageError.reason populated from AI response.notFoodReason
```

#### Validation Tests (6 tests)
```typescript
Missing fields → Validation error (not retry-able):
1. isFood field missing
2. name field missing (when isFood=true)
3. totalNutrition.carbs missing
4. totalNutrition field entirely missing
5. ingredients field missing
6. ingredient[0].nutritionPerStandardUnit.fiber missing
```

#### Resilience Tests (7 tests)
```typescript
Timeout handling:
1. No timeout (<30s) → succeeds
2. Timeout (>30s) → rejects with timeout error
3. Timeout → does NOT retry (won't improve)

Retry behavior:
4. Network 503 error → retries (max 2×)
5. 2nd attempt succeeds → returns result
6. Validation error → does NOT retry
7. AbortError → does NOT retry (user cancelled)
8. API key error → does NOT retry

Abort support:
9. signal.aborted === true at start → throws AbortError immediately
10. signal fires abort during request → throws AbortError
```

#### Prompt Injection (1 test)
```typescript
1. Base64 image data properly encoded in request (no injection)
```

---

### SAVE MODAL TESTING (20+ tests)

#### State & Toggle Tests (6 tests)
```typescript
1. saveDish toggle OFF → dish info fields hidden
2. saveDish toggle ON → dish info fields appear (animate-in)
3. saveDish toggle OFF → tags validation not required
4. saveDish toggle ON → tags validation required
5. Select all ingredients → all checkboxes checked
6. Select all while some selected → deselects all (toggle)
```

#### Field Editing Tests (10 tests)
```typescript
Dish Info (if saveDish=true):
1. Edit name field → editedResult.name updated
2. Edit description field → editedResult.description updated
3. Select breakfast tag → dishTags includes 'breakfast'
4. Select lunch → dishTags includes 'lunch'
5. Select dinner → dishTags includes 'dinner'

Per-Ingredient:
6. Edit ingredient name → ingredients[i].name updated
7. Edit ingredient amount (number) → ingredients[i].amount updated
8. Edit ingredient unit → ingredients[i].unit updated
9. Edit calories/protein/carbs/fat/fiber → nutritionPerStandardUnit.* updated
10. Unselected ingredient → visually grayed, excluded from save payload
```

#### Validation Tests (4 tests)
```typescript
1. saveDish=true + no tags selected → setTagError
2. saveDish=true + tags selected → tagError cleared, allows save
3. saveDish=false → no tag validation, allows save
4. Numeric inputs accept only valid numbers (0 or positive)
```

#### AI Research Tests (3 tests)
```typescript
1. Click "AI Research" → calls suggestIngredientInfo(name, unit)
2. Success → nutrition fields updated for that ingredient
3. Failure → shows error notification, fields unchanged
4. During research → button shows spinner, disabled
```

#### Save Payload Tests (3 tests)
```typescript
1. handleConfirmSave → payload.name = editedResult.name
2. payload.ingredients = filtered by selectedIngredients array
3. payload.shouldCreateDish = saveDish toggle value
4. payload.tags = dishTags (if saveDish=true), undefined (if false)
5. onSave callback invoked with correct payload
6. onClose called after save
```

#### Mobile UX Tests (4 tests)
```typescript
1. Modal height max-h-[85dvh] on mobile
2. Modal height max-h-[90dvh] on sm+ (desktop)
3. Rounded corners: rounded-t-3xl (mobile sheet), rounded-3xl (desktop)
4. Safe area padding applied: pb-safe
5. Input text size: text-base on mobile, text-sm on sm+
6. Ingredient grid: 1 col (mobile), 3 cols (md+)
7. Nutrition grid: 2 cols (mobile), 5 cols (sm+)
```

---

### ANALYSIS RESULT VIEW TESTING (10 tests)

```typescript
1. isAnalyzing=true → shows AnalysisSkeleton (pulse animation)
2. isAnalyzing=false + result=null → shows EmptyState
3. result exists → shows dish name (text-2xl)
4. result exists → shows description
5. Nutrition cards: 4 cards (2×2 grid) with correct colors
   - Calories: orange
   - Protein: blue
   - Carbs: amber
   - Fat: rose
6. Desktop view (hidden sm:) → Table with 6 columns (Name, Qty, Cal, Pro, Carb, Fat)
7. Mobile view (sm:hidden) → Card list with nutrition mini-grid
8. Disclaimer box shown with warning text
9. Save button shown if onOpenSaveModal provided
10. Save button hidden if onOpenSaveModal undefined
11. Click save button → calls onOpenSaveModal()
```

---

### INTEGRATION TESTS (10 tests)

```
User Flow 1: Capture → Analyze → View Results
1. Click camera button
2. Take photo
3. Photo compressed
4. Photo shown in preview
5. Click "Analyze"
6. Results displayed (name, description, nutrition, ingredients)

User Flow 2: Upload → Analyze → Edit → Save
1. Click upload button
2. Select file from device
3. File shown in preview
4. Click "Analyze"
5. Results displayed
6. Click "Save to Library"
7. Modal opens with editable fields
8. Edit some fields
9. Click confirm
10. onSave callback invoked with edited payload

User Flow 3: Paste → Analyze → Can't Save (error case)
1. Paste image from clipboard
2. Image shown in preview
3. Click "Analyze"
4. AI returns isFood=false
5. NotFoodImageError thrown
6. Warning notification shown with reason
7. Clear image
8. Back to empty state

User Flow 4: Start → Permissions Issue
1. Click camera
2. Permission denied
3. Error message shown
4. User clicks close
5. Back to empty state
```

---

### EDGE CASES (15+ tests)

#### Image Handling
```typescript
1. Very large image (10MB) → compressed to <1MB
2. Corrupted file → FileReader error handling
3. Unsupported format (WEBP) → Still processed (browser support)
4. Image with EXIF orientation → Rendered correctly
5. Transparent PNG → Converted to JPEG (opacity handled)
```

#### Ingredient Data
```typescript
6. Zero ingredient amount → Rejected by AI (enforces amount > 0)
7. Very long ingredient name → Truncated gracefully
8. Special characters in ingredient name → Handled/escaped
9. Unknown unit type → Accepted as-is
10. Decimal amount (e.g., 0.5) → Stored as float/rounded
```

#### Modal Behavior
```typescript
11. Close button (X) → closes modal
12. Backdrop click → closes modal (via ModalBackdrop)
13. ESC key → closes modal (via useModalBackHandler)
14. Double-submit protection → second submit ignored
15. Modal unmount during AI research → request cancelled
```

#### Cache & Performance
```typescript
16. suggestIngredientInfo cache hit → no API call
17. Cache case-insensitive lookups → "ức gà" === "Ức gà"
18. Cache TTL expiration → new API call after 1 hour
19. Multiple concurrent AI calls → all resolved correctly
20. Stale closure prevention → latest onAnalysisComplete called
```

---

## MOCK SETUP PATTERNS

### Mocking Gemini API
```typescript
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(() => ({
    models: {
      generateContent: vi.fn(async (req) => ({
        text: JSON.stringify({
          isFood: true,
          name: "Phở",
          description: "Vietnamese noodle soup",
          totalNutrition: { calories: 250, protein: 15, fat: 5, carbs: 30 },
          ingredients: [
            {
              name: "Rice noodles",
              amount: 150,
              unit: "g",
              nutritionPerStandardUnit: { calories: 130, protein: 3, fat: 0, carbs: 28, fiber: 1 }
            }
          ]
        })
      }))
    }
  }))
}));
```

### Mocking Camera
```typescript
const mockGetUserMedia = vi.fn().mockResolvedValue({
  getTracks: () => [{ stop: vi.fn() }]
});

Object.defineProperty(navigator, 'mediaDevices', {
  value: { getUserMedia: mockGetUserMedia },
  writable: true
});
```

### Mocking Image Compression
```typescript
const mockDrawImage = vi.fn();
const mockToDataURL = vi.fn().mockReturnValue('data:image/jpeg;base64,compressed');

document.createElement = vi.fn((tag) => {
  if (tag === 'canvas') {
    return {
      getContext: () => ({ drawImage: mockDrawImage }),
      toDataURL: mockToDataURL,
      width: 1024,
      height: 1024
    };
  }
  return originalCreateElement(tag);
});
```

---

## ASSERTION PATTERNS

### Testing Async Analysis
```typescript
const { getByTestId, waitFor } = render(<AIImageAnalyzer onAnalysisComplete={onComplete} />);

// Wait for result to appear
await waitFor(() => {
  expect(getByTestId('analysis-result-view')).toBeInTheDocument();
});

// Verify callback was called
expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({
  name: "Phở",
  description: expect.any(String),
  totalNutrition: expect.objectContaining({
    calories: expect.any(Number),
    protein: expect.any(Number)
  })
}));
```

### Testing Error Notifications
```typescript
const mockNotify = { warning: vi.fn(), error: vi.fn() };
vi.mocked(useNotification).mockReturnValue(mockNotify);

// Trigger NotFoodImageError
mockAnalyzeDishImage.mockRejectedValueOnce(
  new NotFoodImageError('Đây là ảnh phong cảnh')
);

await waitFor(() => {
  expect(mockNotify.warning).toHaveBeenCalledWith(
    expect.any(String), // i18n key
    'Đây là ảnh phong cảnh'  // error.reason
  );
});
```

### Testing Save Payload
```typescript
const mockOnSave = vi.fn();
const { getByRole, getByTestId } = render(
  <SaveAnalyzedDishModal 
    result={mockResult}
    onSave={mockOnSave}
    onClose={() => {}}
  />
);

// Edit fields
fireEvent.change(getByRole('textbox', { name: /dish name/i }), {
  target: { value: 'Custom Name' }
});

// Select tags
fireEvent.click(getByRole('button', { name: /breakfast/i }));

// Submit
fireEvent.click(getByTestId('btn-confirm-save-analyzed'));

// Verify payload
expect(mockOnSave).toHaveBeenCalledWith(
  expect.objectContaining({
    name: 'Custom Name',
    shouldCreateDish: true,
    tags: ['breakfast'],
    ingredients: expect.arrayContaining([
      expect.objectContaining({ name: expect.any(String) })
    ])
  })
);
```

---

## COVERAGE TARGETS

- **Components**: 90%+ (all user paths)
- **Utils (compression)**: 95%+ (all branches)
- **Services (gemini)**: 85%+ (skip real API calls, mock all)
- **Error Handling**: 100% (every error path tested)
- **Mobile/Responsive**: 100% (both breakpoints)

---

**Total Estimated Test Count: 70-80 tests**
- ImageCapture: 18 tests
- ImageCompression: 8 tests
- GeminiService (analyzeDishImage): 25 tests
- GeminiService (suggestIngredientInfo): 8 tests
- SaveAnalyzedDishModal: 20 tests
- AnalysisResultView: 10 tests
- Integration: 10 tests
- Edge Cases: 15 tests
