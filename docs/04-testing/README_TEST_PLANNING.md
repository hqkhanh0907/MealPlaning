# AI Image Analysis Feature - Complete Test Planning Documentation

## 📋 Documentation Files Generated

This analysis includes 4 comprehensive documents designed to guide your 50+ test case implementation:

### 1. **AI_IMAGE_ANALYSIS_GUIDE.md** (945 lines)

**Complete technical specification covering:**

- All 6 component/service file paths
- Detailed state management for each component
- Image compression settings (1024×1024 max, 0.8 quality)
- 3 input methods with complete flow diagrams
- Data structures (AnalyzedDishResult, AnalyzedIngredient, etc.)
- Error handling strategy for each input type
- NotFoodImageError usage and handling
- Mobile UI considerations (responsive grids, safe area, sheet modals)
- 50+ specific test case categories

### 2. **TEST_SCENARIOS_QUICK_REFERENCE.md** (530+ lines)

**Quick-lookup test matrices including:**

- 12 input method tests (4 per input type)
- 8 image compression tests
- 25+ Gemini service analysis tests
- 20+ SaveAnalyzedDishModal tests
- 10+ AnalysisResultView tests
- 15+ edge case tests
- Mock setup patterns for all external dependencies
- Assertion patterns for async operations

### 3. **TEST_CODE_SNIPPETS.md** (1031 lines)

**Ready-to-use test implementations:**

- Component test skeleton with mocks
- Camera functionality tests
- File upload tests
- Clipboard paste tests
- Image compression tests
- Gemini service tests (including retry logic)
- SaveAnalyzedDishModal tests
- Integration test (full user workflow)

### 4. **README_TEST_PLANNING.md** (this file)

**Overview and navigation guide**

---

## 🎯 Key Metrics

| Metric                         | Value       |
| ------------------------------ | ----------- |
| **Total Estimated Test Cases** | 70-80 tests |
| **Component Test Coverage**    | 90%+        |
| **Utility Coverage**           | 95%+        |
| **Service Coverage**           | 85%+        |
| **Error Path Coverage**        | 100%        |
| **Mobile Breakpoint Tests**    | 100%        |

---

## 📁 Component Breakdown

### Core Components

```
✓ AIImageAnalyzer.tsx (2 props, 4 state, 3 handlers)
  └─ Props: onAnalysisComplete, onSave
  └─ State: image, isAnalyzing, result, isSaveModalOpen
  └─ Main analysis orchestration

✓ ImageCapture.tsx (3 props, 4 state, 5 refs)
  └─ Input Methods: Camera (with environment/user modes, switch)
  └─ Input Methods: File Upload
  └─ Input Methods: Clipboard Paste
  └─ All with fallback compression behavior

✓ AnalysisResultView.tsx (3 props, 3 view states)
  └─ Responsive: Table (desktop) / Cards (mobile)
  └─ Nutrition display with color coding
  └─ Disclaimer & Save button

✓ SaveAnalyzedDishModal.tsx (3 props, 6 state hooks)
  └─ Full CRUD for analyzed dish
  └─ Ingredient selection & nutrition editing
  └─ AI Research lookup per ingredient
  └─ Meal type tagging with validation
  └─ Mobile sheet modal (rounded-t-3xl)
```

### Utilities & Services

```
✓ imageCompression.ts (1 function, 4 parameters)
  └─ Max: 1024×1024px, Quality: 0.8
  └─ Aspect ratio preserved
  └─ Output: JPEG format

✓ geminiService.ts (analyzeDishImage function)
  └─ 30-second timeout per call
  └─ 2 retries with exponential backoff
  └─ Abort signal support
  └─ NotFoodImageError on non-food
  └─ Structured JSON response with strict validation
```

---

## 🔄 Data Flow Summary

