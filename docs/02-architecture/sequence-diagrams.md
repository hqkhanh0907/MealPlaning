# Sequence Diagrams — Smart Meal Planner

**Version:** 3.0  
**Date:** 2026-07-16

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

## SD-07: Lên kế hoạch bữa ăn (Plan Meal — Direct Modal)

> **v1.1 (2026-03-07):** Flow cũ qua TypeSelectionModal đã bị loại bỏ.
> MealPlannerModal mở trực tiếp với `initialTab` là slot trống đầu tiên.

```
User         CalendarTab      App.tsx         useModalManager     MealPlannerModal
 │                │               │                  │                   │
 │──tap "Plan Meal"──►            │                  │                   │
 │  (btn-plan-meal-section        │                  │                   │
 │   or btn-plan-meal-empty)      │                  │                   │
 │                │──onOpenTypeSelection()──►         │                   │
 │                │               │─openTypeSelection()                  │
 │                │               │  check currentPlan:                  │
 │                │               │    breakfastDishIds.length === 0?    │
 │                │               │    lunchDishIds.length === 0?        │
 │                │               │    dinnerDishIds.length === 0?       │
 │                │               │  → emptySlots = ['lunch','dinner']   │
 │                │               │                  │                   │
 │                │               │──openMealPlanner(emptySlots[0])─────►│
 │                │               │                  │─isMealPlannerOpen = true
 │                │               │                  │─planningType = 'lunch'
 │                │               │                  │                   │
 │                │               │                  │──render───────────►
 │                │               │                  │   initialTab='lunch'
 │◄──MealPlannerModal opens───────────────────────────────────────────────│
 │    Tabs: ☀️ Breakfast │ 🌤️ Lunch │ 🌙 Dinner                         │
 │    (activeTab = initialTab)                                           │
 │                │               │                  │                   │
 │──switch tab (optional)──────────────────────────────────────────────── │
 │──tap dish card──────────────────────────────────────────────────────── │
 │                │               │                  │  toggleDish(dishId)│
 │                │               │                  │  selections[tab].add(id)
 │                │               │                  │                   │
 │──tap "Confirm"──────────────────────────────────────────────────────── │
 │                │               │                  │  handleConfirm()  │
 │                │               │◄──onConfirm(changes)─────────────────│
 │                │               │─handleUpdatePlan()                   │
 │                │               │  updateDayPlanSlot(dayPlans, date, type, ids)
 │                │               │  setDayPlans()   │                   │
 │                │               │──closeMealPlanner()─────────────────►│
 │◄──toast success────────────────│                  │                   │
```

---

## SD-08: Xóa kế hoạch (Clear Plan — Inline Button)

> **v1.1 (2026-03-07):** MoreMenu (`btn-more-menu`) đã bị loại bỏ.
> `btn-clear-plan` giờ là nút inline trong CalendarTab header.

```
User         CalendarTab      ClearPlanModal      App.tsx
 │                │                  │                │
 │──tap "Clear"───►                  │                │
 │  (btn-clear-plan                  │                │
 │   inline in header)               │                │
 │                │──onOpenClearPlan()                 │
 │                │──────────────────►│                │
 │◄──modal appears────────────────── │                │
 │    Scope options:                 │                │
 │      • 🗓️ Day (selected day)      │                │
 │      • 📅 Week (selected week)    │                │
 │      • 🗓️ Month (selected month)  │                │
 │                │                  │                │
 │──select scope──────────────────── ►│                │
 │──tap "Confirm"─────────────────── ►│                │
 │                │                  │──onClear(scope)─►
 │                │                  │         handleClearPlan(scope)
 │                │                  │         clearDayPlans(dayPlans, date, scope)
 │                │                  │         setDayPlans()
 │                │◄─────────────────│◄──close modal──│
 │◄──calendar updated────────────────                 │
 │◄──toast success───────────────────                 │
```

---

## SD-09: Food Name Translation (Dictionary + OPUS fallback)

> **v1.2** (2026-03-08): Updated with dictionary fast-path. Xem [ADR 004](../adr/004-food-dictionary-instant-translation.md).

### SD-09a: Instant translation via dictionary (happy path, ~0ms)

```
User          App.tsx                  foodDictionary
 │               │                          │
 │─save ing──────►                          │
 │            lookupFoodTranslation()──────►│
 │                                    HIT ◄─│
 │            setIngredients({...ing,       │
 │              name: { vi, en: result }})  │
 │            localStorage.setItem(...)     │
 │◄──UI updates instantly                  │
```

