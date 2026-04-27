# Software Architecture Document (SAD) — HealthMate AI

**Version:** 1.0  
**Date:** 2026-04-14  
**Status:** Active

---

## 1. Tổng quan kiến trúc

### Tech Stack

| Layer | Công nghệ | Version | Ghi chú |
|-------|-----------|---------|---------|
| UI Framework | Angular | 21 | Standalone components, Signals, Signal Forms, new control flow |
| UI Components | Ionic | 8 | Mobile-native UI components |
| Language | TypeScript | 5.9, strict mode | No `any` allowed |
| Native Wrapper | Capacitor | 8.3 | Android only |
| Database | SQLite | sql.js + @capacitor-community/sqlite | Dual implementation |
| State Management | Angular Signals | built-in | signal(), computed(), effect() |
| AI | Google Gemini API | paid tier | Via HTTP service |
| Testing | Karma + Jasmine | — | Angular default test runner |
| Styling | Ionic theme + SCSS | — | CSS custom properties + SCSS |
| Build | Angular CLI | esbuild | Official Angular builder |
| CI/CD | GitHub Actions | — | Auto build APK |
| Platform | Android only | — | Play Store |

### Runtime Prerequisites

| Tool | Version | Ghi chú |
|------|---------|---------|
| Node.js | **22 LTS** | LTS mới nhất (support đến Apr 2027) |
| Java (JDK) | **21 LTS** | Cần cho Android build. AGP 8.13 + Gradle 8.14 support Java 17-24. |
| Android SDK | API 36 | compileSdk 36, minSdk 24 (Android 7.0+) |
| npm | 10+ | Đi kèm Node 22 |

### Kiến trúc tổng thể

```
┌─────────────────────────────────────────┐
│              Angular 21 App              │
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐  │
│  │Dashboard│ │Calendar │ │Management│  │
│  └────┬────┘ └────┬────┘ └────┬─────┘  │
│       │           │           │         │
│  ┌────┴────┐ ┌────┴────┐ ┌───┴──────┐  │
│  │Fitness  │ │Settings │ │ AI Module│  │
│  └────┬────┘ └────┬────┘ └────┬─────┘  │
│       │           │           │         │
│  ─────┴───────────┴───────────┴─────── │
│  │         Signal Stores (core/)     │  │
│  ─────────────────┬──────────────────  │
│                   │                     │
│  ┌────────────────┴────────────────┐   │
│  │        Repository Layer          │   │
│  │  IngredientRepo · DishRepo · .. │   │
│  └────────────────┬────────────────┘   │
│                   │                     │
│  ┌────────────────┴────────────────┐   │
│  │    DatabaseService (Abstract)    │   │
│  ├─────────────┬───────────────────┤   │
│  │ WebDatabase │ NativeDatabase    │   │
│  │ (sql.js)    │ (Capacitor SQLite)│   │
│  └─────────────┴───────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │       Capacitor Plugins          │   │
│  │ Camera·Notifications·Network·.. │   │
│  └─────────────────────────────────┘   │
│                                         │
└────────────────────┬────────────────────┘
                     │
              ┌──────┴──────┐
              │   Android    │
              │   WebView    │
              └─────────────┘
```

---

## 2. Project Structure

