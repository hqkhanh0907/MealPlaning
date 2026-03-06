# Sequence Diagrams — Smart Meal Planner

**Version:** 1.0  
**Date:** 2026-03-06

---

## SD-01: Phân tích ảnh thức ăn bằng AI

```
User          AIImageAnalyzer    ImageCapture   geminiService      Gemini API    App.tsx
 │                  │                │               │                  │           │
 │──open AI tab────►│                │               │                  │           │
 │                  │──render───────►│               │                  │           │
 │                  │                │               │                  │           │
 │──chụp/chọn ảnh──►│                │               │                  │           │
 │                  │──onCapture────►│               │                  │           │
 │                  │◄──imageData────│               │                  │           │
 │                  │                │               │                  │           │
 │                  │───compress(imageData)──────────►               │           │
 │                  │◄───compressedBase64─────────────               │           │
 │                  │                │               │                  │           │
 │                  │               analyzeDishImage(base64)──────────►│           │
 │                  │               withRetry()       │                  │           │
 │                  │               callWithTimeout(30s)                │           │
 │                  │               │               │──POST /generate──►│           │
 │                  │               │               │◄──JSON response───│           │
 │                  │               │               isAnalyzedDishResult()          │
 │                  │               │               │                  │           │
 │                  │◄──AnalyzedDishResult──────────│                  │           │
 │                  │                │               │                  │           │
 │◄──show preview────│ (AnalysisResultView)           │                  │           │
 │                  │                │               │                  │           │
 │──"Lưu"──────────►│ onSaveResult() │               │                  │           │
 │                  │───────────────────────────────────────────────────────────────►│
 │                  │                │           App.tsx: handleSaveAnalyzedDish()  │
 │                  │                │               │            processAnalyzedDish()
 │                  │                │               │            setIngredients()   │
 │                  │                │               │            setDishes()        │
 │◄──toast success──────────────────────────────────────────────────────────────────│
```

**Error flows:**
- `isFood = false` → show NotFoodImageError toast, không crash
- timeout (>30s) → toast "Phân tích thất bại"
- network error → withRetry (2 lần) → toast error

---

## SD-02: Gợi ý thực đơn AI

```
User         CalendarTab    useAISuggestion   geminiService    Gemini API    AISuggestionPreviewModal
 │                │                │                │               │                │
 │──"AI Gợi ý"──►│                │                │               │                │
 │                │──suggest()────►│                │               │                │
 │                │                │─buildContext()─│               │                │
 │                │                │ (dishes, target)               │                │
 │                │                │──suggestMealPlan()─────────────►               │
 │                │                │                │──POST /generate (ThinkingHigh)►│
 │                │                │                │◄──MealPlanSuggestion───────────│
 │                │                │                isMealPlanSuggestion()           │
 │                │                │◄──suggestion──────────          │               │
 │                │◄──setSuggestion│                                 │               │
 │                │──────────────────────────────────────────────────────────────────►│
 │                │                │         open AISuggestionPreviewModal            │
 │◄──show preview─────────────────────────────────────────────────────────────────────│
 │                │                │                │               │                │
 │──"Áp dụng"────────────────────────────────────────────────────────────────────────►│
 │                │◄──onApply(suggestion)──────────────────────────────────────────────
 │                │──applySuggestionToDayPlans()     │               │                │
 │                │──setDayPlans()                   │               │                │
 │◄──calendar updated
```

---

## SD-03: Thêm nguyên liệu mới (CRUD)

```
User         IngredientManager   IngredientEditModal   App.tsx (setIngredients)
 │                  │                    │                      │
 │──tap "+"─────────►                    │                      │
 │                  │──openModal()───────►                      │
 │                  │                    │                      │
 │──fill form───────────────────────────►│                      │
 │──tap "Lưu"───────────────────────────►│                      │
 │                  │                    │─validate()            │
 │                  │                    │  ✓ pass               │
 │                  │                    │─onSave(ingredient)───►│
 │                  │                    │                     setIngredients(prev => [...prev, newItem])
 │                  │                    │                     localStorage.setItem('mp-ingredients', ...)
 │◄──toast success──────────────────────────────────────────────│
 │                  │◄──onClose()────────│                      │
```