### SD-09b: Worker fallback for unknown terms

```
User        App.tsx      useTranslateProcessor  translateQueueService  Worker
 │             │                  │                      │                │
 │─save ing────►                  │                      │                │
 │          lookupFoodTranslation() → null (MISS)       │                │
 │          setIngredients(ing)   │                      │                │
 │          enqueue({itemId, direction, sourceText})─────►                │
 │                                │                      │                │
 │             [workerReady = true]                      │                │
 │                                │─pick pending job─────►                │
 │                                │                      │                │
 │                                │        postMessage({type:'translate'})│
 │                                │                      │      ┌─────────┤
 │                                │                      │      │dictionary│
 │                                │                      │      │  HIT?   │
 │                                │                      │      ├─yes→result
 │                                │                      │      └─no→WASM │
 │                                │                      │       translate()
 │                                │                      │◄─{type:'result'}
 │          ◄─updateTranslatedField()                    │                │
 │          setIngredients(prev => update name.en)       │                │
 │          localStorage.setItem(...)                    │                │
 │◄─UI re-renders with translated name                  │                │
```

### SD-09c: scanMissing on page load (repair corrupted data)

```
App.tsx            useTranslateWorker       translateQueueService    Worker
  │                       │                         │                  │
  │─mount─────────────────►                         │                  │
  │                    new Worker()                  │                  │
  │                       │◄────{type:'ready'}──────│──────────────────│
  │                    setWorkerReady(true)          │                  │
  │                    scanMissing(dishes, ings, lang)                  │
  │                       │─────────────────────────►                  │
  │                       │   for each: name.en === name.vi?           │
  │                       │   YES → enqueue({sourceText: name.vi,      │
  │                       │          direction: 'vi-en'})               │
  │                       │                         │─dispatch to worker│
  │                       │                         │──────────────────►│
  │                       │                         │         dictionary│
  │                       │                         │◄─{type:'result'}─│
  │◄─updateTranslatedField()                        │                  │
  │  setIngredients(prev => update name.en)         │                  │
```

---

## SD-10: Google Drive Sync (Auto-Backup)

```
User          App.tsx       AuthContext   useAutoSync   googleDriveService   Google Drive API
 │               │               │              │               │                  │
 │──Sign In─────►│               │              │               │                  │
 │               │──initAuth()──►│              │               │                  │
 │               │               │──OAuth2──────────────────────────────────────────►│
 │               │               │◄──accessToken────────────────────────────────────│
 │               │               │──setUser()───►              │                  │
 │               │◄──authState───│              │               │                  │
 │               │                              │               │                  │
 │               │──useAutoSync(enabled=true)───►               │                  │
 │               │                              │──listFiles()─►│                  │
 │               │                              │               │──GET /files──────►│
 │               │                              │               │◄──fileList────────│
 │               │                              │◄──backupMeta──│                  │
 │               │                              │               │                  │
 │               │                              │──downloadBackup()────────────────►│
 │               │                              │◄──backupJSON─────────────────────│
 │               │                              │               │                  │
 │               │◄──mergeOrConflict────────────│               │                  │
 │               │                              │               │                  │
 │──edit data───►│                              │               │                  │
 │               │──onDataChange()─────────────►│               │                  │
 │               │                              │──debounce(3s)─│                  │
 │               │                              │               │                  │
 │               │                              │──uploadBackup()──────────────────►│
 │               │                              │               │──POST multipart──►│
 │               │                              │               │◄──fileId──────────│
 │               │                              │◄──success─────│                  │
 │◄──syncStatus: idle───────────────────────────│               │                  │
```

---

## SD-11: Sync Conflict Resolution

```
User          App.tsx      useAutoSync    SyncConflictModal
 │               │              │               │
 │               │              │──detect conflict (local ≠ cloud)
 │               │◄──showConflict──│            │
 │               │──render──────────────────────►│
 │               │              │               │
 │──choose "Keep Local"────────────────────────►│
 │               │◄──onResolve('local')─────────│
 │               │──uploadBackup()──────────────►│
 │               │              │               │
 │  OR                          │               │
 │──choose "Use Cloud"─────────────────────────►│
 │               │◄──onResolve('cloud')─────────│
 │               │──applyCloudData()────────────►│
 │               │──setIngredients/setDishes/setDayPlans()
 │◄──data updated──│            │               │
```

---

## SD-12: Copy Plan

