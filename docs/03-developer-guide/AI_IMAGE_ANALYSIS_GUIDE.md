# AI Image Analysis Feature - Comprehensive Analysis

## 1. FILE PATHS

| Component         | Path                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| Main Analyzer     | `/Users/khanhhuynh/person_project/MealPlaning/src/components/AIImageAnalyzer.tsx`              |
| Image Capture     | `/Users/khanhhuynh/person_project/MealPlaning/src/components/ImageCapture.tsx`                 |
| Analysis Results  | `/Users/khanhhuynh/person_project/MealPlaning/src/components/AnalysisResultView.tsx`           |
| Save Modal        | `/Users/khanhhuynh/person_project/MealPlaning/src/components/modals/SaveAnalyzedDishModal.tsx` |
| Compression Utils | `/Users/khanhhuynh/person_project/MealPlaning/src/utils/imageCompression.ts`                   |
| Gemini Service    | `/Users/khanhhuynh/person_project/MealPlaning/src/services/geminiService.ts`                   |

---

## 2. AIIMAGEANALYZER.TSX (Main Orchestrator)

### Props

```typescript
interface AIImageAnalyzerProps {
  onAnalysisComplete: (result: AnalyzedDishResult) => void;
  onSave?: (result: SaveAnalyzedDishPayload) => void;
}
```

### State Management

```typescript
const [image, setImage] = useState<string | null>(null); // Base64 image
const [isAnalyzing, setIsAnalyzing] = useState(false); // Loading flag
const [result, setResult] = useState<AnalyzedDishResult | null>(null); // Analysis result
const [isSaveModalOpen, setIsSaveModalOpen] = useState(false); // Modal visibility
const onAnalysisCompleteRef = useRef(onAnalysisComplete); // Stale closure prevention
```

### Key Functions

#### handleImageReady(base64: string)

- **Purpose**: Called when image is captured/uploaded/pasted
- **Behavior**: Clears previous analysis result, sets new image
- **Called From**: ImageCapture component via onImageReady prop

#### handleClearImage()

- **Purpose**: Resets image and result state
- **Called From**: ImageCapture clear button

#### handleAnalyze()

- **Purpose**: Main analysis flow
- **Steps**:
  1. Extract MIME type from data URL header (e.g., "image/jpeg")
  2. Call `analyzeDishImage(base64Data, mimeType)` from geminiService
  3. Set result state and call onAnalysisCompleteRef.current(analysis)
  4. **Error Handling**:
     - If `NotFoodImageError` instance: show warning with error.reason
     - Otherwise: show generic "Analysis failed" error
  5. Set isAnalyzing to false in finally block

### UI Structure

- **3-Step Progress Indicator**: Numbered badges (1=Capture, 2=Analyze, 3=Save)
- **Two-Column Layout** (responsive):
  - Left: ImageCapture component + Analyze button
  - Right: AnalysisResultView component

### Data Flow

```
ImageCapture → onImageReady() → [user clicks Analyze]
→ handleAnalyze() → analyzeDishImage() → setResult()
→ AnalysisResultView displays → SaveAnalyzedDishModal (if onSave provided)
```

---

## 3. IMAGECAPTURE.TSX (Input Handler)

### Props

```typescript
interface ImageCaptureProps {
  image: string | null; // Current base64 image
  onImageReady: (base64: string) => void; // Called with compressed image
  onClear: () => void; // Called when user clears image
}
```

### State

```typescript
const [isCameraOpen, setIsCameraOpen] = useState(false);
const [cameraError, setCameraError] = useState<string | null>(null);
const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
const fileInputRef = useRef<HTMLInputElement>(null);
const videoRef = useRef<HTMLVideoElement>(null);
const canvasRef = useRef<HTMLCanvasElement>(null);
const streamRef = useRef<MediaStream | null>(null);
```

### Three Input Methods

#### 1. Camera Capture (Navigator.mediaDevices.getUserMedia)

**startCamera(mode?: 'environment' | 'user')**

- Requests camera permission for specified facing mode
- Sets `isCameraOpen = true` and streams video to videoRef
- **Error Handling**:
  - No camera support: Shows "noCameraSupport" error message
  - Permission denied: Shows "cameraAccessDenied" error
  - Streams stored in streamRef for cleanup