```
src/
├── app/
│   ├── app.component.ts              # Root component
│   ├── app.config.ts                 # Application config (providers)
│   ├── app.routes.ts                 # Top-level routes
│   │
│   ├── core/                         # Singleton services, stores, guards
│   │   ├── services/
│   │   │   ├── database/
│   │   │   │   ├── database.service.ts        # Abstract interface (4 methods)
│   │   │   │   ├── web-database.service.ts    # sql.js WASM (web/tests)
│   │   │   │   ├── native-database.service.ts # @capacitor-community/sqlite
│   │   │   │   ├── database.provider.ts       # Factory provider
│   │   │   │   ├── migration-runner.ts        # Versioned migrations executor
│   │   │   │   └── migrations/
│   │   │   │       └── V1_initial_schema.sql
│   │   │   ├── ai/
│   │   │   │   ├── gemini.service.ts          # Core Gemini API caller
│   │   │   │   ├── nutrition-ai.service.ts    # Menu suggest, meal plan, autofill
│   │   │   │   ├── fitness-ai.service.ts      # Training plan, plateau analysis
│   │   │   │   └── insight-ai.service.ts      # Daily insights, weekly review
│   │   │   ├── platform.service.ts            # Capacitor platform detection
│   │   │   └── network.service.ts             # Online/offline status
│   │   ├── repositories/
│   │   │   ├── ingredient.repository.ts
│   │   │   ├── dish.repository.ts
│   │   │   ├── day-plan.repository.ts
│   │   │   ├── meal-slot.repository.ts
│   │   │   ├── exercise.repository.ts
│   │   │   ├── training-plan.repository.ts
│   │   │   ├── workout.repository.ts
│   │   │   ├── weight-log.repository.ts
│   │   │   ├── streak-log.repository.ts
│   │   │   ├── ai-chat-log.repository.ts
│   │   │   └── app-config.repository.ts
│   │   ├── stores/
│   │   │   ├── ingredient.store.ts
│   │   │   ├── dish.store.ts
│   │   │   ├── day-plan.store.ts
│   │   │   ├── fitness.store.ts
│   │   │   ├── profile.store.ts
│   │   │   ├── dashboard.store.ts
│   │   │   └── ui.store.ts                    # Loading, errors, offline status
│   │   ├── models/
│   │   │   ├── ingredient.model.ts
│   │   │   ├── dish.model.ts
│   │   │   ├── day-plan.model.ts
│   │   │   ├── user-profile.model.ts
│   │   │   ├── training-plan.model.ts
│   │   │   ├── workout.model.ts
│   │   │   └── ai.model.ts
│   │   └── guards/
│   │       └── onboarding.guard.ts
│   │
│   ├── shared/                       # Reusable components, pipes, directives
│   │   ├── components/
│   │   │   ├── empty-state/
│   │   │   ├── confirm-dialog/
│   │   │   ├── nutrition-badge/
│   │   │   ├── search-toolbar/
│   │   │   ├── offline-banner/
│   │   │   └── loading-skeleton/
│   │   ├── pipes/
│   │   │   ├── calorie.pipe.ts
│   │   │   └── unit-format.pipe.ts
│   │   └── directives/
│   │       └── long-press.directive.ts
│   │
│   ├── features/                     # Feature modules (lazy loaded)
│   │   ├── dashboard/
│   │   │   ├── dashboard.page.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   └── components/
│   │   │       ├── ai-insight-card/
│   │   │       ├── nutrition-card/
│   │   │       ├── workout-card/
│   │   │       ├── streak-weight-card/
│   │   │       └── quick-actions/
│   │   │
│   │   ├── calendar/
│   │   │   ├── calendar.page.ts
│   │   │   ├── calendar.routes.ts
│   │   │   └── components/
│   │   │       ├── week-view/
│   │   │       ├── day-view/
│   │   │       ├── meal-slot/
│   │   │       ├── nutrition-summary/
│   │   │       ├── add-dish-modal/
│   │   │       └── ai-plan-preview/
│   │   │
│   │   ├── management/
│   │   │   ├── management.page.ts
│   │   │   ├── management.routes.ts
│   │   │   └── components/
│   │   │       ├── ingredient-list/
│   │   │       ├── ingredient-edit-modal/
│   │   │       ├── dish-list/
│   │   │       ├── dish-edit-modal/
│   │   │       ├── ai-autofill-preview/
│   │   │       └── filter-sheet/
│   │   │
│   │   ├── fitness/
│   │   │   ├── fitness.page.ts
│   │   │   ├── fitness.routes.ts
│   │   │   └── components/
│   │   │       ├── training-plan-card/
│   │   │       ├── workout-logger/
│   │   │       ├── exercise-picker/
│   │   │       ├── set-input/
│   │   │       ├── effort-emoji-picker/
│   │   │       ├── rest-timer/
│   │   │       └── progress-chart/
│   │   │
│   │   ├── settings/
│   │   │   ├── settings.page.ts
│   │   │   ├── settings.routes.ts
│   │   │   └── components/
│   │   │       ├── profile-editor/
│   │   │       ├── goal-settings/
│   │   │       ├── notification-settings/
│   │   │       ├── theme-settings/
│   │   │       └── about/
│   │   │
│   │   └── onboarding/
│   │       ├── onboarding.page.ts
│   │       ├── onboarding.routes.ts
│   │       └── components/
│   │           ├── goal-step/
│   │           └── profile-step/
│   │
│   └── tabs/
│       ├── tabs.page.ts               # ion-tabs wrapper (4 tabs)
│       └── tabs.routes.ts
│
├── assets/
│   ├── icon/
│   ├── images/
│   └── seed/                          # Seed data JSON files
│       ├── ingredients.json
│       └── exercises.json
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
├── theme/
│   └── variables.scss                 # Ionic CSS custom properties
├── global.scss
├── index.html
├── main.ts                            # bootstrapApplication()
└── test-setup.ts
```