```
User          CalendarTab    CopyPlanModal    useCopyPlan    App.tsx
 │               │               │               │             │
 │──click "Copy"►│               │               │             │
 │               │──openModal───►│               │             │
 │               │               │               │             │
 │──select targets──────────────►│               │             │
 │  (Tomorrow/Week/Custom)      │               │             │
 │               │               │               │             │
 │──confirm─────────────────────►│               │             │
 │               │               │──copyPlan()──►│             │
 │               │               │               │──for each targetDate:
 │               │               │               │  clone dishIds from source
 │               │               │               │──setDayPlans()──────────►│
 │               │               │               │             │──persist──►localStorage
 │               │               │◄──success─────│             │
 │               │◄──close modal─│               │             │
 │◄──calendar updated──│         │               │             │
```

---

## SD-13: Meal Template (Save & Apply)

```
User          CalendarTab   SaveTemplateModal   useMealTemplate   TemplateManager   App.tsx
 │               │               │                  │                  │              │
 │── "Save as Template"──────────►                  │                  │              │
 │               │               │                  │                  │              │
 │──enter name──►│               │                  │                  │              │
 │──confirm─────────────────────►│                  │                  │              │
 │               │               │──saveTemplate()─►│                  │              │
 │               │               │                  │──create template with dishIds   │
 │               │               │                  │──setTemplates()──────────────────►
 │               │               │                  │                  │  persist to localStorage
 │               │               │◄──success────────│                  │              │
 │               │◄──close───────│                  │                  │              │
 │               │               │                  │                  │              │
 │── "Templates" button─────────────────────────────────────────────►│              │
 │               │               │                  │                  │──show list   │
 │──select template + date──────────────────────────────────────────►│              │
 │               │               │                  │                  │              │
 │──"Apply"─────────────────────────────────────────────────────────►│              │
 │               │               │                  │◄──applyTemplate()│              │
 │               │               │                  │──build DayPlan from template    │
 │               │               │                  │──setDayPlans()──────────────────►│
 │               │               │                  │                  │  persist to localStorage
 │◄──calendar updated──────────────────────────────────────────────────────────────────│
```

---

## SD-14: Onboarding Flow (Wizard → Profile Save → Plan Generation)

> **v3.0 (2026-07-16):** Unified Onboarding wizard — multi-step form collecting health profile and training configuration, then generating a training plan.

```mermaid
sequenceDiagram
    participant User
    participant UnifiedOnboarding
    participant WelcomeSlides
    participant HealthSteps
    participant TrainingSteps
    participant PlanStrategy
    participant PlanComputing
    participant PlanPreview
    participant HealthProfileStore
    participant FitnessStore
    participant AppOnboardingStore
    participant DB as SQLite (databaseService)

    User->>UnifiedOnboarding: Open app (first time)
    UnifiedOnboarding->>AppOnboardingStore: check isAppOnboarded
    AppOnboardingStore-->>UnifiedOnboarding: false

    UnifiedOnboarding->>WelcomeSlides: render step 0
    User->>WelcomeSlides: swipe/tap "Bắt đầu"
    WelcomeSlides-->>UnifiedOnboarding: onNext()

    UnifiedOnboarding->>HealthSteps: render HealthBasicStep
    User->>HealthSteps: fill name, gender, DOB, height, weight
    HealthSteps-->>UnifiedOnboarding: onNext(healthData)

    UnifiedOnboarding->>HealthSteps: render ActivityLevelStep
    User->>HealthSteps: select activity level
    HealthSteps-->>UnifiedOnboarding: onNext()

    UnifiedOnboarding->>HealthSteps: render NutritionGoalStep
    User->>HealthSteps: select goal (cut/bulk/maintain)
    HealthSteps-->>UnifiedOnboarding: onNext()

    UnifiedOnboarding->>HealthSteps: render HealthConfirmStep
    User->>HealthSteps: confirm health info
    HealthSteps-->>UnifiedOnboarding: onNext()

    UnifiedOnboarding->>HealthProfileStore: saveProfile(healthData)
    HealthProfileStore->>DB: INSERT INTO user_profile

    UnifiedOnboarding->>TrainingSteps: render TrainingCoreStep
    User->>TrainingSteps: fill goal, experience, days/week
    TrainingSteps-->>UnifiedOnboarding: onNext()

    UnifiedOnboarding->>TrainingSteps: render TrainingDetailSteps
    User->>TrainingSteps: fill equipment, injuries, cardio
    TrainingSteps-->>UnifiedOnboarding: onNext()

    UnifiedOnboarding->>PlanStrategy: render PlanStrategyChoice
    User->>PlanStrategy: choose "auto" or "manual"

    alt Auto Strategy
        PlanStrategy-->>UnifiedOnboarding: onNext(strategy='auto')
        UnifiedOnboarding->>PlanComputing: render computing screen
        PlanComputing->>FitnessStore: generatePlan(profile, trainingConfig)
        FitnessStore->>DB: INSERT INTO training_plans, training_plan_days
        FitnessStore-->>PlanComputing: plan generated
        PlanComputing->>PlanPreview: render plan preview
        User->>PlanPreview: confirm plan
    else Manual Strategy
        PlanStrategy-->>UnifiedOnboarding: onNext(strategy='manual')
        Note over UnifiedOnboarding: Skip plan generation, user builds own plan later
    end

    UnifiedOnboarding->>AppOnboardingStore: setAppOnboarded(true)
    AppOnboardingStore->>DB: persist onboarding state
    UnifiedOnboarding-->>User: navigate to Dashboard tab
```