**capturePhoto()**

- Draws video frame to canvas at video's native dimensions
- Calls `compressImage(dataUrl)` on canvas output
- Stops camera stream
- Calls `onImageReady()` with compressed image (or original if compression fails)

**switchCamera()**

- Toggles between 'environment' (rear) and 'user' (front)
- Stops old stream, starts new stream with new facing mode
- Handles errors same as startCamera

**stopCamera()**

- Stops all MediaStream tracks
- Clears video element source
- Resets camera UI state

**Mobile-Specific**:

- Full-screen overlay: `fixed inset-0 z-50 bg-black`
- Video: `autoPlay playsInline` for mobile compatibility
- Buttons positioned at bottom with gap

#### 2. File Upload

**handleImageUpload(e: React.ChangeEvent<HTMLInputElement>)**

- Reads file via FileReader.readAsDataURL
- Calls `compressImage()` on file data
- Calls `onImageReady()` with result (or original if compression fails)
- Silent failure: If compression fails, uses original uncompressed image

**Triggering**:

- Click upload button → `fileInputRef.current?.click()`
- Hidden input: `<input type="file" accept="image/*" />`

#### 3. Clipboard Paste (Ctrl+V / Cmd+V)

**handlePaste (global event listener)**

- Listens for paste events: `globalThis.addEventListener('paste', handlePaste)`
- Extracts first image item from clipboard
- Reads blob via FileReader.readAsDataURL
- Compression attempted, falls back to original if fails
- **Setup**: useEffect with cleanup on unmount

**Mobile Consideration**: Paste hint text hidden on small screens: `hidden sm:inline`

### Image Compression Flow

```
User Input → FileReader/Canvas → compressImage()
→ onImageReady(compressedBase64) → AIImageAnalyzer
```

### UI States

1. **No Image**: Shows 3 input options (camera button, upload button, paste hint)
2. **Camera Open**: Full-screen video with capture/switch/close buttons
3. **Image Selected**: Shows preview with "Choose Another" button
4. **Camera Error**: Shows error message with close button

---

## 4. IMAGECOMPRESSION.TS (Utility)

### Function Signature

```typescript
export const compressImage = (
  dataUrl: string,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.8
): Promise<string>
```

### Compression Settings

| Setting       | Default   | Purpose                                    |
| ------------- | --------- | ------------------------------------------ |
| maxWidth      | 1024 px   | Max output width (maintains aspect ratio)  |
| maxHeight     | 1024 px   | Max output height (maintains aspect ratio) |
| quality       | 0.8 (80%) | JPEG quality setting                       |
| Output Format | JPEG      | `canvas.toDataURL('image/jpeg', quality)`  |

### Algorithm

1. Create Image from data URL
2. On image load:
   - If width > maxWidth OR height > maxHeight:
     - Calculate ratio: `min(maxWidth/width, maxHeight/height)`
     - Scale dimensions: `width *= ratio, height *= ratio`
   - Create canvas with scaled dimensions
   - Draw image to canvas at new size
   - Convert canvas to JPEG with specified quality
3. **Error Handling**:
   - Image load error: Rejects with "Failed to load image for compression"
   - Canvas context error: Rejects with "Failed to get canvas context"

### Caller's Error Handling

All callers (camera, upload, paste) follow pattern:

```typescript
try {
  const compressed = await compressImage(dataUrl);
  onImageReady(compressed);
} catch {
  onImageReady(dataUrl); // Fall back to uncompressed
}
```

---

## 5. GEMINISERV ICE.TS (analyzeDishImage Function)

### Function Signature

```typescript
export async function analyzeDishImage(
  base64Image: string, // No "data:" prefix
  mimeType: string, // e.g., "image/jpeg", "image/png"
  signal?: AbortSignal, // Optional cancellation
): Promise<AnalyzedDishResult>;
```

### Resilience Features

| Feature           | Details                                                               |
| ----------------- | --------------------------------------------------------------------- |
| **Timeout**       | 30 seconds per call (AI_CALL_TIMEOUT_MS)                              |
| **Retries**       | Max 2 retries with exponential backoff (1s, 2s)                       |
| **Abort Support** | Rejects with DOMException('Aborted', 'AbortError') if signal.aborted  |
| **Retry Logic**   | Skips retry on timeout, AbortError, validation errors, API key errors |