---

## 3. Navigation — 4 Tabs + Settings Icon

### Tab Layout

```
┌──────────────────────────────┐
│ HealthMate AI           [⚙️] │  ← Settings icon (push page)
├──────────────────────────────┤
│                              │
│     (Tab content)            │
│                              │
├──────────────────────────────┤
│ [🏠]   [📅]   [🍽️]   [🏋️]  │  ← 4 tabs
│ Home  Calendar Mgmt  Fitness │
└──────────────────────────────┘
```

### Routes (lazy loaded)

```typescript
// src/app/app.routes.ts
export const routes: Routes = [
  {
    path: 'onboarding',
    loadComponent: () => import('./features/onboarding/onboarding.page'),
  },
  {
    path: '',
    component: TabsPage,
    canActivate: [onboardingGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes')
      },
      {
        path: 'calendar',
        loadChildren: () => import('./features/calendar/calendar.routes')
      },
      {
        path: 'management',
        loadChildren: () => import('./features/management/management.routes')
      },
      {
        path: 'fitness',
        loadChildren: () => import('./features/fitness/fitness.routes')
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: 'settings',
    loadChildren: () => import('./features/settings/settings.routes')
  }
];
```

### Tabs Component

```typescript
@Component({
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="dashboard">
          <ion-icon name="home-outline" />
          <ion-label>Tổng quan</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="calendar">
          <ion-icon name="calendar-outline" />
          <ion-label>Lịch ăn</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="management">
          <ion-icon name="restaurant-outline" />
          <ion-label>Quản lý</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="fitness">
          <ion-icon name="barbell-outline" />
          <ion-label>Tập luyện</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `
})
export class TabsPage {}
```

---

## 4. Database Layer — Repository Pattern

### Architecture

```
Feature/Store  →  Repository  →  DatabaseService  →  SQLite
                                   ├── WebDatabaseService (sql.js)
                                   └── NativeDatabaseService (Capacitor SQLite)
```

### DatabaseService (Abstract — 4 methods)

```typescript
export abstract class DatabaseService {
  abstract initialize(): Promise<void>;
  abstract execute(sql: string, params?: unknown[]): Promise<void>;
  abstract query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  abstract getOne<T>(sql: string, params?: unknown[]): Promise<T | null>;
}
```

### Factory Provider

```typescript
export function provideDatabaseService(): Provider {
  return {
    provide: DatabaseService,
    useFactory: () => {
      if (Capacitor.isNativePlatform()) {
        return new NativeDatabaseService();
      }
      return new WebDatabaseService();
    }
  };
}
```

### Repository Example

```typescript
@Injectable({ providedIn: 'root' })
export class IngredientRepository {
  private readonly db = inject(DatabaseService);

  async getAll(): Promise<Ingredient[]> {
    return this.db.query<Ingredient>('SELECT * FROM ingredient ORDER BY name');
  }

  async getById(id: string): Promise<Ingredient | null> {
    return this.db.getOne<Ingredient>('SELECT * FROM ingredient WHERE id = ?', [id]);
  }