```
┌─ IMAGE INPUT ─────────────────────────────┐
│ Camera (rear/front) │ Upload │ Paste      │
└────────┬────────────────────────────────┬─┘
         │ compressImage(maxW=1024, maxH=1024, q=0.8)
         ▼
    ┌─ Base64 with MIME Type ─┐
    │ data:image/jpeg;base64... │
    └────────┬──────────────────┘
             │
             ▼
    ┌─ analyzeImageDish() ─┐
    │ Gemini 2.5 Flash API │ (30s timeout, retry×2)
    └────────┬─────────────┘
             │
    ┌────────┴─────────────────────────────────────┐
    ▼                                              ▼
 FOOD ──────────────────────          NOT FOOD ─────────────
 AnalyzedDishResult {               NotFoodImageError
   name: "Phở"                       reason: "..."
   description: "..."
   totalNutrition: {...}    Display Error
   ingredients: [{         Notification
     name, amount, unit,     "ai.notFoodTitle"
     nutritionPerUnit: {...}
   }]
 }
    │
    ▼
 AnalysisResultView (display)
    │
    ▼
 SaveAnalyzedDishModal (edit + save)
    │
    ├─ editedResult: deep clone
    ├─ selectedIngredients: boolean[]
    ├─ dishTags: MealType[]
    ├─ saveDish: boolean
    └─ suggestIngredientInfo() [per ingredient]
       (Cache: 1hr, case-insensitive key)
    │
    ▼
 SaveAnalyzedDishPayload
 {
   name, description, ingredients,
   shouldCreateDish, tags
 }
    │
    ▼
 onSave() callback
```

---

## 🧪 Test Case Organization

### By Component

- **ImageCapture**: 18 tests (camera, upload, paste + error paths)
- **AIImageAnalyzer**: 8 tests (orchestration, callbacks, error handling)
- **AnalysisResultView**: 10 tests (all view states, responsive UI)
- **SaveAnalyzedDishModal**: 20+ tests (editing, validation, save flow)

### By Service/Utility

- **imageCompression**: 8 tests (dimension handling, quality, errors)
- **analyzeDishImage**: 25+ tests (happy path, errors, resilience)
- **suggestIngredientInfo**: 8 tests (cache, lookups, cleanup)

### By Concern

- **Input Validation**: 10+ tests
- **Error Handling**: 15+ tests
- **Mobile Responsiveness**: 8+ tests
- **Integration/E2E**: 10+ tests
- **Edge Cases**: 15+ tests

---

## 🚀 Quick Start for Test Implementation

### Phase 1: Setup (utilities tested first)

1. Image compression tests (8) - no dependencies
2. Create mock factories for Gemini API
3. Create mock factories for navigator.mediaDevices

### Phase 2: Service Tests

4. analyzeDishImage tests (25+) - uses Gemini mock
5. suggestIngredientInfo tests (8) - uses cache, Gemini mock

### Phase 3: Component Tests

6. ImageCapture tests (18) - uses compression, navigator mocks
7. AIImageAnalyzer tests (8) - uses service mocks, notification mock
8. AnalysisResultView tests (10) - pure component tests
9. SaveAnalyzedDishModal tests (20+) - uses service mocks

### Phase 4: Integration & Edge Cases

10. Full workflow integration (3-5 tests)
11. Error scenarios (10+ tests)
12. Mobile-specific tests (8+ tests)

---

## 🔑 Key Testing Patterns

### Pattern 1: Async Compression with Fallback

```typescript
// All three input methods follow this pattern:
try {
  const compressed = await compressImage(dataUrl);
  onImageReady(compressed);
} catch {
  onImageReady(dataUrl); // Fallback to uncompressed
}
```

**Test**: Success path AND failure/fallback path

### Pattern 2: Retry with Exponential Backoff

```typescript
// analyzeDishImage internally:
MAX_RETRIES = 2
Delays: 1s, then 2s
Non-retryable: validation, timeout, AbortError, API key error
```

**Test**: Success on retry, no retry on non-retryable errors

### Pattern 3: Cache with TTL

```typescript
// suggestIngredientInfo cache:
Key: "${name.toLowerCase()}::${unit.toLowerCase()}"
TTL: 1 hour (3,600,000 ms)
```

**Test**: Cache hit, cache miss after TTL, case-insensitive matching

### Pattern 4: Stale Closure Prevention

```typescript
// AIImageAnalyzer:
const onAnalysisCompleteRef = useRef(onAnalysisComplete);
useEffect(() => {
  onAnalysisCompleteRef.current = onAnalysisComplete;
}, [onAnalysisComplete]);
```

**Test**: Rapid prop changes during async operation

### Pattern 5: Modal Input State (Mobile UX)