### Gemini AI Configuration

```typescript
{
  model: "gemini-2.5-flash",
  contents: {
    parts: [
      { inlineData: { data: base64Image, mimeType } },
      { text: prompt }
    ]
  },
  config: {
    responseMimeType: "application/json",
    responseSchema: { /* see below */ }
  }
}
```

### Response Schema (AnalyzedDishResult)

```typescript
type AnalyzedDishResult = {
  isFood: boolean;
  notFoodReason?: string; // Populated when isFood = false
  name: string; // Dish name (empty if not food)
  description: string; // 1-2 sentence description
  totalNutrition: {
    calories: number; // kcal for entire dish
    protein: number; // grams
    fat: number; // grams
    carbs: number; // grams (NOT "carbohydrates")
  };
  ingredients: AnalyzedIngredient[];
};
```

### AnalyzedIngredient Structure

```typescript
type AnalyzedIngredient = {
  name: string; // e.g., "Ức gà", "Saffron"
  amount: number; // Quantity in dish (never 0)
  unit: string; // e.g., "g", "ml", "cái", "quả"
  nutritionPerStandardUnit: {
    calories: number; // Per 100g/100ml (if g/kg/ml/l) OR per 1 unit
    protein: number; // grams
    fat: number; // grams
    carbs: number; // grams
    fiber: number; // grams
  };
};
```

### NotFoodImageError Handling

```typescript
if (!result.isFood) {
  throw new NotFoodImageError(result.notFoodReason ?? 'Không phải món ăn');
}
```

**NotFoodImageError Class**:

```typescript
export class NotFoodImageError extends Error {
  constructor(public readonly reason: string) {
    super(`Not a food image: ${reason}`);
    this.name = 'NotFoodImageError';
  }
}
```

### Prompt Instructions (Simplified)

**Step 1 - Food Check**:

- If NOT food/drink/ingredient → isFood = false, set notFoodReason, return

**Step 2 - Identification**:

- Dish name, description, total nutrition

**Step 3 - Ingredient Analysis**:

- Per-ingredient breakdown with amounts and units
- Nutrition per 100g/100ml OR per 1 unit depending on unit type

---

## 6. ANALYSISRESULTVIEW.TSX (Display Component)

### Props

```typescript
interface AnalysisResultViewProps {
  result: AnalyzedDishResult | null;
  isAnalyzing: boolean; // Shows skeleton loading
  onOpenSaveModal?: () => void; // Called when save button clicked
}
```

### States & Views

#### 1. Analyzing State

- Shows AnalysisSkeleton component
- Animated pulse effect on placeholder elements
- Shows 3 skeleton ingredient rows
- Loading spinner with "Loading analysis..." message

#### 2. Empty State

- Shows when result is null AND not analyzing
- Large icon with title and hint text

#### 3. Results View

When result exists:

**Dish Info Section**:

- Title: `result.name` (text-2xl, bold)
- Description: `result.description` (multi-line text)

**Nutrition Summary** (4 cards, 2x2 grid):

- Calories (orange): `result.totalNutrition.calories` kcal
- Protein (blue): `result.totalNutrition.protein` g
- Carbs (amber): `result.totalNutrition.carbs` g
- Fat (rose): `result.totalNutrition.fat` g

**Ingredients** (Responsive Display):

**Desktop** (hidden sm:):

- Table with columns: Name | Qty | Calories | Protein | Carbs | Fat
- Rows map: `result.ingredients.map(ing => <IngredientRow ing={ing} />)`
- Each row calculates nutrition via `calculateIngredientNutrition(toTempIngredient(ing), ing.amount)`

**Mobile** (sm:hidden):

- Card list with grid showing nutrition values
- Cards: 4-column grid (Calories, Protein, Carbs, Fat)

**Disclaimer Box**:

- Warning box (indigo background)
- "These are estimates. Verify with official sources."

**Save Button** (if onOpenSaveModal provided):

- Full-width button: "Save to Library"
- Calls onOpenSaveModal() on click
- Only visible if onSave prop exists in parent