---

## SD-15: Training Plan View (Load Plan → Render Calendar → Select Day)

> **v3.0 (2026-07-16):** How the training plan view loads and displays exercises.

```mermaid
sequenceDiagram
    participant User
    participant FitnessTab
    participant TrainingPlanView
    participant SessionTabs
    participant FitnessStore
    participant DB as SQLite (databaseService)

    User->>FitnessTab: tap "Tập luyện" tab
    FitnessTab->>FitnessStore: check activePlan

    alt No active plan
        FitnessStore-->>FitnessTab: activePlan = null
        FitnessTab-->>User: show "Chưa có kế hoạch" empty state
    else Has active plan
        FitnessStore-->>FitnessTab: activePlan exists
        FitnessTab->>TrainingPlanView: render with plan data
    end

    TrainingPlanView->>FitnessStore: useShallow(s => ({ plans, activePlan }))
    FitnessStore->>DB: SELECT * FROM training_plans WHERE status='active'
    DB-->>FitnessStore: TrainingPlan[]
    FitnessStore->>DB: SELECT * FROM training_plan_days WHERE plan_id=?
    DB-->>FitnessStore: TrainingPlanDay[]
    FitnessStore-->>TrainingPlanView: plan + days data

    TrainingPlanView-->>User: render week calendar view
    Note over TrainingPlanView: Days colored by workout type<br/>Rest days grayed out

    User->>TrainingPlanView: tap on a day (e.g. Monday)
    TrainingPlanView->>TrainingPlanView: setSelectedDay(monday)
    TrainingPlanView->>SessionTabs: render sessions for selected day

    SessionTabs-->>User: show exercise list with sets/reps
    Note over SessionTabs: Each exercise shows:<br/>name, muscle groups, sets × reps range, weight

    User->>SessionTabs: tap "+" button
    SessionTabs-->>User: open AddSessionModal
```

---

## SD-16: Plan Day Editor (Open → Modify Exercises → Save)

> **v3.0 (2026-07-16):** Full-screen page for editing exercises in a training plan day.

```mermaid
sequenceDiagram
    participant User
    participant TrainingPlanView
    participant NavigationStore
    participant PageStackOverlay
    participant PlanDayEditor
    participant FitnessStore
    participant DB as SQLite (databaseService)

    User->>TrainingPlanView: tap "Chỉnh sửa" on a plan day
    TrainingPlanView->>NavigationStore: pushPage({ type: 'PlanDayEditor', planDayId })
    NavigationStore-->>PageStackOverlay: pageStack updated

    PageStackOverlay->>PlanDayEditor: lazy load + render (full-screen overlay)
    PlanDayEditor->>FitnessStore: loadPlanDay(planDayId)
    FitnessStore->>DB: SELECT * FROM training_plan_days WHERE id=?
    DB-->>FitnessStore: TrainingPlanDay with exercises JSON
    FitnessStore-->>PlanDayEditor: planDay data

    PlanDayEditor-->>User: show exercise list (editable)
    Note over PlanDayEditor: Each exercise:<br/>name, sets, reps range, weight<br/>Drag to reorder, swipe to delete

    User->>PlanDayEditor: modify exercise (change sets/reps/weight)
    PlanDayEditor->>PlanDayEditor: updateLocalState(exerciseChanges)

    User->>PlanDayEditor: add new exercise
    PlanDayEditor-->>User: show exercise picker modal
    User->>PlanDayEditor: select exercise from library
    PlanDayEditor->>PlanDayEditor: addExerciseToList(selectedExercise)

    User->>PlanDayEditor: tap "Lưu"
    PlanDayEditor->>PlanDayEditor: validate (hasChanges?)

    alt Has unsaved changes
        PlanDayEditor->>FitnessStore: updatePlanDay(planDayId, exercises)
        FitnessStore->>DB: UPDATE training_plan_days SET exercises=? WHERE id=?
        DB-->>FitnessStore: success
        FitnessStore-->>PlanDayEditor: updated
        PlanDayEditor->>NavigationStore: popPage()
        NavigationStore-->>PageStackOverlay: pageStack updated
        PageStackOverlay-->>User: return to TrainingPlanView (re-rendered)
    end

    alt User taps back without saving
        PlanDayEditor-->>User: show UnsavedChangesDialog
        User->>PlanDayEditor: "Discard" or "Keep editing"
    end
```