  async insert(data: Omit<Ingredient, 'id' | 'created_at'>): Promise<Ingredient> {
    const id = crypto.randomUUID();
    await this.db.execute(
      `INSERT INTO ingredient (
         id, name, category,
         nutrition_basis_unit, nutrition_basis_quantity,
         calories, protein, carbs, fat, fiber,
         default_entry_unit, grams_per_unit, ml_per_unit,
         source
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name,
        data.category,
        data.nutrition_basis_unit,
        data.nutrition_basis_quantity,
        data.calories,
        data.protein,
        data.carbs,
        data.fat,
        data.fiber,
        data.default_entry_unit,
        data.grams_per_unit ?? null,
        data.ml_per_unit ?? null,
        data.source,
      ]
    );
    return this.getById(id) as Promise<Ingredient>;
  }

  async update(id: string, data: Partial<Ingredient>): Promise<void> {
    // Dynamic update query based on provided fields
  }

  async delete(id: string): Promise<void> {
    await this.db.execute('DELETE FROM ingredient WHERE id = ?', [id]);
  }

  async search(query: string): Promise<Ingredient[]> {
    return this.db.query<Ingredient>(
      'SELECT * FROM ingredient WHERE name LIKE ? ORDER BY name',
      [`%${query}%`]
    );
  }
}
```

---

## 5. State Management — Signal Stores

### Store Pattern

```typescript
@Injectable({ providedIn: 'root' })
export class IngredientStore {
  private readonly repo = inject(IngredientRepository);

  // State signals
  readonly ingredients = signal<Ingredient[]>([]);
  readonly loading = signal(false);
  readonly searchQuery = signal('');
  readonly error = signal<string | null>(null);

  // Computed
  readonly filtered = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.ingredients();
    return this.ingredients().filter(i =>
      i.name.toLowerCase().includes(query)
    );
  });

  readonly count = computed(() => this.ingredients().length);

  // Actions
  async loadAll(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await this.repo.getAll();
      this.ingredients.set(data);
    } catch (e) {
      this.error.set('Không thể tải dữ liệu');
    } finally {
      this.loading.set(false);
    }
  }

  async add(data: Omit<Ingredient, 'id' | 'created_at'>): Promise<void> {
    const created = await this.repo.insert(data);
    this.ingredients.update(list => [...list, created]);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
    this.ingredients.update(list => list.filter(i => i.id !== id));
  }
}
```

### Stores Mapping

| Store | Scope | Data | Used by |
|-------|-------|------|---------|
| `IngredientStore` | root | Ingredients list + search | Management, Calendar (picker) |
| `DishStore` | root | Dishes list + search | Management, Calendar (picker) |
| `DayPlanStore` | root | Day plans + meal slots | Calendar, Dashboard |
| `FitnessStore` | root | Training plans + workouts + progress | Fitness, Dashboard |
| `ProfileStore` | root | User profile + targets + settings | Settings, AI services, Dashboard |
| `DashboardStore` | root | Aggregated dashboard data | Dashboard |
| `UiStore` | root | Loading, offline status, theme | All features |

---

## 6. AI Layer — GeminiService + Strategies

### Architecture

```
Feature Component
    │
    ▼
AI Strategy Service (prompt building + response parsing)
    │
    ▼
GeminiService (HTTP call to Gemini API)
    │
    ▼
Google Gemini API
```

### GeminiService (Core — API caller + JSON parser)

```typescript
@Injectable({ providedIn: 'root' })
export class GeminiService {
  private readonly apiKey = environment.geminiApiKey;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  buildSystemInstruction(userProfile: UserProfile): string {
    // Build shared system instruction with {user_level} and {user_goal}
  }

  async generateContent(prompt: string, options?: AiOptions): Promise<string> {
    // HTTP POST to Gemini API (text-only)
    // Returns raw text response
  }

  async generateContentWithImage(image: Blob, prompt: string, options?: AiOptions): Promise<string> {
    // HTTP POST with image + prompt to Gemini Vision
    // Returns raw text response
  }

  parseJsonResponse<T>(response: string, schema: ZodSchema<T>): T {
    // Parse JSON from Gemini response, validate with schema
    // Throws on invalid JSON
  }
}
```

### AI Strategy Services

```typescript
@Injectable({ providedIn: 'root' })
export class NutritionAiService {
  private readonly gemini = inject(GeminiService);
  private readonly profile = inject(ProfileStore);
  private readonly dishRepo = inject(DishRepository);

  async lookupIngredient(name: string): Promise<IngredientLookupResult> { /* F-01 — Phase 1.5 */ }
  async autofillDish(dishName: string, dbIngredients: string[]): Promise<DishIngredient[]> { /* F-02 — Phase 1.5 */ }
  async analyzeImage(image: Blob, mealType: string, dbIngredients: string[]): Promise<FoodRecognition> { /* F-05 — Phase 5 */ }
  async suggestMenu(remaining: MacroRemaining, mealType: string, dbDishes: DishSummary[]): Promise<MenuSuggestion[]> { /* F-06 — Phase 5 */ }
  async planDay(date: string, targets: MacroTargets, dbDishes: DishSummary[]): Promise<DayMealPlan> { /* F-03 — Phase 2 */ }
  async planWeek(startDate: string, targets: MacroTargets, dbDishes: DishSummary[]): Promise<WeekMealPlan> { /* F-03 — Phase 2 */ }
}

@Injectable({ providedIn: 'root' })
export class FitnessAiService {
  private readonly gemini = inject(GeminiService);
  private readonly profile = inject(ProfileStore);

  async generateTrainingPlan(profile: UserProfile, frequency: number, equipment: string[], dbExercises: ExerciseSummary[]): Promise<TrainingPlan> { /* F-11 — Phase 5 */ }
}

@Injectable({ providedIn: 'root' })
export class InsightAiService {
  private readonly gemini = inject(GeminiService);
  private readonly profile = inject(ProfileStore);

  async dailyInsight(dayData: DaySummary, profile: UserProfile): Promise<DailyInsightResult> { /* F-07 — Phase 5 */ }
  async weeklyReview(weekData: WeekSummary, profile: UserProfile): Promise<WeeklyReviewResult> { /* F-07 — Phase 5 */ }
}
```

---

## 7. Cross-cutting Concerns

### 7.1 Offline Handling

```
Online:  App bình thường, AI features hoạt động
Offline: Banner "Không có mạng" + AI buttons disabled (xám) + Toast khi tap AI
```

```typescript
@Injectable({ providedIn: 'root' })
export class NetworkService {
  readonly isOnline = signal(true);

  constructor() {
    Network.addListener('networkStatusChange', (status) => {
      this.isOnline.set(status.connected);
    });
  }
}
```

### 7.2 Error Handling

| Loại lỗi | Hiển thị | Ví dụ |
|----------|---------|-------|
| **Nhẹ** | `ion-toast` (3 giây, tự ẩn) | AI fail, save thất bại, network timeout |
| **Nặng** | `ion-alert` (dialog, user phải dismiss) | DB corrupt, critical error |

### 7.3 Loading States

| Scenario | Component |
|----------|-----------|
| Lần load đầu (lists) | `ion-skeleton-text` |
| Actions (save, delete) | `ion-spinner` trong button |
| AI calls | `ion-spinner` + text "AI đang xử lý..." |

---

## 8. Capacitor Plugins

| Plugin | Version | Mục đích |
|--------|---------|---------|
| `@capacitor-community/sqlite` | latest | SQLite database |
| `@capacitor/camera` | latest | Chụp ảnh cho AI Image (F-05) |
| `@capacitor/local-notifications` | latest | 4 loại push notification |
| `@capacitor/network` | latest | Check online/offline |
| `@capacitor/filesystem` | latest | Installed for future use — backup/export hoãn V2, chưa wire trong V1 |
| `@capacitor/status-bar` | latest | Đổi màu theo theme |
| `@capacitor/splash-screen` | latest | Logo khi mở app |

---

## 9. Angular 21 Patterns

Tất cả code tuân thủ Angular 21 best practices:

| Pattern | Mô tả |
|---------|-------|
| **Standalone components** | Không dùng NgModule — tất cả components đều standalone (default từ v19) |
| **New control flow** | `@if`, `@for`, `@switch`, `@defer` thay vì `*ngIf`, `*ngFor` |
| **inject()** | Function-based injection thay vì constructor injection |
| **Signals** | `signal()`, `computed()`, `effect()` cho state management |
| **Signal Forms** | `form()` + `schema()` + `[formField]` từ `@angular/forms/signals` (stable v21) — pattern duy nhất cho mọi form mới. Migration B1→B5 hoàn tất 2026-04-27. Xem `docs/5-development/signal-forms-migration-plan.md`. |
| **Reactive Forms / FormsModule (legacy)** | KHÔNG dùng cho form mới. `@angular/forms/signals/compat` chỉ giữ làm escape hatch nếu thật sự cần. |
| **Route-level lazy loading** | `loadChildren` / `loadComponent` |
| **`@defer` blocks** | Lazy load heavy components (charts, AI preview) |

---

## 10. Build & Deploy

### Build Pipeline (GitHub Actions)

```yaml
# .github/workflows/build-apk.yml
name: Build APK
on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '21'

      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npx ionic build --prod
      - run: npx ionic capacitor sync android

      - name: Build APK
        run: cd android && ./gradlew assembleRelease

      - uses: actions/upload-artifact@v4
        with:
          name: app-release.apk
          path: android/app/build/outputs/apk/release/
```

### APK Signing

- **Keystore:** Local keystore file (`.jks`)
- **Lưu trữ:** Trên máy dev + backup an toàn
- **CI:** Keystore + password lưu trong GitHub Secrets

### Release Flow

```
1. Dev hoàn thành feature
2. Tag version: git tag v1.0.0
3. Push tag → GitHub Actions tự build APK
4. Download APK artifact
5. Test trên device
6. Upload lên Play Store Console (thủ công)
```

### NPM Scripts

```json
{
  "scripts": {
    "dev": "ionic serve",
    "build": "ionic build --prod",
    "lint": "ng lint",
    "lint:fix": "ng lint --fix",
    "test": "ng test",
    "test:coverage": "ng test --code-coverage --watch=false",
    "android:sync": "ionic build --prod && npx cap sync android",
    "android:run": "npx cap run android --livereload --external"
  }
}
```

> **Note:** Angular 21 default test runner là Karma + Jasmine (không phải Jest). Command `ng test` sử dụng Karma theo `angular.json` config.

---

## 11. Capacitor Config

```typescript
// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.healthmate.ai',
  appName: 'HealthMate AI',
  webDir: 'www',
  android: {
    buildOptions: {
      signingType: 'apksigner'
    }
  },
  plugins: {
    CapacitorSQLite: {
      androidIsEncryption: false
    },
    SplashScreen: {
      launchAutoHide: false,
      androidSplashResourceName: 'splash'
    },
    LocalNotifications: {
      smallIcon: 'ic_notification',
      iconColor: '#4CAF50'
    }
  }
};

export default config;
```

---

## 12. Feature Lazy Loading Map

| Route | Lazy Loaded | Components | Stores used |
|-------|:-----------:|-----------|-------------|
| `/dashboard` | ✅ | 5 cards + quick actions | DashboardStore, DayPlanStore, FitnessStore |
| `/calendar` | ✅ | Week view, Day view, meal slots, AI plan | DayPlanStore, DishStore, NutritionAiService |
| `/management` | ✅ | Ingredient CRUD, Dish CRUD, AI autofill | IngredientStore, DishStore, NutritionAiService |
| `/fitness` | ✅ | Training plans, workout logger, progress charts | FitnessStore, FitnessAiService |
| `/settings` | ✅ | Profile, goals, notifications, theme, about | ProfileStore |
| `/onboarding` | ✅ | Goal step, profile step | ProfileStore |

---

## 13. Environment Config

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  geminiApiKey: 'YOUR_DEV_KEY',
  geminiModel: 'gemini-2.0-flash',
  dbName: 'healthmate_dev.db'
};

// src/environments/environment.prod.ts
export const environment = {
  production: true,
  geminiApiKey: 'YOUR_PROD_KEY',
  geminiModel: 'gemini-2.0-flash',
  dbName: 'healthmate.db'
};
```