---

## 7. SAVEANALYZEDDISHMODAL.TSX (Editing & Persistence)

### Props

```typescript
interface SaveAnalyzedDishModalProps {
  onClose: () => void;
  result: AnalyzedDishResult;
  onSave: (payload: SaveAnalyzedDishPayload) => void;
}
```

### State Management

#### Core State

```typescript
const [editedResult, setEditedResult] = useState<AnalyzedDishResult>(() => structuredClone(result));
const [saveDish, setSaveDish] = useState(true); // "Save as Dish" toggle
const [dishTags, setDishTags] = useState<MealType[]>([]); // breakfast/lunch/dinner
const [tagError, setTagError] = useState<string | null>(null);
const [selectedIngredients, setSelectedIngredients] = useState<boolean[]>(() =>
  new Array(result.ingredients.length).fill(true),
);
const [researchingIngredientIndex, setResearchingIngredientIndex] = useState<number | null>(null);
```

#### Numeric String State (Mobile Optimization)

```typescript
const [numericStrings, setNumericStrings] = useState<Record<string, string>>(() => {
  const entries: Record<string, string> = {};
  result.ingredients.forEach((ing, idx) => {
    entries[`${idx}-amount`] = String(ing.amount);
    entries[`${idx}-calories`] = String(ing.nutritionPerStandardUnit.calories);
    entries[`${idx}-protein`] = String(ing.nutritionPerStandardUnit.protein);
    entries[`${idx}-carbs`] = String(ing.nutritionPerStandardUnit.carbs);
    entries[`${idx}-fat`] = String(ing.nutritionPerStandardUnit.fat);
    entries[`${idx}-fiber`] = String(ing.nutritionPerStandardUnit.fiber);
  });
  return entries;
});
```

**Why numericStrings?** Mobile users can clear input fields without snap-back. String state preserves typing experience.

### Key Functions

#### toggleDishTag(type: MealType)

- Adds/removes tag from dishTags array
- Clears tagError on change

#### handleUpdateIngredient(index: number, field: string, value: string | number)

- Supports nested fields via dot notation: `"nutritionPerStandardUnit.calories"`
- Creates new ingredient object with updated value
- Updates editedResult.ingredients array

#### handleResearchIngredient(index: number)

- Calls `suggestIngredientInfo(ingredient.name, ingredient.unit)`
- On success: Updates nutrition values for that ingredient
- On error: Shows notification "Lookup failed"
- Sets researchingIngredientIndex during loading

#### toggleIngredientSelection(index: number)

- Toggles selectedIngredients[index] boolean
- Controls which ingredients are saved

#### toggleAllIngredients()

- If all selected: deselect all
- If any unselected: select all

#### handleConfirmSave()

- **Validation**: If saveDish && dishTags.length === 0 → setTagError
- **Prevention**: Uses hasSubmittedRef to prevent double-submit
- **Filtering**: Filters ingredients by selectedIngredients boolean array
- **Payload Construction**:
  ```typescript
  const payload: SaveAnalyzedDishPayload = {
    ...editedResult,
    ingredients: finalIngredients, // Filtered
    shouldCreateDish: saveDish,
    tags: saveDish ? dishTags : undefined,
  };
  ```
- Calls `onSave(payload)` then `onClose()`

### Editable Fields

#### Dish Info Section (if saveDish = true)

- **Dish Name** (text input): `editedResult.name`
- **Description** (textarea): `editedResult.description`
- **Meal Tags** (multi-button): breakfast/lunch/dinner selector with validation

#### Ingredients Section

For each ingredient:

**Per-Ingredient Controls**:

- Checkbox: Select/deselect ingredient (grayed out if unchecked)
- "AI Research" button: Calls handleResearchIngredient

**Editable Fields** (3-column grid on md+):

1. Name (text input)
2. Amount (number input)
3. Unit (UnitSelector component)

**Nutrition Per Standard Unit** (5-column grid on sm+):

- Calories (number input)
- Protein (number input)
- Carbs (number input)
- Fat (number input)
- Fiber (number input)

**Display Unit Label**:

```typescript
const getDisplayUnit = (unit: string) => {
  const u = unit.toLowerCase().trim();
  if (u === 'kg' || u === 'g') return '100g';
  if (u === 'l' || u === 'ml') return '100ml';
  return `1 ${unit}`;
};
// Shows "Nutrition per 100g" or "Nutrition per 1 cái" etc.
```

### Mobile-Specific UI

- **Modal Height**: `max-h-[85dvh]` on mobile, `max-h-[90dvh]` on sm+
- **Rounded**: `rounded-t-3xl` (sheet style) on mobile, `rounded-3xl` on sm+
- **Safe Area**: `pb-safe` on footer to account for notch/home indicator
- **Text Size**: `text-base sm:text-sm` for inputs (larger on mobile)
- **Grid Layout**:
  - `grid-cols-1 md:grid-cols-3` for ingredient fields
  - `grid-cols-2 sm:grid-cols-5` for nutrition values
- **Padding**: `p-4 sm:p-6` for consistency

### Save Flow & Ingredient Matching

```
1. User toggles "saveDish" checkbox
2. If true: Dish info fields appear (name, description, tags)
3. User selects which ingredients to include (checkboxes)
4. User can edit ingredient names, amounts, units, nutrition
5. User can click "AI Research" to look up nutrition for any ingredient
6. Click "Confirm Save"
   → Validate tags if saveDish
   → Filter ingredients by selectedIngredients array
   → Construct SaveAnalyzedDishPayload
   → Call onSave(payload)
```

**SaveAnalyzedDishPayload**:

```typescript
type SaveAnalyzedDishPayload = {
  name: string;
  shouldCreateDish?: boolean; // Same as saveDish toggle
  tags?: MealType[]; // breakfast/lunch/dinner
  ingredients: AnalyzedIngredient[];
};
```

### Test IDs

- `data-testid="ai-ing-unit-${idx}"` on UnitSelector for each ingredient
- `data-testid="btn-confirm-save-analyzed"` on Confirm Save button

---

## 8. SUGGESTINGREDIENTINFO FUNCTION (In geminiService.ts)

### Purpose

Look up detailed nutrition for a single ingredient, with 1-hour cache

### Function Signature

```typescript
export async function suggestIngredientInfo(
  ingredientName: string, // e.g., "Ức gà"
  unit: string, // e.g., "g", "ml", "cái", "quả"
  signal?: AbortSignal,
): Promise<IngredientSuggestion>;
```

### Returns

```typescript
type IngredientSuggestion = {
  calories: number; // Per 100g/100ml OR per 1 unit
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber: number; // grams
  unit: string; // The unit that was looked up
};
```

### Cache Behavior

- **Cache Key**: `${ingredientName.toLowerCase().trim()}::${unit.toLowerCase().trim()}`
- **TTL**: 1 hour (60 _ 60 _ 1000 ms)
- **Case-Insensitive**: "Ức gà", "ức gà", "ỨC GÀ" all map to same cache key
- **Called From**: SaveAnalyzedDishModal's "AI Research" button for each ingredient

### Prompt Injection Protection

Inputs sanitized: `input.replaceAll(/[`"\\]/g, "'").slice(0, 200)`

---

## 9. ERROR HANDLING SUMMARY

### By Input Method

#### Camera Capture Errors

| Error                   | Message Key                       | Handling                          |
| ----------------------- | --------------------------------- | --------------------------------- |
| No getUserMedia support | `imageCapture.noCameraSupport`    | Shows error overlay, allows close |
| Permission denied       | `imageCapture.cameraAccessDenied` | Shows error overlay, allows close |
| Canvas context null     | Fallback to uncompressed          | Logs error, uses original image   |

#### File Upload Errors

| Error               | Handling                                  |
| ------------------- | ----------------------------------------- |
| Compression failure | Falls back to original uncompressed image |

#### Clipboard Paste Errors

| Error                 | Handling                     |
| --------------------- | ---------------------------- |
| No image in clipboard | Silent, no action            |
| Compression failure   | Falls back to original image |

#### Image Analysis Errors