---

## SD-17: Workout Logging (Start → Log Sets → Complete → Update Progress)

> **v3.0 (2026-07-16):** Strength workout logging flow with plan-based and freestyle modes.

```mermaid
sequenceDiagram
    participant User
    participant FitnessTab
    participant NavigationStore
    participant PageStackOverlay
    participant WorkoutLogger
    participant FitnessStore
    participant DB as SQLite (databaseService)

    User->>FitnessTab: tap "Bắt đầu tập" on today's plan
    FitnessTab->>NavigationStore: pushPage({ type: 'WorkoutLogger', planDayId })
    NavigationStore-->>PageStackOverlay: pageStack updated
    PageStackOverlay->>WorkoutLogger: lazy load + render (full-screen)

    alt Plan-based workout (planDayId exists)
        WorkoutLogger->>FitnessStore: loadPlanDay(planDayId)
        FitnessStore->>DB: SELECT exercises FROM training_plan_days WHERE id=?
        DB-->>FitnessStore: planned exercises
        FitnessStore-->>WorkoutLogger: prefill exercise list
    else Freestyle workout (planDayId = null)
        WorkoutLogger-->>User: empty exercise list, user adds manually
    end

    WorkoutLogger->>FitnessStore: saveDraft(exercises, startTime)
    FitnessStore->>DB: INSERT INTO workout_drafts
    Note over WorkoutLogger: Draft saved periodically<br/>to prevent data loss on crash

    loop For each exercise
        User->>WorkoutLogger: select exercise
        WorkoutLogger-->>User: show set inputs (reps, weight)

        loop For each set
            User->>WorkoutLogger: enter reps + weight
            User->>WorkoutLogger: tap "✓" to complete set
            WorkoutLogger->>WorkoutLogger: markSetComplete(exerciseId, setNumber)
            WorkoutLogger-->>User: set highlighted as completed
        end
    end

    User->>WorkoutLogger: tap "Hoàn thành"
    WorkoutLogger->>WorkoutLogger: calculate duration (now - startTime)

    WorkoutLogger->>FitnessStore: saveWorkout(workoutData)
    FitnessStore->>DB: BEGIN TRANSACTION
    FitnessStore->>DB: INSERT INTO workouts (id, date, name, plan_day_id, duration_min)
    FitnessStore->>DB: INSERT INTO workout_sets (workout_id, exercise_id, set_number, reps, weight_kg) × N
    FitnessStore->>DB: DELETE FROM workout_drafts WHERE id='current'
    FitnessStore->>DB: COMMIT
    DB-->>FitnessStore: success

    FitnessStore-->>WorkoutLogger: workout saved
    WorkoutLogger->>NavigationStore: popPage()
    NavigationStore-->>PageStackOverlay: pageStack updated
    PageStackOverlay-->>User: return to FitnessTab

    FitnessTab->>FitnessStore: refreshProgress()
    FitnessStore-->>FitnessTab: updated workout history
    FitnessTab-->>User: show updated progress + history
```

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-20 | Initial sequence diagrams (SD-01 to SD-06) |
| 1.1 | 2026-03-07 | Updated SD-07 (MealPlanner direct modal), SD-08 (inline clear button) |
| 2.0 | 2026-03-11 | Added SD-09 (translation), SD-10 (Google Drive sync), SD-11 (conflict resolution), SD-12 (copy plan), SD-13 (meal templates) |
| 3.0 | 2026-07-16 | Added 4 Mermaid sequence diagrams: SD-14 (Onboarding Flow), SD-15 (Training Plan View), SD-16 (Plan Day Editor), SD-17 (Workout Logging) |