**Unsaved Changes flow:**
```
User         IngredientEditModal        UnsavedChangesDialog
 │                    │                         │
 │──(fill form)───────►│                         │
 │──tap "✕"───────────►│                         │
 │                     │─hasChanges() = true      │
 │                     │──setShowUnsavedDialog────►
 │◄──dialog appears──────────────────────────────│
 │──tap "Discard"─────────────────────────────── ►│
 │                     │◄──onDiscard()────────────│
 │                     │─close modal              │
```

---

## SD-04: Lưu kết quả AI thành Nguyên liệu + Món ăn

```
User       SaveAnalyzedDishModal    dataService       App.tsx
 │                  │                   │               │
 │──(from UC-07)────►                   │               │
 │                  │─show preview      │               │
 │                  ├── ingredients list                │
 │                  ├── options: createDish?, tags      │
 │──confirm "Lưu"──►│                   │               │
 │                  │─processAnalyzedDish(payload)──────►
 │                  │                   │─for each ingredient:
 │                  │                   │  findExisting() || create new
 │                  │                   │─if createDish:
 │                  │                   │  createDish(dishIngredients)
 │                  │                   │◄─{newIngredients, newDish}
 │                  │◄──result──────────│               │
 │                  │─onSave(result)────────────────────►
 │                  │                   │─setIngredients([...prev, ...newIngredients])
 │                  │                   │─if newDish: setDishes([...prev, newDish])
 │◄──toast success──────────────────────────────────────│
```

---

## SD-05: Export dữ liệu (Android Share)

```
User          DataBackup        App.tsx       Capacitor.Filesystem  Capacitor.Share
 │               │                │                    │                  │
 │──tap Export──►│                │                    │                  │
 │               │─buildPayload()─►                    │                  │
 │               │◄──{ingredients, dishes, dayPlans, userProfile}         │
 │               │─JSON.stringify()                    │                  │
 │               │─Filesystem.writeFile(tmpFile)──────►│                  │
 │               │◄──uri──────────────────────────────│                  │
 │               │─Share.share({ url: uri })─────────────────────────────►
 │◄──Android Share sheet opens────────────────────────────────────────────│
```

---

## SD-06: Khởi động app — Data hydration

```
React            usePersistedState     localStorage    dataService
  │                     │                   │               │
  │─mount App.tsx────────►                  │               │
  │                     │─getItem('mp-ingredients')────────►│
  │                     │◄──JSON string─────────────────────│
  │                     │─JSON.parse()       │               │
  │                     │◄──rawIngredients[]  │               │
  │                     │                   │               │
  │─useMemo migrates────────────────────────────────────────►
  │                     │                   │─migrateIngredients(raw)
  │                     │                   │─migrateDishes(raw)
  │◄──ingredients (typed, migrated)───────────────────────────│
  │                     │                   │               │
  │─render CalendarTab───►                  │               │
```

---

## SD-07: Background translation (OPUS offline)

```
User        App.tsx      useTranslateProcessor  translateQueueService  OPUS Worker
 │             │                  │                      │                  │
 │─save ing────►                  │                      │                  │
 │          setIngredients()       │                      │                  │
 │          ─detectMissing()──────►                      │                  │
 │                                │─enqueue({id, type, direction, text})────►
 │                                │                      │─dequeue next      │
 │                                │                      │─postMessage(task)─►
 │                                │                      │                 translate()
 │                                │                      │◄─'translated' event
 │          ◄─updateTranslatedField()                    │                  │
 │          setIngredients(prev => update name.en)       │                  │
 │          localStorage.setItem(...)                    │                  │
 │◄─TranslateStatusBadge updates                        │                  │
```