| Error                  | Message Key                               | Code                        |
| ---------------------- | ----------------------------------------- | --------------------------- |
| NotFoodImageError      | `ai.notFoodTitle` + `error.reason`        | Shows warning notification  |
| Other analysis errors  | `ai.analysisFailed` + `ai.analysisError`  | Shows error notification    |
| Network/timeout errors | Retried up to 2x with exponential backoff | Then throws                 |
| AbortError             | Propagates as DOMException                | Caller handles cancellation |

#### Save Modal Errors

| Error                               | Message Key                                                   |
| ----------------------------------- | ------------------------------------------------------------- |
| No tags selected (if saveDish=true) | `saveAnalyzed.validationSelectMeal`                           |
| "AI Research" lookup fails          | `saveAnalyzed.lookupFailed` + `saveAnalyzed.lookupFailedDesc` |

---

## 10. DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────┐
│ AIImageAnalyzer (Orchestrator)                                      │
│ State: image, isAnalyzing, result, isSaveModalOpen                  │
└─────────────────────────────────────────────────────────────────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
      ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
      │ ImageCapture     │ │ Analyze Button   │ │AnalysisResultView│
      │ - Camera         │ │ (handleAnalyze)  │ │ - Results        │
      │ - Upload         │ │ │                │ │ - Skeleton       │
      │ - Paste          │ │ ├→ compressImage()│ │ - Save Button    │
      │                  │ │ │                │ │                  │
      │ onImageReady()   │ │ ├→analyzeDishImage() │                  │
      │ onClear()        │ │ │                │ │ onOpenSaveModal()│
      └──────────────────┘ │ └→ setResult()   │ └──────────────────┘
                           │                  │
                           └──────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
           ┌─────────────────────┐    ┌─────────────────────────────┐
           │ geminiService.ts    │    │SaveAnalyzedDishModal        │
           │ analyzeDishImage()  │    │ - Edit fields               │
           │                     │    │ - Toggle ingredients        │
           │ Returns:            │    │ - AI Research               │
           │ AnalyzedDishResult  │    │ - Save (onSave callback)    │
           │ or throws           │    │                             │
           │ NotFoodImageError   │    │ suggestIngredientInfo()     │
           └─────────────────────┘    └─────────────────────────────┘