```typescript
// SaveAnalyzedDishModal:
const [numericStrings, setNumericStrings] = useState<Record<string, string>>();
// Allows clearing without snap-back on mobile
```

**Test**: Type, clear, type again without input losing focus

---

## 📊 Test Dependencies & Mocks

### External Dependencies to Mock

```typescript
// 1. Google Gemini API
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(...)
}))

// 2. Browser APIs
navigator.mediaDevices.getUserMedia
document.createElement('canvas')
canvas.getContext('2d')
Image constructor
FileReader API

// 3. React Context
useNotification() → { warning, error, success }
useTranslation() → { t }

// 4. Internal Services
import * as geminiService from '../services/geminiService'
vi.mock('../services/geminiService')
```

### Utilities That Can Be Tested Directly

```typescript
// No external dependencies:
compressImage() - uses Image, Canvas (mockable)
parseJSON() - pure function
sanitizeForPrompt() - pure function
isRetryableError() - pure function
```

---

## 📱 Mobile Testing Checklist

### Responsive Classes to Test

- ✓ `hidden sm:inline` (paste hint)
- ✓ `rounded-t-3xl sm:rounded-3xl` (modal corners)
- ✓ `max-h-[85dvh] sm:max-h-[90dvh]` (modal height)
- ✓ `pb-safe` (notch padding)
- ✓ `text-base sm:text-sm` (input text size)
- ✓ `grid-cols-1 md:grid-cols-3` (ingredient fields)
- ✓ `grid-cols-2 sm:grid-cols-5` (nutrition values)

### Mobile User Interactions

- ✓ Camera overlay: fullscreen (inset-0 z-50)
- ✓ Video: autoPlay playsInline
- ✓ Buttons: min-h-11 / min-h-12 (touch-friendly)
- ✓ Number inputs: inputMode="numeric"
- ✓ Modal backdrop dismiss (click outside)

### Mobile Error Handling

- ✓ Camera not supported: Show message, allow close
- ✓ Permission denied: Show message, allow retry
- ✓ Paste hint only on sm+ (hidden on mobile)

---

## ✅ Validation Checklist for Test Suite

Before finalizing your tests, verify:

- [ ] All 3 input methods tested (camera, upload, paste)
- [ ] Camera front/rear switching tested
- [ ] Image compression tested at all dimension ratios
- [ ] NotFoodImageError thrown and caught correctly
- [ ] Retry logic verified (success + no retry on validation)
- [ ] Cache tested (TTL, case-insensitive)
- [ ] Stale closure prevention verified
- [ ] Double-submit protection tested
- [ ] Ingredient selection/filtering tested
- [ ] Meal tag validation tested
- [ ] AI Research (suggestIngredientInfo) tested
- [ ] All error notifications tested
- [ ] Mobile breakpoints tested (sm: md:)
- [ ] Safe area padding tested (pb-safe)
- [ ] Touch-friendly button sizes tested
- [ ] Modal dismiss tested (close button, backdrop, ESC)
- [ ] Numeric string state tested (mobile input UX)
- [ ] Abort signal support tested
- [ ] Timeout handling tested
- [ ] Field name correctness verified ("carbs" not "carbohydrates")

---

## 📚 Document Navigation

**For detailed implementation**: See `TEST_CODE_SNIPPETS.md`

**For quick reference**: See `TEST_SCENARIOS_QUICK_REFERENCE.md`

**For complete spec**: See `AI_IMAGE_ANALYSIS_GUIDE.md`

**For this overview**: You're reading it! 📖

---

## 🎓 Learning Path

1. **Understand the data flow**: Read the "Data Flow Summary" above
2. **Review component responsibilities**: Check "Component Breakdown"
3. **Study the code**: Review actual files in `/src/components` and `/src/services`
4. **Pick a component**: Start with ImageCapture (simplest)
5. **Write tests**: Use TEST_CODE_SNIPPETS.md as template
6. **Move through**: CompressImage → Service → Modal → Integration
7. **Verify coverage**: Run with --coverage flag

---

**Total Documentation**: ~2,400 lines across 4 files
**Code Snippets**: 8 complete test file templates
**Ready-to-use**: Copy/paste most snippets directly into your test files

Good luck! 🚀