```

---

## 11. TEST CASE CATEGORIES (50+ Tests)

### A. ImageCapture Component (15+ tests)

**Camera Tests**:

1. Start camera with environment (rear) facing mode
2. Start camera with user (front) facing mode
3. Switch camera from environment to user
4. Switch camera from user to environment
5. Close camera stream properly (cleanup)
6. Handle no camera support error
7. Handle permission denied error
8. Capture photo and compress
9. Capture photo and fall back to uncompressed if compression fails
10. Video plays in fullscreen overlay

**Upload Tests**: 11. Upload image file, compress, call onImageReady 12. Upload image file, compression fails, fall back to original 13. File input accepts image/\* only 14. Clear image button visible when image selected

**Paste Tests**: 15. Paste image from clipboard 16. Paste image, compression fails, use original 17. Non-image clipboard items ignored 18. Multiple paste events handled (edge case)

**UI Tests**: 19. Three input options shown when no image 20. Image preview shown when image selected 21. "Choose Another" button replaces image

---

### B. ImageCompression Utility (8+ tests)

1. Small image (500x400): No resize, just compress
2. Large image (2048x1024): Resize to 1024x512 (aspect ratio)
3. Very large image (4000x4000): Resize to 1024x1024
4. Custom maxWidth/maxHeight parameters
5. Custom quality parameter (0.6, 0.8, 0.95)
6. Image load error → reject
7. Canvas context null → reject
8. Output always JPEG format

---

### C. analyzeDishImage (geminiService) (12+ tests)

**Happy Path**:

1. Valid food image → returns AnalyzedDishResult with all fields
2. All ingredients populated correctly
3. Nutrition values present for total and per-ingredient
4. Field names correct (carbs, NOT carbohydrates)

**Not Food Errors**: 5. Non-food image (landscape) → throws NotFoodImageError with reason 6. NotFoodImageError.reason populated from AI response 7. Object (e.g., phone) → throws NotFoodImageError

**Validation**: 8. Missing isFood field → validation error 9. Missing name field → validation error 10. Missing totalNutrition.carbs → validation error 11. Ingredient missing nutritionPerStandardUnit.fiber → validation error

**Resilience**: 12. Timeout (>30s) → rejects with timeout error 13. Retry on transient error → succeeds on 2nd attempt 14. No retry on validation error (won't improve) 15. No retry on AbortError 16. No retry on API key error 17. Abort signal already aborted → throws AbortError immediately 18. Abort signal fires during request → throws AbortError

**Prompt Injection**: 19. Base64 image data properly encoded in request

---

### D. suggestIngredientInfo (Cache + Lookup) (8+ tests)

1. Weight unit (g): Returns nutrition per 100g
2. Volume unit (ml): Returns nutrition per 100ml
3. Countable unit (cái): Returns nutrition per 1 unit
4. Cache hit: 2nd call with same (name, unit) → no API call
5. Cache case-insensitive: "ức gà" and "Ức gà" hit same cache
6. Cache TTL: After 1 hour, makes new API call
7. Different (name, unit) pairs → separate API calls
8. Prompt injection sanitization: Special chars replaced

---

### E. SaveAnalyzedDishModal (18+ tests)

**State Management**:

1. saveDish toggle shows/hides dish info fields
2. Select ingredient checkbox toggles visual state
3. Toggle all ingredients (select all/deselect all)
4. Numeric string state allows clearing without snap-back
5. editedResult cloned from prop at mount

**Validation**: 6. saveDish=true + no tags → shows tagError 7. saveDish=false → allows save without tags 8. Clear tagError when tag selected

**Editing**: 9. Edit dish name field 10. Edit dish description field 11. Edit ingredient name field 12. Edit ingredient amount (number input) 13. Edit ingredient unit (UnitSelector) 14. Edit ingredient nutrition per unit fields (5 fields: cal, pro, carb, fat, fib) 15. Unselected ingredients grayed out visually 16. Unselected ingredients not included in final payload

**AI Research**: 17. Click "AI Research" → calls suggestIngredientInfo 18. Success: Updates nutrition fields for that ingredient 19. Failure: Shows error notification 20. Button disabled during research (loading state)

**Save Flow**: 21. handleConfirmSave → constructs SaveAnalyzedDishPayload correctly 22. Payload includes only selected ingredients 23. shouldCreateDish = saveDish toggle value 24. tags included only if saveDish=true 25. onSave callback called with payload 26. onClose callback called after save 27. Double-submit prevented via hasSubmittedRef

**Display Unit Labels**: 28. "g" unit → shows "Nutrition per 100g" 29. "kg" unit → shows "Nutrition per 100g" 30. "ml" unit → shows "Nutrition per 100ml" 31. "l" unit → shows "Nutrition per 100ml" 32. "cái" unit → shows "Nutrition per 1 cái"

**Mobile UX**: 33. Modal sheet style on mobile (rounded-t-3xl) 34. Modal centered on desktop (rounded-3xl, max-w-4xl) 35. Safe area padding (pb-safe) respected 36. Input text size larger on mobile

---

### F. AnalysisResultView (10+ tests)

**Display States**:

1. Empty state shown when no result
2. Skeleton shown when isAnalyzing=true
3. Results shown when result exists and isAnalyzing=false

**Content Display**: 4. Dish name displayed 5. Dish description displayed 6. Nutrition cards show correct values (calories, protein, carbs, fat) 7. Nutrition card colors correct (orange, blue, amber, rose)

**Ingredients List**: 8. Desktop: Table view with 6 columns 9. Mobile: Card list with 4-column nutrition grid 10. Calculated nutrition shown for each ingredient (via calculateIngredientNutrition) 11. Disclaimer box displayed with text

**Save Button**: 12. Save button shown if onOpenSaveModal provided 13. Save button hidden if onOpenSaveModal undefined 14. Click save button → calls onOpenSaveModal()

---

### G. AIImageAnalyzer Integration (8+ tests)

1. Image capture → handleImageReady → sets image state
2. Click analyze → handleAnalyze → calls analyzeDishImage
3. Successful analysis → sets result → calls onAnalysisComplete
4. NotFoodImageError → shows warning notification
5. Other analysis error → shows generic error notification
6. Clear image → clears both image and result
7. Save modal hidden initially
8. Save modal shown when result exists and onOpenSaveModal clicked
9. Save modal closed when user clicks close button
10. Save modal closed when user confirms save

---

### H. Edge Cases & Error Scenarios (12+ tests)

1. Very large image (10MB) → compression reduces size
2. Corrupted image file → FileReader handles gracefully
3. Paste event with multiple items → uses first image
4. Camera permission denied → shows error, allows retry
5. Network timeout during analysis → retries, then fails
6. Empty ingredient name → still saves (validation on server)
7. Zero ingredient amount → AI prevents (amount > 0 enforced)
8. Ingredient unit not recognized → uses as-is
9. Modal backdrop click → calls onClose (via ModalBackdrop)
10. ESC key pressed → closes modal (via useModalBackHandler hook)
11. Browser doesn't support clipboard API → paste handler does nothing
12. Multiple concurrent analyses → only latest result shown (stale closure prevention)

---

## 12. CRITICAL NOTES FOR TEST IMPLEMENTATION

### State Isolation

- Each test must fresh mount component
- Use `structuredClone()` for deep result copying
- Clear nutrition cache between tests: `_clearNutritionCache()`
- Reset AI singleton between tests: `_resetAISingleton()`

### Mocking Strategy

- Mock `navigator.mediaDevices.getUserMedia` for camera tests
- Mock Image constructor for compression tests
- Mock Gemini API via vi.mock('@google/genai')
- Ensure response.text is populated in mock responses

### Assertion Points

- Test component rendering (data-testid)
- Test callback invocations (jest.fn())
- Test state updates (waitFor + getByTestId)
- Test error messages (i18n keys, notification calls)

### Mobile Testing

- Test both sm (<640px) and desktop (≥640px) breakpoints
- Use userEvent instead of fireEvent for input changes
- Test keyboard navigation (arrow keys, enter, escape)
- Verify safe-area padding applied

### Notification Testing

- Mock useNotification hook
- Verify correct notification type (warning, error)
- Verify correct i18n key passed
- Check error.reason included in NotFoodImageError notifications

### Timing Edge Cases

- Test compression with large images (may take time)
- Test analysis timeout (mock slow API)
- Test cache expiration (advance time via vi.useFakeTimers)
- Test component unmount during async operation

---

## 13. QUICK REFERENCE: IMPORTANT CONSTANTS

| Constant              | Value                 | File                |
| --------------------- | --------------------- | ------------------- |
| AI_CALL_TIMEOUT_MS    | 30,000 ms             | geminiService.ts    |
| MAX_RETRIES           | 2                     | geminiService.ts    |
| CACHE_TTL_MS          | 3,600,000 ms (1 hour) | geminiService.ts    |
| Image maxWidth        | 1024 px               | imageCompression.ts |
| Image maxHeight       | 1024 px               | imageCompression.ts |
| Image quality         | 0.8 (80%)             | imageCompression.ts |
| Gemini Model          | "gemini-2.5-flash"    | geminiService.ts    |
| Camera default facing | 'environment' (rear)  | ImageCapture.tsx    |

---

## 14. TYPE EXPORTS (For Test Imports)

```typescript
// From types.ts
import {
  AnalyzedDishResult,
  AnalyzedIngredient,
  AnalyzedNutritionPerUnit,
  NotFoodImageError,
  SaveAnalyzedDishPayload,
  IngredientSuggestion,
  MealType,
  AvailableDishInfo,
  SuggestedDishIngredient,
  MealPlanSuggestion,
} from './types';

// From geminiService.ts (functions)
import {
  analyzeDishImage,
  suggestIngredientInfo,
  suggestDishIngredients,
  suggestMealPlan,
  _resetAISingleton,
  _clearNutritionCache,
} from './services/geminiService';

// From imageCompression.ts
import { compressImage } from './utils/imageCompression';

// From components
import { AIImageAnalyzer } from './components/AIImageAnalyzer';
import { ImageCapture } from './components/ImageCapture';
import { AnalysisResultView } from './components/AnalysisResultView';
import { SaveAnalyzedDishModal } from './components/modals/SaveAnalyzedDishModal';
```

---

**Document Complete** ✓
